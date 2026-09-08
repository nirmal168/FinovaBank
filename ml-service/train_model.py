import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score
import joblib

# Set random seed for reproducibility
np.random.seed(42)

FEATURE_COLUMNS = [
    'amount',
    'transaction_frequency',
    'account_age',
    'transaction_hour',
    'previous_average_amount',
    'failed_attempts',
    'location_change',
    'is_new_beneficiary'
]

def generate_synthetic_data(n_samples=15000, fraud_ratio=0.12):
    """
    Generate realistic synthetic banking transaction data with normal and fraudulent patterns.
    """
    n_fraud = int(n_samples * fraud_ratio)
    n_legit = n_samples - n_fraud

    # --- 1. Legitimate Transactions ---
    legit_amount = np.random.exponential(scale=250.0, size=n_legit) + 10.0
    legit_amount = np.clip(legit_amount, 5.0, 3500.0)
    
    legit_freq = np.random.poisson(lam=2.0, size=n_legit) + 1
    legit_freq = np.clip(legit_freq, 1, 6)

    legit_account_age = np.random.randint(30, 1800, size=n_legit)

    # Legitimate hours mostly 7 AM - 11 PM
    p_legit = np.array([
        0.01, 0.01, 0.01, 0.01, 0.01, 0.02, # 00-05 AM
        0.04, 0.06, 0.08, 0.08, 0.07, 0.07, # 06-11 AM
        0.08, 0.07, 0.06, 0.06, 0.06, 0.06, # 12-17 PM
        0.05, 0.04, 0.03, 0.02, 0.01, 0.01  # 18-23 PM
    ], dtype=np.float64)
    p_legit /= p_legit.sum()
    legit_hours = np.random.choice(range(24), size=n_legit, p=p_legit)

    # Previous average amount is reasonably close to amount
    legit_prev_avg = legit_amount * np.random.uniform(0.6, 1.6, size=n_legit)
    legit_failed = np.random.choice([0, 1], size=n_legit, p=[0.96, 0.04])
    legit_loc_change = np.random.choice([0, 1], size=n_legit, p=[0.95, 0.05])
    legit_new_bene = np.random.choice([0, 1], size=n_legit, p=[0.82, 0.18])

    df_legit = pd.DataFrame({
        'amount': legit_amount,
        'transaction_frequency': legit_freq,
        'account_age': legit_account_age,
        'transaction_hour': legit_hours,
        'previous_average_amount': legit_prev_avg,
        'failed_attempts': legit_failed,
        'location_change': legit_loc_change,
        'is_new_beneficiary': legit_new_bene,
        'is_fraud': 0
    })

    # --- 2. Fraudulent Transactions ---
    # High or abnormal amounts
    fraud_amount = np.random.lognormal(mean=9.2, sigma=1.2, size=n_fraud)
    fraud_amount = np.clip(fraud_amount, 2500.0, 500000.0)

    fraud_freq = np.random.poisson(lam=7.0, size=n_fraud) + 2
    fraud_freq = np.clip(fraud_freq, 3, 25)

    fraud_account_age = np.concatenate([
        np.random.randint(1, 30, size=n_fraud // 2),
        np.random.randint(30, 1200, size=n_fraud - n_fraud // 2)
    ])
    np.random.shuffle(fraud_account_age)

    # Fraudulent hours frequently nocturnal (1 AM - 5 AM) or irregular
    p_fraud = np.array([
        0.08, 0.12, 0.14, 0.12, 0.09, 0.06, # 00-05 AM (High concentration)
        0.03, 0.02, 0.02, 0.02, 0.03, 0.03, # 06-11 AM
        0.03, 0.03, 0.03, 0.03, 0.03, 0.03, # 12-17 PM
        0.02, 0.02, 0.02, 0.02, 0.01, 0.01  # 18-23 PM
    ], dtype=np.float64)
    p_fraud /= p_fraud.sum()
    fraud_hours = np.random.choice(range(24), size=n_fraud, p=p_fraud)

    # Sharp deviation from past average
    fraud_prev_avg = np.random.uniform(50.0, 1200.0, size=n_fraud)
    fraud_failed = np.random.choice([0, 1, 2, 3], size=n_fraud, p=[0.25, 0.35, 0.25, 0.15])
    fraud_loc_change = np.random.choice([0, 1], size=n_fraud, p=[0.30, 0.70])
    fraud_new_bene = np.random.choice([0, 1], size=n_fraud, p=[0.12, 0.88])

    df_fraud = pd.DataFrame({
        'amount': fraud_amount,
        'transaction_frequency': fraud_freq,
        'account_age': fraud_account_age,
        'transaction_hour': fraud_hours,
        'previous_average_amount': fraud_prev_avg,
        'failed_attempts': fraud_failed,
        'location_change': fraud_loc_change,
        'is_new_beneficiary': fraud_new_bene,
        'is_fraud': 1
    })

    # Combine and shuffle
    df = pd.concat([df_legit, df_fraud], ignore_index=True)
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df

def train_and_save_model(data_path=None, model_path=None):
    """
    Train a classification model and serialize the pipeline to disk.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if data_path is None:
        data_path = os.path.join(base_dir, 'synthetic_transactions.csv')
    if model_path is None:
        model_path = os.path.join(base_dir, 'model.joblib')

    print(f"[ML Service] Generating synthetic dataset ({15000} samples)...")
    df = generate_synthetic_data(n_samples=15000, fraud_ratio=0.12)
    df.to_csv(data_path, index=False)
    print(f"[ML Service] Dataset saved to {data_path}")
    print(f"[ML Service] Total records: {len(df)}, Fraud cases: {df['is_fraud'].sum()} ({df['is_fraud'].mean():.1%})")

    X = df[FEATURE_COLUMNS]
    y = df['is_fraud']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print("\n[ML Service] Training RandomForestClassifier pipeline...")
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            min_samples_split=5,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        ))
    ])

    pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)

    print("\n--- Model Evaluation Results ---")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"ROC-AUC:  {roc_auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Fraud']))

    # Save serialized model
    joblib.dump(pipeline, model_path)
    print(f"[ML Service] Trained model pipeline successfully saved to {model_path}")

    return pipeline

if __name__ == '__main__':
    train_and_save_model()
