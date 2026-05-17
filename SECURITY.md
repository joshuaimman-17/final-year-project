# Security Policy

## Reporting a Vulnerability

**Do not create public GitHub issues for security vulnerabilities.** Instead, please report security issues by:

📧 **Email**: security@drplant.io
📋 **GitHub Security Advisory**: Use [GitHub's vulnerability reporting](https://docs.github.com/en/code-security/security-advisories)

### What to Include

When reporting a security vulnerability, please include:

1. **Description**: Clear description of the vulnerability
2. **Impact**: How the vulnerability could be exploited
3. **Steps to Reproduce**: Detailed reproduction steps
4. **Affected Versions**: Which versions are affected
5. **Suggested Fix** (optional): If you have a fix in mind
6. **Contact Information**: How to reach you for follow-up

### Response Timeline

- ⏱️ **24 hours**: Acknowledgment of receipt
- 📊 **3-5 days**: Initial assessment
- 🔧 **7-30 days**: Patch development (depending on severity)
- 📢 **30 days**: Public disclosure (after patch release)

**Severity Guidelines:**
- 🔴 **Critical** (CVSS 9-10): Immediate threat, data breach risk → 24-48 hours
- 🟠 **High** (CVSS 7-8): Significant vulnerability, potential exploits → 3-7 days
- 🟡 **Medium** (CVSS 4-6): Moderate impact, mitigation available → 7-14 days
- 🟢 **Low** (CVSS 0-3): Limited impact, workarounds available → 14-30 days

## Security Best Practices

### Authentication & Authorization

```python
# ✅ DO: Use strong password hashing
from django.contrib.auth.hashers import make_password

password_hash = make_password('user_password')
```

```python
# ❌ DON'T: Store plain text passwords
user.password = 'user_password'  # Never do this!
```

### SQL Injection Prevention

```python
# ✅ DO: Use parameterized queries
Crop.objects.filter(id=crop_id)  # Django ORM handles escaping
```

```python
# ❌ DON'T: Use string concatenation
query = f"SELECT * FROM crops WHERE id = {crop_id}"  # SQL Injection!
```

### Cross-Site Scripting (XSS) Prevention

```typescript
// ✅ DO: Use React's built-in XSS protection
<div>{userInput}</div>  // React escapes by default
```

```typescript
// ❌ DON'T: Use dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // XSS vulnerability!
```

### API Security

```python
# ✅ DO: Validate and sanitize input
from rest_framework import serializers

class CropSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crop
        fields = ['name', 'area', 'crop_type']
        # Automatically validates input
```

```python
# ❌ DON'T: Trust user input without validation
crop.name = request.data.get('name')  # No validation!
```

### Data Protection

```python
# ✅ DO: Use encryption for sensitive data
from django.conf import settings
from cryptography.fernet import Fernet

cipher = Fernet(settings.ENCRYPTION_KEY)
encrypted_data = cipher.encrypt(sensitive_data.encode())
```

### API Rate Limiting

```python
# ✅ DO: Implement rate limiting
from rest_framework.throttling import UserRateThrottle

class CropThrottle(UserRateThrottle):
    scope = 'crop'
    rate = '100/hour'
```

### Dependencies

```bash
# ✅ DO: Keep dependencies updated
pip install --upgrade pip
pip install -r requirements.txt --upgrade
```

```bash
# ✅ DO: Check for vulnerabilities
pip install safety
safety check
```

### Secrets Management

```bash
# ✅ DO: Use environment variables for secrets
export DATABASE_URL="postgresql://user:pass@localhost/db"
export JWT_SECRET="your-secret-key"
```

```bash
# ❌ DON'T: Commit secrets to repository
# Never add .env, API keys, or credentials to git
echo ".env" >> .gitignore
```

## OWASP Top 10 Prevention

### 1. Broken Access Control
- ✅ Implement role-based access control (RBAC)
- ✅ Validate permissions on every endpoint
- ✅ Use Django's permission system

### 2. Cryptographic Failures
- ✅ Use HTTPS/TLS for all communication
- ✅ Encrypt sensitive data at rest
- ✅ Use strong encryption algorithms (AES-256)

### 3. Injection
- ✅ Use parameterized queries (Django ORM)
- ✅ Validate and sanitize all input
- ✅ Use prepared statements

### 4. Insecure Design
- ✅ Threat modeling during design
- ✅ Security requirements from start
- ✅ Regular security reviews

### 5. Security Misconfiguration
- ✅ Follow security hardening guides
- ✅ Minimal dependencies and services
- ✅ Disable unnecessary features

### 6. Vulnerable and Outdated Components
- ✅ Keep dependencies updated
- ✅ Monitor CVE databases
- ✅ Use `safety` and `npm audit`

### 7. Authentication Failures
- ✅ Implement strong password policies
- ✅ Use secure session management
- ✅ Enable multi-factor authentication

### 8. Software and Data Integrity Failures
- ✅ Use secure CI/CD pipelines
- ✅ Sign commits and releases
- ✅ Verify dependency integrity

### 9. Logging and Monitoring Failures
- ✅ Log security events
- ✅ Monitor for suspicious activity
- ✅ Maintain audit trails

### 10. Server-Side Request Forgery (SSRF)
- ✅ Validate URLs and redirects
- ✅ Restrict outbound connections
- ✅ Use allow-lists for external services

## Data Protection

### GDPR Compliance
- ✅ User data is collected with consent
- ✅ Users can access their data
- ✅ Users can request data deletion
- ✅ Data is stored securely
- ✅ Data breach notification within 72 hours

### Privacy Policy
- ✅ Clear privacy policy available
- ✅ Data retention policies documented
- ✅ Third-party sharing disclosed
- ✅ User rights explained

## Security Headers

```python
# Set security headers in Django
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_SECURITY_POLICY = {
    "default-src": ("'self'",),
    "script-src": ("'self'", "'unsafe-inline'"),
}
```

## Dependency Management

### Regular Updates
```bash
# Check for outdated packages
npm outdated        # Frontend
pip list --outdated # Backend

# Update safely
npm update
pip install --upgrade -r requirements.txt
```

### Vulnerability Scanning

```bash
# Frontend
npm audit
npm audit fix

# Backend
safety check
bandit -r app/
```

## Security Testing

### Static Analysis
```bash
# Frontend
npm run lint
npm run type-check

# Backend
flake8 app/
bandit -r app/
```

### Dynamic Testing
```bash
# OWASP ZAP scanning
docker run -t owasp/zap2docker-stable \
  zap-baseline.py -t http://localhost:3000
```

## Incident Response

### If a Vulnerability is Discovered

1. **Immediately notify**: Contact security@drplant.io
2. **Assess impact**: Determine affected data/users
3. **Contain**: Disable vulnerable functionality if needed
4. **Fix**: Develop and test patch
5. **Release**: Deploy security update
6. **Notify**: Inform users of vulnerability and fix
7. **Review**: Post-incident analysis

## Security Checklist

Before deploying to production:

- [ ] All dependencies are up-to-date
- [ ] No hardcoded secrets in code
- [ ] HTTPS/TLS enabled
- [ ] Security headers configured
- [ ] Authentication implemented
- [ ] Input validation in place
- [ ] Rate limiting enabled
- [ ] Logging and monitoring active
- [ ] Error messages don't leak info
- [ ] Database backups automated
- [ ] Security tests pass
- [ ] Code review completed

## Contact & Disclosure

**Security Email**: security@drplant.io
**PGP Key**: Available upon request

Thank you for helping keep Dr. Plant secure! 🔒

---

*Last Updated: May 17, 2026*
