import asyncio
import os
import sys
from dotenv import load_dotenv
load_dotenv()

# Add parent directory to path to import api
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.services.email_service import email_service

async def run_test():
    print("Testing SMTP Email Service...")
    
    recipient = "joshuaimman2004@gmail.com" # Default to self
    subject = "Manual SMTP Test - Dr. Plant"
    body = "If you see this, the aiosmtplib integration is working correctly!"
    
    success = await email_service.send_email(
        subject=subject,
        recipients=[recipient],
        body=body
    )
    
    if success:
        print(f"SUCCESS: Email sent to {recipient}")
    else:
        print("FAILURE: Email could not be sent. Check your SMTP credentials and network.")

if __name__ == "__main__":
    asyncio.run(run_test())
