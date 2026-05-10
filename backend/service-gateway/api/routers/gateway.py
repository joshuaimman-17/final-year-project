from fastapi import APIRouter, Request, HTTPException
from api.controllers.gateway_controller import GatewayController
from api.services.gateway_service import SERVICES
import httpx

router = APIRouter()

@router.get("/swagger/{service}/openapi.json", include_in_schema=False)
async def get_swagger_json(service: str):
    if service not in SERVICES:
        raise HTTPException(status_code=404, detail="Service not found")
    
    url = f"{SERVICES[service]}/openapi.json"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=10.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Failed to fetch OpenAPI schema")
            data = resp.json()
            # Set the server URL so "Try it out" routes through the gateway
            data["servers"] = [{"url": f"/{service}"}]
            return data
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Proxy error: {str(e)}")

@router.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_request(service: str, path: str, request: Request):
    return await GatewayController.proxy(service, path, request)
