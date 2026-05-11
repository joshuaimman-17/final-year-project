import os
import httpx
from fastapi import Request, Response

SERVICES = {
    "users": os.getenv("SERVICE_USERS_URL", "http://127.0.0.1:8002"),
    "farms": os.getenv("SERVICE_FARMS_URL", "http://127.0.0.1:8003"),
    "diagnostics": os.getenv("SERVICE_DIAGNOSTICS_URL", "http://127.0.0.1:8004"),
    "marketplace": os.getenv("SERVICE_MARKETPLACE_URL", "http://127.0.0.1:8005"),
    "community": os.getenv("SERVICE_COMMUNITY_URL", "http://127.0.0.1:8006"),
    "chat": os.getenv("SERVICE_CHAT_URL", "http://127.0.0.1:8007"),
}

class GatewayService:
    @staticmethod
    async def proxy_request(service: str, path: str, request: Request):
        if service not in SERVICES:
            return Response(content="Service not found", status_code=404)
        
        # Handle paths correctly
        if path.startswith("api/v1/"):
            url = f"{SERVICES[service]}/{path}"
        elif path == "health":
            url = f"{SERVICES[service]}/health"
        else:
            # Prepend api/v1 if not present
            url = f"{SERVICES[service]}/api/v1/{path}"
        
        body = await request.body()
        headers = dict(request.headers)
        params = dict(request.query_params)
        
        # Log for debugging auth issues
        auth_header = headers.get("authorization", "MISSING")
        print(f"DEBUG Gateway: Forwarding {request.method} to {url}. Auth: {auth_header[:20]}...")

        if 'host' in headers:
            del headers['host']

        async with httpx.AsyncClient() as client:
            try:
                proxy_response = await client.request(
                    method=request.method,
                    url=url,
                    content=body,
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                return Response(
                    content=proxy_response.content,
                    status_code=proxy_response.status_code,
                    headers=dict(proxy_response.headers)
                )
            except Exception as e:
                return Response(content=f"Proxy error: {str(e)}", status_code=502)
