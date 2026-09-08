const Transaction = require('../models/Transaction');
const Beneficiary = require('../models/Beneficiary');
const Otp = require('../models/Otp');

/**
 * Hybrid AI & Rule-Based Fraud Detection Service
 * Connects to external Python FastAPI ML inference service with an automatic
 * rule-based heuristic fallback if the ML microservice is unavailable.
 */
class FraudDetectionService {
  /**
   * Invoke Python FastAPI ML inference service
   */
  async predictAiFraud({
    amount,
    transactionFrequency = 1,
    accountAge = 180,
    transactionHour = 12,
    previousAverageAmount = null,
    failedAttempts = 0,
    locationChange = 0,
    isNewBeneficiary = 0,
  }) {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout

      const response = await fetch(`${mlUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          transaction_frequency: parseInt(transactionFrequency) || 1,
          account_age: parseInt(accountAge) || 180,
          transaction_hour: parseInt(transactionHour) ?? 12,
          previous_average_amount: previousAverageAmount ? parseFloat(previousAverageAmount) : null,
          failed_attempts: parseInt(failedAttempts) || 0,
          location_change: locationChange ? 1 : 0,
          is_new_beneficiary: isNewBeneficiary ? 1 : 0,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Service responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        available: true,
        fraudProbability: data.fraud_probability,
        riskLevel: data.risk_level,
        riskScore: data.risk_score,
        modelVersion: data.model_version || '1.0.0-rf',
      };
    } catch (err) {
      console.warn(
        `[FraudDetectionService] Python ML microservice unavailable (${err.message}). Seamlessly engaging rule-based heuristic engine fallback.`
      );
      return {
        available: false,
        fallback: true,
        error: err.message,
      };
    }
  }

  /**
   * Analyze transaction risk across behavioral heuristics and AI ML prediction
   */
  async analyzeTransaction({ user, senderAccount, receiverAccount, amount }) {
    const factors = [];
    const userId = user._id || user.id;
    const now = new Date();
    let historicalAvg = null;
    let todayCount = 0;
    let isNewBeneFlag = 0;
    let failedCount = 0;

    // 1. Transaction Amount Rule
    if (amount >= 10000) {
      factors.push({
        rule: 'EXTREME_AMOUNT',
        points: 30,
        detail: `Transfer amount of $${amount.toFixed(2)} is an exceptionally high institutional value`,
      });
    } else if (amount >= 5000) {
      factors.push({
        rule: 'LARGE_AMOUNT',
        points: 20,
        detail: `Transfer amount of $${amount.toFixed(2)} meets high-value risk threshold ($5,000.00)`,
      });
    } else if (amount >= 2500) {
      factors.push({
        rule: 'ELEVATED_AMOUNT',
        points: 10,
        detail: `Transfer amount of $${amount.toFixed(2)} exceeds standard retail transfer baseline ($2,500.00)`,
      });
    }

    // 2. Average Historical Transaction Amount & Variance
    try {
      const historicalStats = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'TRANSFER',
            status: 'COMPLETED',
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]);

      if (historicalStats.length > 0 && historicalStats[0].count > 0) {
        historicalAvg = historicalStats[0].totalAmount / historicalStats[0].count;
        if (historicalAvg > 0) {
          const ratio = amount / historicalAvg;
          if (ratio >= 5 && amount > 500) {
            factors.push({
              rule: 'HIGH_HISTORICAL_DEVIATION',
              points: 25,
              detail: `Transfer amount is ${ratio.toFixed(1)}x greater than sender's historical average of $${historicalAvg.toFixed(2)}`,
            });
          } else if (ratio >= 3 && amount > 300) {
            factors.push({
              rule: 'MODERATE_HISTORICAL_DEVIATION',
              points: 15,
              detail: `Transfer amount is ${ratio.toFixed(1)}x greater than sender's historical average of $${historicalAvg.toFixed(2)}`,
            });
          }
        }
      }
    } catch (e) {
      console.warn('[FraudService] Historical deviation check error:', e.message);
    }

    // 3. Transaction Frequency (Daily volume)
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      todayCount = await Transaction.countDocuments({
        user: userId,
        type: 'TRANSFER',
        status: 'COMPLETED',
        createdAt: { $gte: startOfDay },
      });

      if (todayCount >= 10) {
        factors.push({
          rule: 'EXCESSIVE_DAILY_FREQUENCY',
          points: 25,
          detail: `Unusually high frequency: ${todayCount} transfers already completed today`,
        });
      } else if (todayCount >= 5) {
        factors.push({
          rule: 'ELEVATED_DAILY_FREQUENCY',
          points: 15,
          detail: `Elevated daily frequency: ${todayCount} transfers already completed today`,
        });
      }
    } catch (e) {
      console.warn('[FraudService] Frequency check error:', e.message);
    }

    // 4. New Beneficiary Detection
    try {
      const targetAccNum = receiverAccount.accountNumber;
      const [previousTxCount, beneficiary] = await Promise.all([
        Transaction.countDocuments({
          user: userId,
          type: 'TRANSFER',
          receiverAccount: targetAccNum,
          status: 'COMPLETED',
        }),
        Beneficiary.findOne({
          user: userId,
          accountNumber: targetAccNum,
        }),
      ]);

      if (beneficiary) {
        const beneficiaryAgeHours = (now - new Date(beneficiary.createdAt)) / (1000 * 60 * 60);
        if (beneficiaryAgeHours < 24) {
          isNewBeneFlag = 1;
          factors.push({
            rule: 'NEW_BENEFICIARY_RECENT',
            points: 20,
            detail: `Transfer to newly registered beneficiary (#${targetAccNum}) added within the last 24 hours`,
          });
        }
      } else if (previousTxCount === 0) {
        isNewBeneFlag = 1;
        factors.push({
          rule: 'FIRST_TIME_RECIPIENT',
          points: 15,
          detail: `First-time transfer to counterparty account #${targetAccNum} with no prior transaction history`,
        });
      }
    } catch (e) {
      console.warn('[FraudService] Beneficiary check error:', e.message);
    }

    // 5. Transaction Time (Nocturnal high-risk window: 1:00 AM - 5:00 AM)
    const localHour = now.getHours();
    if (localHour >= 1 && localHour <= 5) {
      factors.push({
        rule: 'NOCTURNAL_TRANSACTION_TIME',
        points: 15,
        detail: `Transaction initiated during high-risk nocturnal hours (${localHour}:00)`,
      });
    }

    // 6. Recent Failed Attempts (Auth or OTP failures in past 2 hours)
    try {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const [failedTxCount, recentFailedOtp] = await Promise.all([
        Transaction.countDocuments({
          user: userId,
          status: 'FAILED',
          createdAt: { $gte: twoHoursAgo },
        }),
        Otp.findOne({
          email: user.email,
          attempts: { $gt: 0 },
          updatedAt: { $gte: twoHoursAgo },
        }),
      ]);

      if (failedTxCount > 0 || (recentFailedOtp && recentFailedOtp.attempts > 0)) {
        failedCount = (failedTxCount || 0) + (recentFailedOtp?.attempts || 0);
        factors.push({
          rule: 'RECENT_FAILED_ATTEMPTS',
          points: 20,
          detail: `Recent security warnings or failed attempts recorded on account in past 2 hours`,
        });
      }
    } catch (e) {
      console.warn('[FraudService] Failed attempts check error:', e.message);
    }

    // 7. Rapid Transactions (Velocity check in last 10 minutes)
    try {
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const recentVelocityCount = await Transaction.countDocuments({
        user: userId,
        type: 'TRANSFER',
        createdAt: { $gte: tenMinutesAgo },
      });

      if (recentVelocityCount >= 3) {
        factors.push({
          rule: 'HIGH_TRANSACTION_VELOCITY',
          points: 30,
          detail: `Rapid velocity alert: ${recentVelocityCount} transfer activities recorded within the last 10 minutes`,
        });
      } else if (recentVelocityCount >= 1) {
        factors.push({
          rule: 'RAPID_TRANSACTION_BURST',
          points: 20,
          detail: `Rapid consecutive transfer within 10 minutes of preceding account activity`,
        });
      }
    } catch (e) {
      console.warn('[FraudService] Velocity check error:', e.message);
    }

    // 8. Unusual Behavior / Account Balance Drain
    if (senderAccount.balance > 0) {
      const drainPercentage = (amount / senderAccount.balance) * 100;
      if (drainPercentage >= 80) {
        factors.push({
          rule: 'CRITICAL_BALANCE_DRAIN',
          points: 20,
          detail: `Severe balance drain: transfer depletes ${drainPercentage.toFixed(0)}% of total available account balance`,
        });
      } else if (drainPercentage >= 60) {
        factors.push({
          rule: 'SUBSTANTIAL_BALANCE_DRAWDOWN',
          points: 10,
          detail: `Substantial balance drawdown: transfer requests ${drainPercentage.toFixed(0)}% of available funds`,
        });
      }
    }

    // --- AI MACHINE LEARNING INFERENCE ---
    const accountCreatedAt = senderAccount.createdAt || user.createdAt || new Date();
    const accountAgeDays = Math.max(1, Math.floor((now - new Date(accountCreatedAt)) / (1000 * 60 * 60 * 24)));

    const aiInference = await this.predictAiFraud({
      amount,
      transactionFrequency: Math.max(1, todayCount),
      accountAge: accountAgeDays,
      transactionHour: localHour,
      previousAverageAmount: historicalAvg,
      failedAttempts: failedCount,
      locationChange: 0,
      isNewBeneficiary: isNewBeneFlag,
    });

    let aiRiskScore = null;
    let aiFraudProbability = null;

    if (aiInference.available) {
      aiFraudProbability = aiInference.fraudProbability;
      aiRiskScore = aiInference.riskScore;

      // Add factor detailing the AI prediction
      const aiPoints = Math.round(aiFraudProbability * 35);
      factors.push({
        rule: 'AI_ML_MODEL_CLASSIFICATION',
        points: aiPoints,
        detail: `Scikit-learn AI model predicted ${(aiFraudProbability * 100).toFixed(0)}% fraud probability (Tier: ${aiInference.riskLevel})`,
      });
    }

    // Aggregate Score (Blending Rule-based heuristics with ML probability if available)
    const rawScore = factors.reduce((sum, f) => sum + f.points, 0);
    let riskScore = Math.min(100, Math.max(0, rawScore));

    if (aiInference.available && aiFraudProbability >= 0.70) {
      riskScore = Math.max(riskScore, Math.round(aiFraudProbability * 100));
    }

    // Determine Risk Level
    let riskLevel = 'LOW';
    if (riskScore >= 71) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 31) {
      riskLevel = 'MEDIUM';
    }

    // Generate Human-Readable Reason
    let reason = 'Normal low-risk transactional pattern.';
    if (factors.length > 0) {
      const sorted = [...factors].sort((a, b) => b.points - a.points);
      reason = sorted.slice(0, 3).map((f) => f.detail).join('; ');
    }

    return {
      riskScore,
      riskLevel,
      reason,
      factors,
      aiInference: aiInference.available
        ? {
            fraudProbability: aiFraudProbability,
            predictedRiskLevel: aiInference.riskLevel,
            modelVersion: aiInference.modelVersion,
          }
        : {
            fallbackEngaged: true,
            reason: aiInference.error || 'ML microservice offline',
          },
    };
  }
}

module.exports = new FraudDetectionService();
