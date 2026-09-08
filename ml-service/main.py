import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model.joblib')

# Load or auto-train model on startup
model_pipeline = None

def load_or_train_model():
    global model_pipeline
    if os.path.exists(MODEL_PATH):
        try:
            model_pipeline = joblib.load(MODEL_PATH)
            print(f"[ML Service] Loaded model from {MODEL_PATH}")
        except Exception as e:
            print(f"[ML Service] Error loading model: {e}. Retraining...")
            from train_model import train_and_save_model
            model_pipeline = train_and_save_model()
    else:
        print("[ML Service] model.joblib not found. Training model now...")
        from train_model import train_and_save_model
        model_pipeline = train_and_save_model()

load_or_train_model()

app = FastAPI(
    title="SecureBank AI Fraud Detection Service",
    description="Microservice providing machine learning inference for real-time banking fraud prediction.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransactionFeatures(BaseModel):
    amount: float = Field(..., description="Transaction transfer amount", ge=0)
    transaction_frequency: Optional[int] = Field(default=1, description="Number of transfers sent today/recent window")
    account_age: Optional[int] = Field(default=180, description="Account age in days")
    transaction_hour: Optional[int] = Field(default=12, description="Hour of the transaction (0-23)")
    previous_average_amount: Optional[float] = Field(default=None, description="Historical average transfer amount")
    failed_attempts: Optional[int] = Field(default=0, description="Recent failed auth or OTP attempts")
    location_change: Optional[int] = Field(default=0, description="Flag indicating unexpected IP/geolocation change (0 or 1)")
    is_new_beneficiary: Optional[int] = Field(default=None, description="Flag indicating new counterparty recipient (0 or 1)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "amount": 200000,
                "transaction_frequency": 12,
                "transaction_hour": 2,
                "failed_attempts": 1
            }
        }
    }

class PredictionResponse(BaseModel):
    fraud_probability: float
    risk_level: str
    risk_score: int
    features_received: dict
    model_version: str

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "SecureBank AI Fraud Detection",
        "model_loaded": model_pipeline is not None,
        "framework": "scikit-learn RandomForestClassifier",
        "version": "1.0.0"
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_fraud(features: TransactionFeatures):
    if model_pipeline is None:
        raise HTTPException(status_code=503, detail="ML model is not loaded or initialized")

    try:
        # Impute intelligent defaults if not explicitly provided
        prev_avg = features.previous_average_amount
        if prev_avg is None:
            prev_avg = max(100.0, features.amount * 0.4)

        is_new_bene = features.is_new_beneficiary
        if is_new_bene is None:
            # Heuristic default: large transfers with high frequency often target new accounts
            is_new_bene = 1 if features.amount > 5000 or features.transaction_frequency > 3 else 0

        # Construct single-row DataFrame with exact feature columns
        input_data = pd.DataFrame([{
            'amount': float(features.amount),
            'transaction_frequency': int(features.transaction_frequency),
            'account_age': int(features.account_age),
            'transaction_hour': int(features.transaction_hour),
            'previous_average_amount': float(prev_avg),
            'failed_attempts': int(features.failed_attempts),
            'location_change': int(features.location_change),
            'is_new_beneficiary': int(is_new_bene)
        }])

        # Predict probability of class 1 (fraud)
        probabilities = model_pipeline.predict_proba(input_data)[0]
        fraud_prob = float(probabilities[1])

        # Enforce realistic risk boundary based on inputs
        # (e.g. extremely large amounts or night bursts always show elevated probability)
        if features.amount >= 100000 or (features.amount >= 5000 and features.transaction_hour in [0, 1, 2, 3, 4]):
            fraud_prob = max(fraud_prob, 0.85)
        elif features.amount < 100 and features.failed_attempts == 0 and features.transaction_frequency <= 2:
            fraud_prob = min(fraud_prob, 0.10)

        fraud_prob = round(fraud_prob, 2)
        risk_score = int(round(fraud_prob * 100))

        # Determine risk level
        if fraud_prob >= 0.70:
            risk_level = "HIGH"
        elif fraud_prob >= 0.35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return PredictionResponse(
            fraud_probability=fraud_prob,
            risk_level=risk_level,
            risk_score=risk_score,
            features_received=features.model_dump(),
            model_version="1.0.0-rf"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
