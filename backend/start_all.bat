@echo off
echo Starting Dr.Plant Backend Services...

echo Starting service-gateway on port 8001
start "Gateway (8001)" cmd /k "cd service-gateway && python -m uvicorn api.index:app --reload --port 8001"
ping 127.0.0.1 -n 2 > nul

echo Starting service-users on port 8002
start "Users (8002)" cmd /k "cd service-users && python -m uvicorn api.index:app --reload --port 8002"
ping 127.0.0.1 -n 2 > nul

echo Starting service-farms on port 8003
start "Farms (8003)" cmd /k "cd service-farms && python -m uvicorn api.index:app --reload --port 8003"
ping 127.0.0.1 -n 2 > nul

echo Starting service-diagnostics on port 8004
start "Diagnostics (8004)" cmd /k "cd service-diagnostics && python -m uvicorn api.index:app --reload --port 8004"
ping 127.0.0.1 -n 2 > nul

echo Starting service-marketplace on port 8005
start "Marketplace (8005)" cmd /k "cd service-marketplace && python -m uvicorn api.index:app --reload --port 8005"
ping 127.0.0.1 -n 2 > nul

echo Starting service-community on port 8006
start "Community (8006)" cmd /k "cd service-community && python -m uvicorn api.index:app --reload --port 8006"
ping 127.0.0.1 -n 2 > nul

echo Starting service-chat on port 8007
start "Chat (8007)" cmd /k "cd service-chat && python -m uvicorn api.index:app --reload --port 8007"

echo All services launched in separate windows!
