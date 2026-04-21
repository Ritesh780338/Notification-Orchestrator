const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret_key';

// In-memory storage for demo
const notifications = new Map();
const users = new Map();
const preferences = new Map();
const sessions = new Map();

// Create demo user with hashed password
const demoUserId = uuidv4();
const demoPasswordHash = bcrypt.hashSync('demo123', 10);
users.set(demoUserId, {
  id: demoUserId,
  email: 'demo@example.com',
  password: demoPasswordHash,
  name: 'Demo User',
  phone: '+1234567890',
  created_at: new Date()
});

// Also store by email for login lookup
users.set('demo@example.com', demoUserId);

// Create demo preferences
const demoPreferences = [
  { channel: 'email', category: 'marketing', enabled: true },
  { channel: 'email', category: 'transactional', enabled: true },
  { channel: 'sms', category: 'marketing', enabled: true },
  { channel: 'sms', category: 'transactional', enabled: true },
  { channel: 'push', category: 'security', enabled: true },
  { channel: 'in_app', category: 'system_alerts', enabled: true }
];
preferences.set(demoUserId, demoPreferences);

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Login page
app.get('/login', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Notification Orchestrator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .auth-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
            max-width: 450px;
            width: 100%;
        }
        .auth-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .auth-header h1 { font-size: 2em; margin-bottom: 10px; }
        .auth-header p { opacity: 0.9; }
        .auth-content { padding: 40px 30px; }
        .form-group {
            margin-bottom: 25px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
        }
        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1em;
            transition: border-color 0.3s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .btn:active { transform: translateY(0); }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .message {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .message.error {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ef5350;
            display: block;
        }
        .message.success {
            background: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #66bb6a;
            display: block;
        }
        .auth-footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid #e0e0e0;
        }
        .auth-footer a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        .auth-footer a:hover {
            text-decoration: underline;
        }
        .demo-info {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .demo-info strong { color: #856404; }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-header">
            <h1>🔔 Welcome Back</h1>
            <p>Notification Orchestrator</p>
        </div>
        <div class="auth-content">
            <div class="demo-info">
                <strong>Demo Credentials:</strong><br>
                Email: demo@example.com<br>
                Password: demo123
            </div>
            <div id="message" class="message"></div>
            <form id="loginForm">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required placeholder="Enter your password">
                </div>
                <button type="submit" class="btn" id="loginBtn">Login</button>
            </form>
            <div class="auth-footer">
                Don't have an account? <a href="/signup">Sign Up</a>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('loginForm');
        const messageDiv = document.getElementById('message');
        const loginBtn = document.getElementById('loginBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';
            messageDiv.style.display = 'none';

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    messageDiv.className = 'message success';
                    messageDiv.textContent = 'Login successful! Redirecting...';
                    messageDiv.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    messageDiv.className = 'message error';
                    messageDiv.textContent = data.error || 'Login failed';
                    messageDiv.style.display = 'block';
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Login';
                }
            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Network error. Please try again.';
                messageDiv.style.display = 'block';
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        });
    </script>
