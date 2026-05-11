import httpx
import asyncio
import json
import time

GATEWAY_URL = "http://localhost:8001"

async def test_diagnostics():
    print("Waiting 10s for services to settle...")
    await asyncio.sleep(10)
    async with httpx.AsyncClient(timeout=30.0) as client:
        report = []
        report.append("# Diagnostics Service Test Report\n")
        
        # 1. Test Risk Assessment (Public Endpoint)
        print("Testing Risk Assessment...")
        risk_payload = {"temperature": 32.5, "humidity": 85.0}
        try:
            resp = await client.post(f"{GATEWAY_URL}/diagnostics/api/v1/risk-assessment", json=risk_payload)
            if resp.status_code == 200:
                report.append("## 1. Risk Assessment Test: SUCCESS")
                report.append(f"Input: {risk_payload}")
                report.append(f"Output: {json.dumps(resp.json(), indent=2)}\n")
            else:
                report.append(f"## 1. Risk Assessment Test: FAILED (Status: {resp.status_code})")
                report.append(f"Error: {resp.text}\n")
        except Exception as e:
            report.append(f"## 1. Risk Assessment Test: ERROR\nException: {str(e)}\n")

        # 2. Setup Auth for Diagnosis Test
        print("Setting up test user...")
        timestamp = int(time.time())
        reg_payload = {
            "email": f"tester_{timestamp}@example.com",
            "password": "password123",
            "full_name": "Diagnostic Tester",
            "role": "FARMER"
        }
        try:
            reg_resp = await client.post(f"{GATEWAY_URL}/users/api/v1/register", json=reg_payload)
            if reg_resp.status_code not in [200, 201]:
                report.append(f"## 2. Auth Setup: FAILED\n{reg_resp.text}\n")
                print(f"Auth setup failed: {reg_resp.text}")
                return report
            
            token = reg_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            report.append("## 2. Auth Setup: SUCCESS\nTest user registered and token obtained.\n")
        except Exception as e:
            report.append(f"## 2. Auth Setup: ERROR\nException: {str(e)}\n")
            return report

        # 3. Test Diagnosis Submission
        print("Testing Diagnosis Submission...")
        diag_payload = {
            "field_id": "00000000-0000-0000-0000-000000000000", # Mock UUID
            "image_url": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Potato___Late_blight/006951d5-1bb9-4633-88db-aefa0540da57___RS_LB%202736.JPG",
            "crop_type": "Potato"
        }
        try:
            diag_resp = await client.post(f"{GATEWAY_URL}/diagnostics/api/v1/diagnose", json=diag_payload, headers=headers)
            if diag_resp.status_code in [200, 201]:
                report.append("## 3. Diagnosis Submission: SUCCESS")
                diag_data = diag_resp.json()
                report.append(f"Initial Status: {diag_data['status']}")
                
                # Poll for AI results (background task)
                diag_id = diag_data["id"]
                print(f"Polling for AI results (ID: {diag_id})...")
                max_retries = 10
                for _ in range(max_retries):
                    await asyncio.sleep(3)
                    poll_resp = await client.get(f"{GATEWAY_URL}/diagnostics/api/v1/diagnose/{diag_id}", headers=headers)
                    poll_data = poll_resp.json()
                    if poll_data.get("ai_result"):
                        report.append("### AI Inference Result:")
                        report.append(f"- Disease: {poll_data['ai_result']['suggested_disease']}")
                        report.append(f"- Confidence: {poll_data['ai_result']['confidence_score']}")
                        report.append(f"- **Suggested Treatment**: {poll_data['ai_result'].get('suggested_treatment', 'N/A')}")
                        report.append(f"- Processed At: {poll_data['ai_result']['processed_at']}")
                        break
                else:
                    report.append("### AI Inference Result: TIMEOUT (Background task taking too long)")
            else:
                report.append(f"## 3. Diagnosis Submission: FAILED (Status: {diag_resp.status_code})")
                report.append(f"Error: {diag_resp.text}\n")
        except Exception as e:
            report.append(f"## 3. Diagnosis Submission: ERROR\nException: {str(e)}\n")

        return report

async def main():
    print("Starting Diagnostics Service Test...")
    report_lines = await test_diagnostics()
    
    with open("diagnostics_test_report.txt", "w") as f:
        f.write("\n".join(report_lines))
    
    print("Test complete. Report generated: diagnostics_test_report.txt")

if __name__ == "__main__":
    asyncio.run(main())
