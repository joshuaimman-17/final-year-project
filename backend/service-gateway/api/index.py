from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from api.routers.gateway import router as gateway_router

app = FastAPI(title="Dr.Plant API Gateway", docs_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gateway_router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "gateway"}

swagger_urls = [
    {"url": "/openapi.json", "name": "Gateway Service"},
    {"url": "/swagger/users/openapi.json", "name": "Users Service"},
    {"url": "/swagger/farms/openapi.json", "name": "Farms Service"},
    {"url": "/swagger/diagnostics/openapi.json", "name": "Diagnostics Service"},
    {"url": "/swagger/marketplace/openapi.json", "name": "Marketplace Service"},
    {"url": "/swagger/community/openapi.json", "name": "Community Service"},
    {"url": "/swagger/chat/openapi.json", "name": "Chat Service"},
]

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    from fastapi.responses import HTMLResponse
    import json
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <link rel="shortcut icon" href="https://fastapi.tiangolo.com/img/favicon.png">
    <title>Dr.Plant API Gateway - Swagger UI</title>
    </head>
    <body>
    <div id="swagger-ui">
    </div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
    window.onload = () => {{
        window.ui = SwaggerUIBundle({{
            urls: {json.dumps(swagger_urls)},
            dom_id: '#swagger-ui',
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            layout: "StandaloneLayout",
            deepLinking: true,
            defaultModelsExpandDepth: -1
        }});
    }};
    </script>
    </body>
    </html>
    """
    return HTMLResponse(html)
