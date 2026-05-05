# Authentication Guide

## Overview

The Notification Orchestrator includes a complete JWT-based authentication system to secure the dashboard and API endpoints.

## Features

- ✅ JWT (JSON Web Token) authentication
- ✅ Secure password hashing with bcrypt
- ✅ Login and registration pages
- ✅ Protected API routes
- ✅ Session management
- ✅ Role-based access control (User/Admin)
- ✅ Automatic token refresh
- ✅ Logout functionality

---

## Quick Start

### 1. Create Demo Users

Run the seed script to create demo accounts:

```bash
npm run seed
```

This creates two accounts:
- **Demo User**: `demo` / `demo123` (regular user)
- **Admin User**: `admin` / `admin123` (admin privileges)

### 2. Login

Navigate to `http://localhost:3000` and you'll be redirected to the login page.

Use the demo credentials:
- Username: `demo`
- Password: `demo123`

---

## API Authentication

### Register a New User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "demo",
  "password": "demo123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "demo",
    "email": "demo@notifyhub.com",
    "fullName": "Demo User",
    "role": "user"
  }
}
```

### Using the Token

Include the token in the Authorization header for protected routes:

```bash
GET /api/notifications/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Logout

```bash
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get Current User

```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Change Password

```bash
PUT /api/auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

---

## Frontend Integration

### Login Flow

1. User enters credentials on `/login.html`
2. Frontend sends POST request to `/api/auth/login`
3. Server validates credentials and returns JWT token
4. Frontend stores token in `localStorage`
5. Frontend redirects to dashboard

### Protected Routes

The main dashboard (`/index.html`) checks for authentication:

```javascript
// Check if user is logged in
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
}
```

### API Requests

All API requests include the token:

```javascript
const response = await fetch('/api/notifications/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});
```

### Logout

```javascript
function handleLogout() {
  // Call logout API
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login
  window.location.href = '/login.html';
}
```

---

## Security Configuration

### Environment Variables

Set these in your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=24h
```

**Important:** Change `JWT_SECRET` to a strong random string in production!

### Token Expiration

Tokens expire after 24 hours by default. Configure this with `JWT_EXPIRES_IN`:

```env
JWT_EXPIRES_IN=24h    # 24 hours
JWT_EXPIRES_IN=7d     # 7 days
JWT_EXPIRES_IN=30m    # 30 minutes
```

### Password Requirements

- Minimum 6 characters
- Hashed with bcrypt (10 salt rounds)
- Never stored in plain text

---

## User Roles

### User (Default)
- Access to dashboard
- Send notifications
- View own notifications
- Manage own preferences

### Admin
- All user permissions
- View all users
- Manage system settings
- Access admin panel (future feature)

---

## Database Schema

### User Model

```javascript
{
  username: String,      // Unique, 3-30 chars
  email: String,         // Unique, valid email
  password: String,      // Hashed with bcrypt
  fullName: String,      // Display name
  role: String,          // 'user' or 'admin'
  isActive: Boolean,     // Account status
  lastLogin: Date,       // Last login timestamp
  createdAt: Date,       // Account creation
  updatedAt: Date        // Last update
}
```

---

## Troubleshooting

### "Invalid or expired token"

**Cause:** Token has expired or is invalid

**Solution:** 
- Login again to get a new token
- Check if `JWT_SECRET` matches between sessions

### "Access denied. No token provided"

**Cause:** Request missing Authorization header

**Solution:**
- Include `Authorization: Bearer <token>` header
- Check if token is stored in localStorage

### "Username or email already exists"

**Cause:** Trying to register with existing credentials

**Solution:**
- Use a different username or email
- Login if you already have an account

### Can't login after server restart

**Cause:** JWT_SECRET changed or database connection issue

**Solution:**
- Ensure `.env` file has consistent `JWT_SECRET`
- Check MongoDB connection
- Clear browser localStorage and try again

---

## Best Practices

1. **Never commit JWT_SECRET** - Keep it in `.env` and add to `.gitignore`
2. **Use HTTPS in production** - Tokens should only be sent over secure connections
3. **Set appropriate token expiration** - Balance security and user experience
4. **Implement token refresh** - For long-lived sessions (future enhancement)
5. **Log security events** - Track failed login attempts, password changes
6. **Rate limit auth endpoints** - Prevent brute force attacks
7. **Validate input** - Always validate and sanitize user input

---

## Future Enhancements

- [ ] Email verification
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub)
- [ ] Token refresh mechanism
- [ ] Session management dashboard
- [ ] Account lockout after failed attempts
- [ ] Password strength meter
- [ ] Remember me functionality

---

## Support

For issues or questions:
- Check the [main README](../../README.md)
- Review [API documentation](../api/API_REFERENCE.md)
- Contact: Ritesh Sharma (240410700085)