</body>
</html>
  `);
});

// Signup page
app.get('/signup', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - Notification Orchestrator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .auth-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
            max-width: 450px;
            width: 100%;
        }
        .auth-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .auth-header h1 { font-size: 2em; margin-bottom: 10px; }
        .auth-header p { opacity: 0.9; }
        .auth-content { padding: 40px 30px; }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
        }
        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1em;
            transition: border-color 0.3s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .btn:active { transform: translateY(0); }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .message {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .message.error {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ef5350;
            display: block;
        }
        .message.success {
            background: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #66bb6a;
            display: block;
        }
        .auth-footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 25px;
            border-top: 1px solid #e0e0e0;
        }
        .auth-footer a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        .auth-footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-header">
            <h1>🚀 Create Account</h1>
            <p>Join Notification Orchestrator</p>
        </div>
        <div class="auth-content">
            <div id="message" class="message"></div>
            <form id="signupForm">
                <div class="form-group">
                    <label for="name">Full Name</label>
                    <input type="text" id="name" name="name" required placeholder="Enter your full name">
                </div>
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" placeholder="+1234567890">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required placeholder="Create a password" minlength="6">
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required placeholder="Confirm your password">
                </div>
                <button type="submit" class="btn" id="signupBtn">Create Account</button>
            </form>
            <div class="auth-footer">
                Already have an account? <a href="/login">Login</a>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('signupForm');
        const messageDiv = document.getElementById('message');
        const signupBtn = document.getElementById('signupBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Passwords do not match';
                messageDiv.style.display = 'block';
                return;
            }

            signupBtn.disabled = true;
            signupBtn.textContent = 'Creating account...';
            messageDiv.style.display = 'none';

            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, password })
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.className = 'message success';
                    messageDiv.textContent = 'Account created successfully! Redirecting to login...';
                    messageDiv.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    messageDiv.className = 'message error';
                    messageDiv.textContent = data.error || 'Signup failed';
                    messageDiv.style.display = 'block';
                    signupBtn.disabled = false;
                    signupBtn.textContent = 'Create Account';
                }
            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Network error. Please try again.';
                messageDiv.style.display = 'block';
                signupBtn.disabled = false;
                signupBtn.textContent = 'Create Account';
            }
        });
    </script>
</body>
</html>
  `);
});

