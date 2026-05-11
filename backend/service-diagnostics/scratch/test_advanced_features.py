import asyncio
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.services.treatment_service import treatment_service
from api.services.risk_service import risk_service

async def test_advanced_features():
    print("--- Testing Treatment Service ---")
    diseases = ["Potato Late Blight", "Apple Scab", "Aphids on leaves", "Unknown Fungus"]
    for d in diseases:
        treatment = treatment_service.get_suggested_treatment(d)
        print(f"Disease: {d} => Suggested: {treatment}")

    print("\n--- Testing Risk Service ---")
    scenarios = [
        {"temp": 30.0, "hum": 80.0}, # High Risk
        {"temp": 25.0, "hum": 60.0}, # Low Risk
        {"temp": 30.0, "hum": 50.0}, # Medium Risk
    ]
    for s in scenarios:
        risk = risk_service.analyze_outbreak_risk(s["temp"], s["hum"])
        print(f"Conditions: {s} => Risk: {risk['risk_level']} ({risk['message']})")

if __name__ == "__main__":
    asyncio.run(test_advanced_features())
