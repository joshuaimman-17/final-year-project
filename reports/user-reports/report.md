# User Service Production Readiness Report

The **User Service** is the central authentication and identity provider for the Dr. Plant platform. It manages JWT issuance, expert applications, and social connections.

## 1. Service Details
*   **Port**: `8001`
*   **Database**: PostgreSQL (Neon)
*   **Status**: **STABLE**

## 2. Verified Endpoints

| Endpoint | Method | Result |
| :--- | :--- | :--- |
| `/api/v1/register` | `POST` | **SUCCESS** |
| `/api/v1/login` | `POST` | **SUCCESS** |
| `/api/v1/me` | `GET` | **SUCCESS** |
| `/api/v1/profile` | `PATCH` | **SUCCESS** |
| `/api/v1/experts` | `GET` | **SUCCESS** |

## 3. Key Accomplishments
- **JWT Integration**: Successfully issuing RS256 signed tokens compatible with Firebase.
- **Expert Workflow**: Validated application and review logic.
- **Social Graph**: Follow/Unfollow and follower list retrieval is functional.

## 4. Test Artifacts
- **Test Script**: `backend/service-users/scratch/test_user_service.py`
- **Output Log**: `reports/user-reports/execution_log.txt`