// Dashboard (protected route)
app.get('/dashboard', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Notification Orchestrator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header-left h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header-left p { font-size: 1.1em; opacity: 0.9; }
        .header-right {
            text-align: right;
        }
        .user-info {
            background: rgba(255,255,255,0.1);
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 10px;
        }
        .logout-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid white;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        .logout-btn:hover {
            background: white;
            color: #667eea;
        }
        .student-info {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            margin-top: 15px;
            border-radius: 10px;
        }
        .content { padding: 30px; }
        .section {
            background: #f8f9fa;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }
        .section h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        .button-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1em;
            font-weight: bold;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        button:active { transform: translateY(0); }
        .response {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 10px;
            margin-top: 15px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .success { border-left: 5px solid #4caf50; background: #e8f5e9; }
        .error { border-left: 5px solid #f44336; background: #ffebee; }
        .info { border-left: 5px solid #2196f3; background: #e3f2fd; }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .feature {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #e0e0e0;
            text-align: center;
        }
        .feature h3 { color: #667eea; margin-bottom: 10px; }
        .endpoints {
            background: #263238;
            color: #aed581;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .endpoints code {
            display: block;
            margin: 10px 0;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <h1>🔔 Notification Orchestrator</h1>
                <p>Centralized Multi-Channel Notification Management</p>
                <div class="student-info">
                    <strong>Student:</strong> Ritesh Sharma | 
                    <strong>Roll No:</strong> 240410700085 | 
                    <strong>Semester:</strong> 4
                </div>
            </div>
            <div class="header-right">
                <div class="user-info">
                    <div id="userName">Loading...</div>
                    <div id="userEmail" style="font-size: 0.9em; opacity: 0.8;"></div>
                </div>
                <button class="logout-btn" onclick="logout()">🚪 Logout</button>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <h2>📊 System Status</h2>
                <div class="features">
                    <div class="feature">
                        <h3>✅ Server Running</h3>
                        <p>Port ${PORT}</p>
                    </div>
                    <div class="feature">
                        <h3>📧 Email</h3>
                        <p>Mock Adapter</p>
                    </div>
                    <div class="feature">
                        <h3>📱 SMS</h3>
                        <p>Mock Adapter</p>
                    </div>
                    <div class="feature">
                        <h3>🔔 Push</h3>
                        <p>Mock Adapter</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🧪 Try the APIs</h2>
                <div class="button-group">
                    <button onclick="sendNotification()">📧 Send Welcome Email</button>
                    <button onclick="sendSecurityAlert()">🔒 Send Security Alert</button>
                    <button onclick="getPreferences()">⚙️ Get Preferences</button>
                    <button onclick="updatePreferences()">✏️ Update Preferences</button>
                    <button onclick="getNotifications()">📋 View All Notifications</button>
                    <button onclick="clearResponse()">🗑️ Clear Response</button>
                </div>
                <div id="response" class="response info">
                    Click any button above to test the API endpoints...
                </div>
            </div>

            <div class="section">
                <h2>🔌 API Endpoints</h2>
                <div class="endpoints">
                    <code>GET  /health - Health check</code>
                    <code>POST /api/notifications/events - Send notification</code>
                    <code>GET  /api/users/:id/preferences - Get preferences</code>
                    <code>PUT  /api/users/:id/preferences - Update preferences</code>
                    <code>GET  /api/notifications - List all notifications</code>
                </div>
            </div>
        </div>
    </div>

    <script>
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const responseDiv = document.getElementById('response');

        // Check authentication
        if (!token) {
            window.location.href = '/login';
        }

        // Display user info
        document.getElementById('userName').textContent = '👤 ' + (user.name || 'User');
        document.getElementById('userEmail').textContent = user.email || '';

        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        function showLoading() {
            responseDiv.className = 'response info';
            responseDiv.innerHTML = '<div class="loading"></div> Processing...';
        }

        function showResponse(data, isError = false) {
            responseDiv.className = isError ? 'response error' : 'response success';
            responseDiv.textContent = JSON.stringify(data, null, 2);
        }

        async function apiCall(url, options = {}) {
            options.headers = {
                ...options.headers,
                'Authorization': 'Bearer ' + token
            };
            const response = await fetch(url, options);
            if (response.status === 401 || response.status === 403) {
                alert('Session expired. Please login again.');
                logout();
                return;
            }
            return response;
        }

        async function sendNotification() {
            showLoading();
            try {
                const response = await apiCall('/api/notifications/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_type: 'user_signup',
                        user_id: user.id,
                        priority: 'normal',
                        metadata: {
                            first_name: user.name,
                            email: user.email
                        }
                    })
                });
                const data = await response.json();
                showResponse(data);
            } catch (error) {
                showResponse({ error: error.message }, true);
            }
        }

        async function sendSecurityAlert() {
            showLoading();
            try {
                const response = await apiCall('/api/notifications/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_type: 'security_alert',
                        user_id: user.id,
                        priority: 'critical',
                        metadata: {
                            first_name: user.name,
                            location: 'New York, USA',
                            ip_address: '192.168.1.1'
                        }
                    })
                });
                const data = await response.json();
                showResponse(data);
            } catch (error) {
                showResponse({ error: error.message }, true);
            }
        }

        async function getPreferences() {
            showLoading();
            try {
                const response = await apiCall('/api/users/' + user.id + '/preferences');
                const data = await response.json();
                showResponse(data);
            } catch (error) {
                showResponse({ error: error.message }, true);
            }
        }

        async function updatePreferences() {
            showLoading();
            try {
                const response = await apiCall('/api/users/' + user.id + '/preferences', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        preferences: [
                            { channel: 'email', category: 'marketing', enabled: false },
                            { channel: 'sms', category: 'marketing', enabled: false }
                        ]
                    })
                });
                const data = await response.json();
                showResponse(data);
            } catch (error) {
                showResponse({ error: error.message }, true);
            }
        }

        async function getNotifications() {
            showLoading();
            try {
                const response = await apiCall('/api/notifications');
                const data = await response.json();
                showResponse(data);
            } catch (error) {
                showResponse({ error: error.message }, true);
            }
        }

        function clearResponse() {
            responseDiv.className = 'response info';
            responseDiv.textContent = 'Response cleared. Click any button above to test the API endpoints...';
        }
    </script>
