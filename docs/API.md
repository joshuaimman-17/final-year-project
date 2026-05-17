# API Documentation

Complete API reference for Dr. Plant backend services.

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

## 🔐 Authentication

### API Key Authentication

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.drplant.io/v1/crops
```

### JWT Authentication

```bash
# Get token
POST /api/v1/auth/login
{
  "email": "farmer@example.com",
  "password": "password123"
}

# Response
{
  "access": "eyJhbGc...",
  "refresh": "eyJhbGc..."
}

# Use token
curl -H "Authorization: Bearer eyJhbGc..." \
  https://api.drplant.io/v1/crops
```

### OAuth 2.0

Coming soon for social login integration.

## 🌐 Base URL

```
Development:  http://localhost:8000/api/v1
Production:   https://api.drplant.io/v1
```

## 📤 Response Format

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "123",
    "name": "Rice Field",
    "area": 10
  }
}
```

### List Response

```json
{
  "status": "success",
  "data": [
    { "id": "1", "name": "Crop 1" },
    { "id": "2", "name": "Crop 2" }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

## ❌ Error Handling

### Error Response

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "email": ["Invalid email format"]
    }
  }
}
```

### Error Codes

- `BAD_REQUEST` (400): Invalid input
- `UNAUTHORIZED` (401): Missing/invalid auth
- `FORBIDDEN` (403): No permission
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource already exists
- `RATE_LIMIT` (429): Too many requests
- `SERVER_ERROR` (500): Server error

## 🔌 Endpoints

### Authentication

#### Sign Up
```http
POST /auth/register
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "role": "farmer"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "usr_123",
    "email": "farmer@example.com",
    "access_token": "eyJhbGc..."
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "securepassword123"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh": "eyJhbGc..."
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer {token}
```

### Crops

#### List Crops
```http
GET /crops?page=1&page_size=20&status=active
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `page_size` (int): Items per page (default: 20)
- `status` (string): Filter by status (active, harvested, archived)
- `search` (string): Search by name

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "crop_123",
      "name": "Rice Field A",
      "status": "active",
      "area": 10,
      "crop_type": "rice",
      "planted_date": "2026-01-15",
      "expected_harvest": "2026-05-15",
      "health_score": 87.5,
      "weather": {
        "temperature": 28,
        "humidity": 75,
        "rainfall": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 45
  }
}
```

#### Get Crop Details
```http
GET /crops/{crop_id}
Authorization: Bearer {token}
```

#### Create Crop
```http
POST /crops
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Rice Field A",
  "crop_type": "rice",
  "area": 10,
  "planted_date": "2026-01-15",
  "expected_harvest": "2026-05-15",
  "fertilizer_type": "urea",
  "irrigation_type": "drip"
}
```

#### Update Crop
```http
PATCH /crops/{crop_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Rice Field A Updated",
  "status": "active"
}
```

#### Delete Crop
```http
DELETE /crops/{crop_id}
Authorization: Bearer {token}
```

### Disease Detection

#### Detect Disease
```http
POST /diseases/detect
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (image file)
crop_id: crop_123
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "detection_id": "det_456",
    "crop_id": "crop_123",
    "detected_at": "2026-05-17T10:30:00Z",
    "diseases": [
      {
        "id": "dis_123",
        "name": "Rice Blast",
        "confidence": 0.92,
        "severity": "high",
        "description": "Fungal disease affecting rice leaves",
        "affected_area": "25%",
        "treatment": {
          "id": "treat_123",
          "type": "fungicide",
          "name": "Copper Sulfate",
          "dosage": "2kg per acre",
          "duration": "7 days",
          "organic_alternative": "Neem oil spray"
        }
      }
    ],
    "recommendations": [
      "Isolate affected area",
      "Apply fungicide immediately",
      "Improve air circulation"
    ]
  }
}
```

#### List Disease History
```http
GET /diseases/history?crop_id=crop_123
Authorization: Bearer {token}
```

#### Get Disease Details
```http
GET /diseases/{disease_id}
Authorization: Bearer {token}
```

#### Search Diseases
```http
GET /diseases/search?q=blast&crop_type=rice
Authorization: Bearer {token}
```

### Weather

#### Get Current Weather
```http
GET /weather/current?lat=28.7041&lon=77.1025
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "location": "Delhi, India",
    "timestamp": "2026-05-17T10:30:00Z",
    "temperature": 28,
    "feels_like": 32,
    "humidity": 75,
    "pressure": 1013,
    "wind_speed": 12,
    "rainfall": 5,
    "uv_index": 8,
    "conditions": "Partly Cloudy",
    "visibility": 10
  }
}
```

#### Get Weather Forecast
```http
GET /weather/forecast?lat=28.7041&lon=77.1025&days=7
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "location": "Delhi, India",
    "forecast": [
      {
        "date": "2026-05-17",
        "high": 35,
        "low": 26,
        "humidity": 70,
        "rainfall_probability": 30,
        "expected_rainfall": 0,
        "conditions": "Sunny",
        "wind_speed": 15
      }
    ]
  }
}
```

### Analytics

#### Get Crop Analytics
```http
GET /analytics/crops/{crop_id}?period=monthly
Authorization: Bearer {token}
```

**Query Parameters:**
- `period` (string): daily, weekly, monthly, yearly

**Response:**
```json
{
  "status": "success",
  "data": {
    "crop_id": "crop_123",
    "crop_name": "Rice Field A",
    "health_trend": [85, 86, 87, 88],
    "yield_estimate": 4.5,
    "yield_unit": "tons per acre",
    "disease_instances": 2,
    "disease_trend": [
      { "date": "2026-04-15", "diseases": 1 },
      { "date": "2026-05-15", "diseases": 2 }
    ],
    "cost_analysis": {
      "fertilizer": 500,
      "pesticide": 300,
      "labor": 800,
      "total": 1600
    },
    "recommendations": [
      "Monitor humidity levels",
      "Schedule irrigation on 2026-05-20"
    ]
  }
}
```

#### Get Dashboard Summary
```http
GET /analytics/dashboard
Authorization: Bearer {token}
```

## ⏱️ Rate Limiting

- **Free Plan**: 100 requests/hour per API key
- **Pro Plan**: 1000 requests/hour per API key
- **Enterprise**: Custom limits

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1684329600
```

## 💡 Examples

### JavaScript/TypeScript

```typescript
const API_BASE = 'https://api.drplant.io/v1';
const API_KEY = 'your-api-key';

// Helper function
async function apiCall(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Get crops
const crops = await apiCall('/crops?page=1');

// Detect disease
const formData = new FormData();
formData.append('file', imageFile);
formData.append('crop_id', 'crop_123');

const detection = await apiCall('/diseases/detect', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
  },
});
```

### Python

```python
import requests

API_BASE = "https://api.drplant.io/v1"
API_KEY = "your-api-key"

headers = {"Authorization": f"Bearer {API_KEY}"}

# Get crops
response = requests.get(f"{API_BASE}/crops", headers=headers)
crops = response.json()

# Detect disease
with open("leaf_image.jpg", "rb") as f:
    files = {"file": f}
    data = {"crop_id": "crop_123"}
    response = requests.post(
        f"{API_BASE}/diseases/detect",
        headers=headers,
        files=files,
        data=data
    )
    detection = response.json()
```

### cURL

```bash
# Get crops
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.drplant.io/v1/crops

# Detect disease
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@leaf_image.jpg" \
  -F "crop_id=crop_123" \
  https://api.drplant.io/v1/diseases/detect
```

---

**For more help, visit [Discussions](https://github.com/joshuaimman-17/final-year-project/discussions)**
