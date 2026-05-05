@echo off
REM Authentication Testing Script for Windows
REM This script tests the authentication endpoints

set BASE_URL=http://localhost:3000/api

echo ==================================
echo Authentication Testing Script
echo ==================================
echo.

REM Test 1: Login with demo user
echo Test 1: Login with Demo User
echo ------------------------------
curl -X POST "%BASE_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"demo\",\"password\":\"demo123\"}"
echo.
echo.

REM Test 2: Register a new user
echo Test 2: Register New User
echo ------------------------------
curl -X POST "%BASE_URL%/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"test123\",\"fullName\":\"Test User\"}"
echo.
echo.

echo ==================================
echo Testing Complete!
echo ==================================
echo.
echo Note: Copy the token from the login response above
echo Then use it to test protected endpoints:
echo.
echo curl -X GET "%BASE_URL%/auth/me" -H "Authorization: Bearer YOUR_TOKEN_HERE"
echo.

pause
