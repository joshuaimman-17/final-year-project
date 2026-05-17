# Developer Guide

Complete guide for setting up Dr. Plant for development.

## 📋 Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Backend Development](#backend-development)
5. [Frontend Development](#frontend-development)
6. [Database](#database)
7. [Testing](#testing)
8. [Debugging](#debugging)
9. [Deployment](#deployment-guide)

## 📁 Project Structure

```
final-year-project/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx
│   ├── public/              # Static files
│   ├── package.json
│   └── tsconfig.json
├── backend/                 # Python Flask/Django application
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── views/           # API endpoints
│   │   ├── serializers/     # Data serialization
│   │   ├── middlewares/     # Custom middlewares
│   │   └── utils/           # Utility functions
│   ├── ml_models/           # Machine learning models
│   │   ├── disease_detection/
│   │   ├── yield_prediction/
│   │   └── models.py
│   ├── tests/               # Unit and integration tests
│   ├── manage.py
│   └── requirements.txt
├── docs/                    # Documentation
├── .github/
│   ├── workflows/           # GitHub Actions
│   └── ISSUE_TEMPLATE/
├── docker-compose.yml       # Docker configuration
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

## ✅ Prerequisites

- Node.js v16+ (for frontend)
- Python 3.8+ (for backend)
- PostgreSQL 12+ (for database)
- Redis (for caching)
- Git
- Docker & Docker Compose (optional)

## 🔧 Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/joshuaimman-17/final-year-project.git
cd final-year-project
```

### 2. Create Environment Files

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/drplant_db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=your-jwt-secret
OPENWEATHER_API_KEY=your-api-key
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_ENV=development
```

## 🐍 Backend Development

### Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For development

# Create database
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data
python manage.py loaddata fixtures/sample_data.json

# Run server
python manage.py runserver
```

Server runs at: `http://localhost:8000`

### Development Tools

```bash
# Django shell
python manage.py shell
>>> from crops.models import Crop
>>> Crop.objects.all()

# Run tests
pytest
pytest -v
pytest --cov=app

# Format code
black app/
autopep8 --in-place --aggressive --aggressive app/

# Lint code
flake8 app/
pylint app/

# Database migrations
python manage.py makemigrations
python manage.py migrate
python manage.py showmigrations

# Collect static files
python manage.py collectstatic
```

### Project Structure (Backend)

```
backend/
├── app/
│   ├── admin.py           # Django admin configuration
│   ├── models.py          # Database models
│   ├── views.py           # API endpoints
│   ├── serializers.py     # DRF serializers
│   ├── urls.py            # URL routing
│   ├── permissions.py     # Custom permissions
│   └── tests.py           # Unit tests
├── ml_models/
│   ├── disease_detection/  # Disease classification
│   │   ├── model.py
│   │   └── weights/
│   ├── yield_prediction/   # Yield prediction
│   └── utils.py
├── settings.py            # Django settings
├── wsgi.py                # WSGI configuration
├── requirements.txt       # Python dependencies
└── manage.py
```

## 🚀 Frontend Development

### Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Application runs at: `http://localhost:3000`

### Development Tools

```bash
# Run tests
npm test
npm run test:watch
npm run test:coverage

# Build for production
npm run build

# Format & lint code
npm run format
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Analyze bundle size
npm run analyze
```

### Project Structure (Frontend)

```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Crops/
│   │   ├── Disease/
│   │   └── Common/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   ├── api.ts         # API client
│   │   └── auth.ts        # Auth service
│   ├── hooks/
│   │   ├── useFetch.ts
│   │   └── useAuth.ts
│   ├── types/
│   │   ├── crop.ts
│   │   └── disease.ts
│   ├── App.tsx
│   └── index.tsx
├── public/
├── package.json
└── tsconfig.json
```

## 🗄️ Database

### PostgreSQL Setup

```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

### Database Commands

```bash
# Create database
createdb drplant_db

# Connect to database
psql drplant_db

# Reset database
python manage.py reset_db --noinput

# Dump data
python manage.py dumpdata > backup.json

# Load data
python manage.py loaddata backup.json
```

## 🧪 Testing

### Frontend Testing

```bash
# Write tests using Jest and React Testing Library
npm test

# Example test:
describe('DiseaseDetection', () => {
  it('uploads image and detects disease', async () => {
    render(<DiseaseDetection />);
    const input = screen.getByRole('input');
    fireEvent.change(input, { target: { files: [imageFile] } });
    await screen.findByText('Rice Blast');
  });
});
```

### Backend Testing

```bash
# Write tests using pytest
pytest app/tests.py

# Example test:
def test_create_crop():
    crop = Crop.objects.create(
        name="Rice",
        area=10
    )
    assert crop.name == "Rice"

# With fixtures
@pytest.fixture
def crop(db):
    return Crop.objects.create(name="Rice", area=10)

def test_crop_detail(client, crop):
    response = client.get(f'/api/crops/{crop.id}/')
    assert response.status_code == 200
```

### Coverage

```bash
# Frontend
npm run test:coverage

# Backend
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

## 🐛 Debugging

### Frontend Debugging

```typescript
// Browser DevTools
console.log('Value:', variable);

// React DevTools extension
// Install from Chrome/Firefox extension store

// VS Code debugging
// Add to .vscode/launch.json:
{
  "type": "chrome",
  "request": "launch",
  "name": "Launch Chrome",
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}/frontend/src"
}
```

### Backend Debugging

```python
# Django shell debugging
python manage.py shell
>>> from crops.models import Crop
>>> crop = Crop.objects.get(id=1)
>>> print(crop)

# pdb (Python Debugger)
import pdb; pdb.set_trace()

# Django logging
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## 🐳 Docker Development

### Using Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Run commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser

# Stop services
docker-compose down
```

### Dockerfile Example

**Backend:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## 📚 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Python Testing with pytest](https://docs.pytest.org/)

---

Happy coding! 🚀
