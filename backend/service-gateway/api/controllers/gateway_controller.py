from fastapi import Request
from api.services.gateway_service import GatewayService

class GatewayController:
    @staticmethod
    async def proxy(service: str, path: str, request: Request):
        return await GatewayService.proxy_request(service, path, request)
