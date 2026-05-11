# Dr. Plant Backend Master Specification (Exhaustive)

This document is the definitive source of truth for the Dr. Plant API ecosystem. All endpoints are accessible via the central API Gateway.

---

## 🛰️ API Gateway
**Base URL**: `http://localhost:8000`
**Service Routing**: `/{service}/{path}`

---

## 👤 User Service (Port 8002)
**Path Prefix**: `/users`

| Endpoint | Method | Usecase | Payload | Auth |
| :--- | :--- | :--- | :--- | :--- |
| `/users/register` | POST | Create account | `{"email", "password", "full_name", "role"}` | None |
| `/users/login` | POST | Get JWT token | `{"email", "password"}` | None |
| `/users/me` | GET | Get my profile | None | Required |
| `/users/profile` | PATCH | Update profile | `{"full_name", "avatar_url", "phone"}` | Required |
| `/users/expert-apply`| POST | Apply for expert status| `{"specialization", "bio", "experience_years"}` | Required |
| `/users/account` | DELETE | Deactivate account | None | Required |
| `/users/experts` | GET | Search experts | Query: `specialization` | None |
| `/users/follow/{id}`| POST | Follow a user | None | Required |
| `/users/follow/{id}`| DELETE | Unfollow a user | None | Required |
| `/users/{id}/followers`| GET | List followers | None | None |

---

## 🚜 Farm Service (Port 8003)
**Path Prefix**: `/farms`

| Endpoint | Method | Usecase | Payload | Auth |
| :--- | :--- | :--- | :--- | :--- |
| `/farms` | POST | Create farm | `{"name", "village", "district", "state"}` | Farmer |
| `/farms` | GET | List my farms | None | Required |
| `/farms/{id}/spraying-window` | GET | Best time to spray | None | Required |
| `/fields` | POST | Create field | `{"farm_id", "polygon": GeoJSON}` | Required |
| `/fields/{id}/crop-cycle` | POST | Start crop cycle | `{"crop_name", "planting_date"}` | Required |
| `/fields/{id}/summary` | GET | Field dashboard | None | Required |
| `/fields/{id}/weather` | GET | Local weather | None | Required |
| `/fields/{id}/soil-history` | GET | Past soil reports | None | Required |
| `/fields/{id}/satellite-gallery` | GET | Satellite images | None | Required |

---

## 🔬 Diagnosis Service (Port 8004)
**Path Prefix**: `/diagnostics`

| Endpoint | Method | Usecase | Payload | Auth |
| :--- | :--- | :--- | :--- | :--- |
| `/diagnose` | POST | AI Leaf Analysis | `{"field_id", "image_url", "crop_type"}` | Required |
| `/diagnose/history` | GET | My past diagnoses | None | Required |
| `/diagnose/{id}` | GET | Get diagnosis result| None | Required |
| `/expert/queue` | GET | Expert review queue | None | Expert |
| `/expert/diagnose/{id}/review` | POST | Expert feedback | `{"disease_confirmed", "treatment"}` | Expert |

---

## 🛒 Marketplace Service (Port 8005)
**Path Prefix**: `/marketplace`

| Endpoint | Method | Usecase | Payload | Auth |
| :--- | :--- | :--- | :--- | :--- |
| `/listings` | POST | Create listing | `{"crop_name", "price_per_unit", "qty"}` | Farmer |
| `/listings` | GET | Search marketplace | Query: `crop`, `category`, `min_price` | None |
| `/listings/{id}` | GET | Listing details | None | None |
| `/orders` | POST | Purchase produce | `{"items": [{"id", "qty"}], "address"}` | Required |
| `/orders/{id}` | GET | Order tracking | None | Required |
| `/orders/{id}/status`| PATCH| Update status | Body: `"SHIPPED"`, `"DELIVERED"` | Seller |
| `/orders/{id}/reviews`| POST | Rate purchase | `{"rating", "comment"}` | Buyer |
| `/users/{id}/reviews`| GET | Seller trust score | None | None |

---

## 📢 Community Service (Port 8006)
**Path Prefix**: `/community`

| Endpoint | Method | Usecase | Payload | Auth |
| :--- | :--- | :--- | :--- | :--- |
| `/posts` | POST | Create post | `{"content", "image_urls", "tags"}` | Required |
| `/feed` | GET | Local/Global feed | None | Required |
| `/posts/{id}/comments`| POST | Add comment | `{"text"}` | Required |
| `/posts/{id}/like` | POST | Like a post | None | Required |
| `/comments/{id}/replies`| POST | Reply to comment | `{"text"}` | Required |
| `/follow/{id}` | POST | Follow user (Social) | None | Required |
| `/users/{id}/followers`| GET | Social followers | None | None |
| `/users/{id}/following`| GET | Social following | None | None |

---

## 💬 Chat Service (Port 8007)
**Path Prefix**: `/chat`

| Endpoint | Method | Usecase | Payload | Auth |
| :--- | :--- | :--- | :--- | :--- |
| `/presence/{id}` | GET | Check online status | None | Required |
| `/heartbeat` | POST | Stay online | None | Required |
| `/search-users` | GET | Find people | Query: `query`, `role` | Required |
| `/initiate` | POST | Start DM/Group chat | `{"participants", "is_group"}` | Required |
| `/rooms/{id}/messages`| POST | Send message | `{"text", "type", "attachment"}` | Required |
| `/rooms/{id}/messages/{msgId}/react`| POST | Emoji reaction | `{"emoji", "action"}` | Required |
| `/broadcast` | POST | Mass alert | `{"recipient_ids", "content"}` | Required |
