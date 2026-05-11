import subprocess
import os

services = [
    "service-users",
    "service-farms",
    "service-diagnostics",
    "service-marketplace",
    "service-community",
    "service-chat"
]

def run_init():
    print("--- Starting Full Project Database Initialization ---")
    
    # 1. Clear the DB
    print("Step 1: Clearing database...")
    subprocess.run(["python", "clear_neon.py"], check=True)
    
    # 2. Run init_db.py for each service if it exists
    print("\nStep 2: Initializing service tables...")
    for service in services:
        init_script = os.path.join(service, "init_db.py")
        if os.path.exists(init_script):
            print(f"Initializing {service}...")
            subprocess.run(["python", "init_db.py"], cwd=service, check=True)
        else:
            print(f"Skipping {service} (no init_db.py found)")
            
    print("\n--- All databases initialized successfully! ---")

if __name__ == "__main__":
    run_init()
