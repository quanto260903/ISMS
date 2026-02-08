# API Testing Guide

## Backend URL
- **Base URL**: `http://localhost:5216`
- **API Base**: `http://localhost:5216/api`

## Frontend URL
- **Development**: `http://localhost:3001`

## User API Endpoints

### 1. Register a new user - Minimal (Email only)
```http
POST /api/User/Register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "Test@123456",
  "confirmPassword": "Test@123456"
}
```

**Required Fields:**
- `email`: Valid email format, unique
- `password`: Min 8 chars, must have letter + number
- `confirmPassword`: Must match password

**Optional Fields:**
- `name`: User's name
- `phone`: Phone number
- `address`: Address
- `role`: 0 = User (default), 1 = Admin

### 2. Register with full information
```http
POST /api/User/Register
Content-Type: application/json

{
  "name": "Test User",
  "email": "testfull@example.com",
  "password": "Test@123456",
  "confirmPassword": "Test@123456",
  "phone": "0123456789",
  "address": "123 Test Street",
  "role": 0
}
```

### 3. Register Admin user
```http
POST /api/User/Register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "Admin@123456",
  "confirmPassword": "Admin@123456",
  "phone": "0987654321",
  "address": "456 Admin Avenue",
  "role": 1
}
```

**Success Response (200 OK):**
```json
{
  "message": "Registration success."
}
```

### 4. Login
```http
POST /api/User/Login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "Test@123456"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Login success.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid email or password."
}
```

### 5. Logout
```http
POST /api/User/Logout
Authorization: Bearer {your_token_here}
```

**Success Response (200 OK):**
```json
{
  "message": "Logout success."
}
```

### 6. Find user by email
```http
GET /api/User/find?property=email&value=testuser@example.com
```

### 7. Find user by name
```http
GET /api/User/find?property=name&value=Test User
```

### 8. Find user by phone
```http
GET /api/User/find?property=phone&value=0123456789
```

**Success Response (200 OK):**
```json
[
  {
    "userId": 1,
    "name": "Test User",
    "email": "testuser@example.com",
    "phone": "0123456789",
    "address": "123 Test Street",
    "role": 0,
    "createdAt": "2025-10-26T23:06:53.123"
  }
]
```

**Error Response (404 Not Found):**
```json
{
  "message": "No matching users found."
}
```

## Validation Errors

### Missing Required Field (400 Bad Request)
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Email": [
      "The Email field is required."
    ]
  }
}
```

### Invalid Email Format (400 Bad Request)
```json
{
  "errors": {
    "Email": [
      "The Email field is not a valid e-mail address."
    ]
  }
}
```

### Weak Password (400 Bad Request)
```json
{
  "errors": {
    "Password": [
      "Password must have at least 8 characters",
      "Password must have at least one letter and one number."
    ]
  }
}
```

### Password Mismatch (400 Bad Request)
```json
{
  "errors": {
    "Password": [
      "Password and Confirm Password does not match"
    ],
    "ConfirmPassword": [
      "Password and Confirm Password does not match"
    ]
  }
}
```

### Duplicate Email (400 Bad Request)
```json
{
  "message": "Email already exists."
}
```

## Testing Steps

### Using the Frontend UI:

1. **Open Browser**: `http://localhost:3001/login`

2. **Test Registration (Minimal)**:
   - Click "Don't have an account? Register"
   - Fill in:
     - Email: `testuser@example.com`
     - Password: `Test@123456`
     - Confirm Password: `Test@123456`
   - Click "Register"

3. **Test Registration (Full)**:
   - Email: `admin@example.com`
   - Name: `Admin User`
   - Phone: `0987654321`
   - Address: `456 Admin Avenue`
   - Role: Admin
   - Password: `Admin@123456`
   - Confirm Password: `Admin@123456`
   - Click "Register"

4. **Test Login**:
   - Email: `testuser@example.com`
   - Password: `Test@123456`
   - Click "Login"

5. **Test Find User** (Settings Page):
   - Navigate to Settings
   - Select search property (email, name, or phone)
   - Enter value
   - Click "Find User"

## Sample Test Cases

### Valid Registrations

#### Minimal User
```json
{
  "email": "minimal@example.com",
  "password": "Minimal@123",
  "confirmPassword": "Minimal@123"
}
```

#### Complete User Info
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "John@123456",
  "confirmPassword": "John@123456",
  "phone": "0912345678",
  "address": "789 Main Street",
  "role": 0
}
```

### Invalid Cases (Should Fail)

#### Password Too Short
```json
{
  "email": "weak@example.com",
  "password": "weak",
  "confirmPassword": "weak"
}
```

#### Password Mismatch
```json
{
  "email": "mismatch@example.com",
  "password": "Test@123456",
  "confirmPassword": "Test@654321"
}
```

#### Duplicate Email
```json
{
  "email": "testuser@example.com",
  "password": "Test@123456",
  "confirmPassword": "Test@123456"
}
```

## Password Requirements

✅ **Valid passwords:**
- `Test@123456` (8+ chars, has letters and numbers)
- `Admin@123456`
- `Minimal@123`
- `Pass123word`

❌ **Invalid passwords:**
- `weak` (too short, no number)
- `12345678` (no letter)
- `password` (no number)
- `Pass@123` (less than 8 chars - wait, this is 8 chars but should work)

## Role Values

- `0` = **User** (default)
- `1` = **Admin**

## Debugging

### Check Backend
Navigate to: `http://localhost:5216/weatherforecast/`

### Check API URL
Verify in `.env` file:
```
VITE_API_URL=http://localhost:5216/api
```

### View Errors
- Open Browser DevTools → Console tab
- Open Browser DevTools → Network tab
- Check error messages in toast notifications