</body>
</html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    demo_mode: true
  });
});

// Root route - Main website (protected)
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification Orchestrator - Home</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .navbar {
            background: rgba(255,255,255,0.95);
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .navbar-brand {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
        }
        .navbar-menu {
            display: flex;
            gap: 30px;
            align-items: center;
        }
        .navbar-menu a {
            color: #333;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s;
        }
        .navbar-menu a:hover {
            color: #667eea;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 25px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            transition: transform 0.2s;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
            padding: 10px 25px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s;
        }
        .btn-secondary:hover {
            background: #667eea;
            color: white;
        }
        .hero {
            text-align: center;
            padding: 100px 20px;
            color: white;
        }
        .hero h1 {
            font-size: 4em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .hero p {
            font-size: 1.5em;
            margin-bottom: 40px;
            opacity: 0.95;
        }
        .hero-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .hero-buttons a {
            padding: 15px 40px;
            font-size: 1.1em;
        }
        .features {
            background: white;
            padding: 80px 20px;
        }
        .features-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .features h2 {
            text-align: center;
            font-size: 2.5em;
            color: #333;
            margin-bottom: 60px;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
        }
        .feature-card {
            background: #f8f9fa;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .feature-icon {
            font-size: 3em;
            margin-bottom: 20px;
        }
        .feature-card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        .feature-card p {
            color: #666;
            line-height: 1.6;
        }
        .cta {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 80px 20px;
            text-align: center;
            color: white;
        }
        .cta h2 {
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        .cta p {
            font-size: 1.2em;
            margin-bottom: 40px;
            opacity: 0.95;
        }
        .footer {
            background: #263238;
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .footer p {
            opacity: 0.8;
        }
        .user-info {
            background: rgba(102, 126, 234, 0.1);
            padding: 10px 20px;
            border-radius: 8px;
            color: #667eea;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-brand">🔔 Notification Orchestrator</div>
        <div class="navbar-menu">
            <a href="/">Home</a>
            <a href="#features">Features</a>
            <a href="/dashboard">Dashboard</a>
            <div id="authButtons">
                <a href="/login" class="btn-secondary">Login</a>
                <a href="/signup" class="btn-primary">Sign Up</a>
            </div>
        </div>
    </nav>

    <section class="hero">
        <h1>🔔 Notification Orchestrator</h1>
        <p>Centralized Multi-Channel Notification Management Service</p>
        <div class="hero-buttons">
            <a href="/signup" class="btn-primary">Get Started</a>
            <a href="/dashboard" class="btn-secondary">View Dashboard</a>
        </div>
    </section>

    <section class="features">
        <div class="features-container">
            <h2>Powerful Features</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">📧</div>
                    <h3>Multi-Channel Delivery</h3>
                    <p>Send notifications via Email, SMS, Push, and In-App channels from a single API.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⚙️</div>
                    <h3>User Preferences</h3>
                    <p>Respect user opt-in/opt-out settings with granular control per channel and category.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📝</div>
                    <h3>Template Engine</h3>
                    <p>Dynamic templates with variable substitution for personalized notifications.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⏰</div>
                    <h3>Scheduling</h3>
                    <p>Schedule notifications for future delivery with precise timing control.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔄</div>
                    <h3>Retry Mechanism</h3>
                    <p>Automatic retry with exponential backoff for failed deliveries.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3>Delivery Tracking</h3>
                    <p>Complete visibility into notification lifecycle with detailed logs.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="cta">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of developers using Notification Orchestrator</p>
        <a href="/signup" class="btn-secondary" style="background: white; color: #667eea;">Create Free Account</a>
    </section>

    <footer class="footer">
        <p>🎓 College Project by Ritesh Sharma (Roll No: 240410700085)</p>
        <p style="margin-top: 10px;">Notification Orchestrator © 2024</p>
    </footer>

    <script>
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (token && user.name) {
            document.getElementById('authButtons').innerHTML = \`
                <span class="user-info">👤 \${user.name}</span>
                <a href="#" onclick="logout()" class="btn-secondary">Logout</a>
            \`;
        }

        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        }
    </script>
</body>
</html>
  `);
});

// Auth API - Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      id: userId,
      name,
      email,
      phone: phone || '',
      password: passwordHash,
      created_at: new Date()
    };

    users.set(userId, newUser);
    users.set(email, userId);

    // Create default preferences
    const defaultPrefs = [
      { channel: 'email', category: 'marketing', enabled: true },
      { channel: 'email', category: 'transactional', enabled: true },
      { channel: 'sms', category: 'marketing', enabled: true },
      { channel: 'sms', category: 'transactional', enabled: true },
      { channel: 'push', category: 'security', enabled: true },
      { channel: 'in_app', category: 'system_alerts', enabled: true }
    ];
    preferences.set(userId, defaultPrefs);

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: userId,
        name,
        email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth API - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userId = users.get(email);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users.get(userId);
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send notification (protected)
app.post('/api/notifications/events', authenticateToken, (req, res) => {
  try {
    const { event_type, user_id, priority, metadata } = req.body;
    
    if (!event_type || !user_id) {
      return res.status(400).json({ error: 'event_type and user_id are required' });
    }

    const eventId = `evt_${uuidv4()}`;
    const notificationId = uuidv4();
    
    const notification = {
      id: notificationId,
      event_id: eventId,
      event_type,
      user_id,
      priority: priority || 'normal',
      metadata: metadata || {},
      status: 'delivered',
      channels: ['email', 'sms', 'push'],
      created_at: new Date(),
      delivered_at: new Date()
    };
    
    notifications.set(notificationId, notification);

    res.status(202).json({
      message: 'Event accepted and processed',
      event_id: eventId,
      notification_id: notificationId,
      status: 'delivered',
      channels_delivered: ['email', 'sms', 'push']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user preferences (protected)
app.get('/api/users/:userId/preferences', authenticateToken, (req, res) => {
  const { userId } = req.params;
  const userPrefs = preferences.get(userId) || [];
  
  res.json({
    user_id: userId,
    preferences: userPrefs
  });
});

// Update user preferences (protected)
app.put('/api/users/:userId/preferences', authenticateToken, (req, res) => {
  const { userId } = req.params;
  const { preferences: newPrefs } = req.body;
  
  if (!newPrefs || !Array.isArray(newPrefs)) {
    return res.status(400).json({ error: 'preferences array is required' });
  }

  const currentPrefs = preferences.get(userId) || [];
  
  newPrefs.forEach(newPref => {
    const index = currentPrefs.findIndex(
      p => p.channel === newPref.channel && p.category === newPref.category
    );
    if (index >= 0) {
      currentPrefs[index] = newPref;
    } else {
      currentPrefs.push(newPref);
    }
  });
  
  preferences.set(userId, currentPrefs);
  
  res.json({
    message: 'Preferences updated successfully',
    user_id: userId,
    preferences: currentPrefs
  });
});

// Get all notifications (protected)
app.get('/api/notifications', authenticateToken, (req, res) => {
  const allNotifications = Array.from(notifications.values())
    .sort((a, b) => b.created_at - a.created_at);
  
  res.json({
    total: allNotifications.length,
    notifications: allNotifications
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log('🚀 Notification Orchestrator - DEMO MODE');
  console.log('🚀 ========================================');
  console.log('');
  console.log('✅ Server running on: http://localhost:' + PORT);
  console.log('✅ Demo User ID: ' + demoUserId);
  console.log('');
  console.log('📖 Open in browser: http://localhost:' + PORT);
  console.log('');
  console.log('🎓 Student: Ritesh Sharma (240410700085)');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('========================================');
});

module.exports = app;
