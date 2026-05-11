# Dr. Plant API Gateway Documentation

The Gateway acts as the central entry point for all microservices. All requests should be prefixed with `http://localhost:8000/{service_name}/`.

## Base URL: `http://localhost:8000`

---

## 1. User Service (`/users`)
Manage authentication, profiles, and experts.

| Endpoint | Method | Gateway Path | Description |
| :--- | :--- | :--- | :--- |
| `/users/register` | POST | `/users/users/register` | Register a new user |
| `/users/login` | POST | `/users/users/login` | Authenticate and get JWT |
| `/users/me` | GET | `/users/users/me` | Get current profile |
| `/users/experts` | GET | `/users/users/experts` | List agricultural experts |

**Sample Login Request:**
```bash
curl -X POST http://localhost:8000/users/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

---

## 2. Farm Service (`/farms`)
GIS mapping and weather-based advisory.

| Endpoint | Method | Gateway Path | Description |
| :--- | :--- | :--- | :--- |
| `/farms` | POST | `/farms/farms` | Create a new farm polygon |
| `/farms` | GET | `/farms/farms` | List user's farms |
| `/farms/{id}/spraying-window` | GET | `/farms/farms/{id}/spraying-window` | Get spraying window |

---

## 3. Diagnosis Service (`/diagnostics`)
AI leaf disease detection.

| Endpoint | Method | Gateway Path | Description |
| :--- | :--- | :--- | :--- |
| `/diagnose` | POST | `/diagnostics/diagnose` | Submit image for AI diagnosis |
| `/diagnose/history` | GET | `/diagnostics/diagnose/history` | Get diagnosis history |
| `/diagnose/{id}` | GET | `/diagnostics/diagnose/{id}` | Get specific result |

---

## 4. Community Service (`/community`)
Social feed and expert interaction.

| Endpoint | Method | Gateway Path | Description |
| :--- | :--- | :--- | :--- |
| `/community/feed` | GET | `/community/community/feed` | Get social feed |
| `/community/posts` | POST | `/community/community/posts` | Create a post |
| `/community/follow/{id}` | POST | `/community/community/follow/{id}` | Follow a user |

---

## 5. Marketplace Service (`/marketplace`)
Agri-commerce and orders.

| Endpoint | Method | Gateway Path | Description |
| :--- | :--- | :--- | :--- |
| `/marketplace/listings` | POST | `/marketplace/marketplace/listings` | Create a crop listing |
| `/marketplace/search` | GET | `/marketplace/marketplace/listings` | Search for crops |
| `/marketplace/orders` | POST | `/marketplace/marketplace/orders` | Checkout produce |

---

## 6. Chat Service (`/chat`)
Real-time messaging.

| Endpoint | Method | Gateway Path | Description |
| :--- | :--- | :--- | :--- |
| `/chat/heartbeat` | POST | `/chat/chat/heartbeat` | Update presence |
| `/chat/initiate` | POST | `/chat/chat/initiate` | Start a chat |
| `/chat/rooms/{id}/messages` | POST | `/chat/chat/rooms/{id}/messages` | Send message |
