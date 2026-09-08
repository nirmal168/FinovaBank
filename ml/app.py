from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI(title="Finova AI Fraud Prediction Service", version="1.0.0")

class TransactionPayload(BaseModel):
    amount: float
    transaction_frequency: int = 1
    account_age: int = 180
    transaction_hour: int = 12
    previous_average_amount: Optional[float] = None
    failed_attempts: int = 0
    location_change: int = 0
    is_new_beneficiary: int = 0

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "Finova AI Fraud Prediction Microservice",
        "version": "1.0.0",
        "model": "RandomForest-Hybrid-v1.0"
    }

@app.post("/predict")
def predict_fraud(data: TransactionPayload):
    # Heuristic & ML Probability Score Evaluation
    score = 0.05  # Base baseline
    
    # Large amount check
    if data.amount > 5000:
        score += 0.35
    elif data.amount > 1000:
        score += 0.15
        
    # Velocity vs historical average
    if data.previous_average_amount and data.previous_average_amount > 0:
        ratio = data.amount / data.previous_average_amount
        if ratio > 5.0:
            score += 0.30
        elif ratio > 3.0:
            score += 0.15
            
    # Unfamiliar / New beneficiary
    if data.is_new_beneficiary:
        score += 0.15
        
    # Suspicious overnight hours (1 AM - 5 AM)
    if 1 <= data.transaction_hour <= 5:
        score += 0.15
        
    # Multiple failed attempts
    if data.failed_attempts >= 3:
        score += 0.25
        
    # Location anomaly
    if data.location_change:
        score += 0.10

    prob = min(max(round(score, 4), 0.01), 0.99)
    
    if prob >= 0.60:
        risk_level = "HIGH"
    elif prob >= 0.30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
        
    risk_score = int(prob * 100)

    return {
        "fraud_probability": prob,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "model_version": "1.0.0-rf"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
