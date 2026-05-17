# Contributing to Dr. Plant 🌿

Thank you for your interest in contributing to Dr. Plant! We welcome contributions from developers, farmers, agricultural experts, and anyone passionate about improving farming practices.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Ways to Contribute](#ways-to-contribute)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Submitting Pull Requests](#submitting-pull-requests)
6. [Code Standards](#code-standards)
7. [Testing](#testing)
8. [Commit Messages](#commit-messages)
9. [Getting Help](#getting-help)

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** for your changes
4. **Make your changes** following our guidelines
5. **Submit a pull request** with a clear description

## 🤝 Ways to Contribute

### 🐛 Bug Fixes
- Found a bug? Open an [issue](https://github.com/joshuaimman-17/final-year-project/issues) first
- Reference the issue in your PR
- Include test cases for the fix

### ✨ New Features
- Discuss major features in [Discussions](https://github.com/joshuaimman-17/final-year-project/discussions)
- Create a feature branch from `main`
- Include tests for new functionality
- Update documentation

### 🧪 Testing
- Add unit tests for new code
- Add integration tests for new features
- Improve test coverage (target: >80%)
- Fix failing tests

### 📚 Documentation
- Fix typos in README, docs, or code comments
- Improve clarity of existing documentation
- Add examples and use cases
- Translate documentation to other languages

### 🎨 UI/UX Improvements
- Improve user interface design
- Enhance user experience
- Fix accessibility issues
- Add responsive design improvements

### 🌍 Internationalization (i18n)
- Add language support
- Translate UI strings
- Translate documentation
- Test language variants

### 🚜 Agricultural Expertise
- Validate farming recommendations
- Suggest agricultural improvements
- Add crop-specific knowledge
- Test with real farming scenarios

### 🤖 Machine Learning
- Improve disease classification models
- Enhance yield prediction accuracy
- Optimize image processing
- Add new ML features

### 🔧 DevOps & Infrastructure
- Improve deployment process
- Optimize Docker setup
- Enhance CI/CD pipelines
- Improve monitoring and logging

## 🔧 Development Setup

See [DEVELOPER.md](./DEVELOPER.md) for complete setup instructions.

**Quick Start:**
```bash
# Clone repository
git clone https://github.com/your-username/final-year-project.git
cd final-year-project

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
python manage.py migrate

# Setup frontend
cd ../frontend
npm install
npm start
```

## 📝 Making Changes

### Creating a Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/descriptive-name
# or for bug fixes:
git checkout -b fix/issue-number-description
```

### Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

## 🔄 Submitting Pull Requests

### PR Checklist

Before submitting, ensure:

- [ ] Forked from latest `main` branch
- [ ] Feature branch created with descriptive name
- [ ] Changes follow code style guidelines
- [ ] Added tests for new functionality
- [ ] All tests pass locally (`npm test`, `pytest`)
- [ ] Code formatted (`npm run format`, `black`)
- [ ] Linting passes (`npm run lint`, `flake8`)
- [ ] Updated documentation if needed
- [ ] No merge conflicts
- [ ] Commit messages are clear and descriptive
- [ ] PR description is detailed and helpful

### Creating a Pull Request

1. **Push your branch to fork**
   ```bash
   git push origin feature/your-feature
   ```

2. **Go to GitHub repository**
   - Click "Compare & pull request"
   - Select base branch: `main`
   - Select compare branch: your feature branch

3. **Fill PR template**
   ```markdown
   ## Description
   Brief description of changes

   ## Related Issue
   Fixes #123

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation
   - [ ] Other

   ## Changes Made
   - Change 1
   - Change 2

   ## Testing
   How to test the changes

   ## Screenshots (if applicable)
   Add relevant screenshots

   ## Additional Notes
   Any additional context
   ```

4. **Request review**
   - Add reviewers
   - Link related issues
   - Wait for feedback

### PR Review Process

- Maintainers will review your PR within 48 hours
- Address feedback and request re-review
- Ensure CI/CD checks pass
- Once approved, PR will be merged

## 💻 Code Standards

### Frontend (TypeScript)

```typescript
// Use TypeScript for type safety
interface Crop {
  id: string;
  name: string;
  area: number;
  planted_date: Date;
}

// Use functional components with hooks
const CropList: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  
  useEffect(() => {
    fetchCrops();
  }, []);

  return <div>{/* ... */}</div>;
};

// Use meaningful variable names
const calculateYieldPrediction = (area: number, soilQuality: number) => {
  return area * soilQuality * 0.8;
};
```

**Guidelines:**
- Use PascalCase for components and classes
- Use camelCase for variables and functions
- Add JSDoc comments for complex functions
- Keep components small and focused
- Use custom hooks for reusable logic
- Avoid prop drilling; use context when needed

### Backend (Python)

```python
# Use type hints
from typing import List, Dict, Optional

def get_disease_treatment(disease_id: str) -> Optional[Dict]:
    """
    Retrieve treatment options for a disease.
    
    Args:
        disease_id: Unique disease identifier
    
    Returns:
        Dictionary containing treatment options
    """
    try:
        disease = Disease.objects.get(id=disease_id)
        return disease.get_treatments()
    except Disease.DoesNotExist:
        return None

# Use descriptive names
class CropHealthAnalyzer:
    def calculate_health_score(self, crop_data: Dict) -> float:
        return (crop_data['leaf_condition'] + 
                crop_data['moisture'] + 
                crop_data['nutrient_level']) / 3
```

**Guidelines:**
- Use snake_case for variables and functions
- Use PascalCase for classes
- Add docstrings to all functions
- Use type hints for function parameters and returns
- Keep functions focused and single-responsibility
- Use Django ORM best practices

### General Guidelines

- **Maximum line length**: 88 characters
- **Indentation**: 2 spaces (frontend), 4 spaces (backend)
- **Comments**: Explain *why*, not *what*
- **Variables**: Use meaningful, descriptive names
- **Functions**: Keep functions small and focused
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid

### Code Formatting

**Frontend:**
```bash
npm run format          # Format code with Prettier
npm run lint:fix        # Fix linting issues
npm run type-check      # Check TypeScript types
```

**Backend:**
```bash
black app/              # Format with Black
autopep8 --in-place app/  # Auto format
flake8 app/            # Lint with Flake8
pylint app/            # Lint with Pylint
```

## 🧪 Testing

### Frontend Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import DiseaseDetection from './DiseaseDetection';

describe('DiseaseDetection', () => {
  it('displays upload form', () => {
    render(<DiseaseDetection />);
    expect(screen.getByText('Upload Crop Image')).toBeInTheDocument();
  });

  it('submits image for detection', async () => {
    render(<DiseaseDetection />);
    const input = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(input);
    // Add assertions
  });
});
```

**Run tests:**
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Backend Tests

```python
import pytest
from django.test import TestCase, Client
from crops.models import Crop

@pytest.fixture
def sample_crop(db):
    return Crop.objects.create(
        name="Rice",
        area=10,
        crop_type="rice"
    )

def test_crop_creation(sample_crop):
    assert sample_crop.name == "Rice"
    assert sample_crop.area == 10

class CropAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.crop = Crop.objects.create(name="Wheat", area=5)
    
    def test_crop_list_api(self):
        response = self.client.get('/api/crops/')
        self.assertEqual(response.status_code, 200)
```

**Run tests:**
```bash
pytest                      # Run all tests
pytest -v                   # Verbose output
pytest --cov=app           # Coverage report
pytest -k test_name        # Run specific test
```

## 📝 Commit Messages

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting, missing semicolons, etc
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

### Examples

```
feat(disease-detection): Add image upload functionality

- Allow users to upload crop images
- Integrate with TensorFlow for classification
- Display disease detection results

Fixes #123
```

```
fix(auth): Correct token expiration logic

The token was expiring 1 hour too early.
Updated refresh token timer calculation.

Fixes #456
```

### Commit Best Practices

- One logical change per commit
- Write present tense ("add feature" not "added feature")
- Be specific and descriptive
- Reference related issues
- Keep commits small and focused

## 🆘 Getting Help

### Documentation
- [README.md](../README.md) - Project overview
- [API.md](./API.md) - API reference
- [DEVELOPER.md](./DEVELOPER.md) - Developer setup

### Questions & Discussions
- [GitHub Discussions](https://github.com/joshuaimman-17/final-year-project/discussions)
- [GitHub Issues](https://github.com/joshuaimman-17/final-year-project/issues)
- Email: support@drplant.io

### Code Review
- Maintainers will provide constructive feedback
- Be open to suggestions
- Ask questions if feedback is unclear
- Request changes be marked as resolved

## 🎓 Learning Resources

### Frontend
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/)

### Backend
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Python Testing with pytest](https://docs.pytest.org/)

### General
- [Open Source Contributing](https://opensource.guide/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

## 🌟 Recognizing Contributions

We recognize all contributions! Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Recognized in GitHub contributors
- Eligible for maintainer role (for significant contributions)

---

**Thank you for contributing to Dr. Plant! Together, we're empowering farmers worldwide. 🌿💚**
