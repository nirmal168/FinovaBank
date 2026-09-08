import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import otpService from '../../services/otpService';
import { ShieldCheck, RefreshCw, AlertCircle, Clock, Lock, Sparkles } from 'lucide-react';

const OtpModal = ({
  isOpen,
  onClose,
  onVerify,
  email,
  purpose = 'TRANSFER',
  title = 'Security Verification',
  description,
  loading = false,
  error: externalError,
  devOtp: initialDevOtp,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 minutes (300s)
  const [cooldown, setCooldown] = useState(60); // 60s resend cooldown
  const [resending, setResending] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [activeDevOtp, setActiveDevOtp] = useState(initialDevOtp);
  const inputRefs = useRef([]);

  // Sync devOtp if changed externally
  useEffect(() => {
    if (initialDevOtp) {
      setActiveDevOtp(initialDevOtp);
    }
  }, [initialDevOtp]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setTimer(300);
      setCooldown(60);
      setLocalError(null);
      if (initialDevOtp) setActiveDevOtp(initialDevOtp);
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 100);
    }
  }, [isOpen, initialDevOtp]);

  // Countdown timers
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleDigitChange = (index, value) => {
    const char = value.slice(-1); // Only last entered char
    if (!/^[0-9]?$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setLocalError(null);

    // Auto advance to next input
    if (char && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto submit if all 6 digits entered
    if (char && index === 5 && newDigits.every((d) => d !== '')) {
      onVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^[0-9]{6}$/.test(pasted)) {
      const pasteDigits = pasted.split('');
      setDigits(pasteDigits);
      if (inputRefs.current[5]) inputRefs.current[5].focus();
      onVerify(pasted);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    try {
      setResending(true);
      setLocalError(null);
      const res = await otpService.resendOtp({ email, purpose });
      if (res?.devOtp) setActiveDevOtp(res.devOtp);
      setCooldown(60);
      setTimer(300);
      setDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      setLocalError(err.message || 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const displayedError = externalError || localError;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-5 text-center">
        {/* Shield Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">Enter Verification Code</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {description || `A 6-digit authentication passcode was sent to ${email || 'your registered email'}.`}
          </p>
        </div>

        {/* Development Helper Badge */}
        {activeDevOtp && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Dev Passcode: <strong className="font-mono text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-amber-300">{activeDevOtp}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                const parts = activeDevOtp.split('');
                setDigits(parts);
                onVerify(activeDevOtp);
              }}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs"
            >
              Auto-Fill
            </button>
          </div>
        )}

        {/* 6 Digit Inputs */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-4" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-13 text-center text-xl font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono text-slate-900"
            />
          ))}
        </div>

        {/* Error Alert */}
        {displayedError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{displayedError}</span>
          </div>
        )}

        {/* Timer & Cooldown */}
        <div className="flex items-center justify-between text-xs px-2 text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Code expires in: <strong className={timer < 60 ? 'text-rose-600 font-bold' : 'text-slate-800 font-bold'}>{formatTimer(timer)}</strong></span>
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className={`font-semibold transition flex items-center gap-1 ${
              cooldown > 0
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-indigo-600 hover:text-indigo-800'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onVerify(digits.join(''))}
            disabled={digits.some((d) => d === '') || loading || timer === 0}
          >
            {loading ? 'Verifying...' : 'Verify & Authorize'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OtpModal;
