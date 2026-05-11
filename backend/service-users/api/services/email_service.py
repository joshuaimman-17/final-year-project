import os
import aiosmtplib
from email.message import EmailMessage
from typing import List, Optional

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.sender_name = "Dr. Plant"

    async def send_email(
        self, 
        subject: str, 
        recipients: List[str], 
        body: str, 
        html_content: Optional[str] = None
    ):
        if not self.smtp_user or not self.smtp_password:
            print("Email Service Error: SMTP credentials not configured.")
            return False

        message = EmailMessage()
        message["From"] = f"{self.sender_name} <{self.smtp_user}>"
        message["To"] = ", ".join(recipients)
        message["Subject"] = subject
        message.set_content(body)

        if html_content:
            message.add_alternative(html_content, subtype="html")

        try:
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True,
            )
            return True
        except Exception as e:
            print(f"Email Service Error: {str(e)}")
            return False

email_service = EmailService()
