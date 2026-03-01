# Google OAuth Setup Guide

This guide will walk you through setting up the MongoDB + Google OAuth authentication system for Slingshot.

## What's New

- **Authentication**: Replaced Supabase OAuth with standalone MongoDB + Google OAuth
- **Backend**: FastAPI with JWT tokens (python-jose)
- **Database**: MongoDB for user management
- **Frontend**: Google Sign-In library integration with fallback to email/password

## Prerequisites

### 1. MongoDB Setup

**Option A: Local MongoDB (Development)**
```bash
# Install MongoDB Community Edition
# Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
# macOS: brew install mongodb-community
# Linux: Follow official docs

# Start MongoDB
mongod
# Default: mongodb://localhost:27017
```

**Option B: MongoDB Atlas (Cloud)**
```bash
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string: mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

### 2. Google OAuth Credentials

```bash
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable Google+ API:
   - APIs & Services → Library
   - Search "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 Credentials:
   - APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: "Web application"
   - Add Authorized JavaScript origins:
     - http://localhost:5173 (dev frontend)
     - http://localhost:3000 (alternative)
     - https://yourdomain.com (production)
   - Add Authorized redirect URIs:
     - http://localhost:5173/auth/callback (dev)
     - https://yourdomain.com/auth/callback (production)
   - Copy Client ID and Client Secret
```

## Setup Steps

### 1. Backend Configuration

**Create `.env` file in `backend/` directory:**

```env
# Required
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=agentshield

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Supabase (optional, for email/password fallback)
GROQ_API_KEY=your_groq_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
SYSTEM_PROMPT=You are a helpful assistant.
```

### 2. Frontend Configuration

**Create `.env` file in project root directory:**

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
npm install
```

## Running the Application

### Terminal 1: MongoDB
```bash
mongod
# Should see: "Waiting for connections on port 27017"
```

### Terminal 2: Backend
```bash
cd backend
python -m uvicorn main:app --reload
# Should see: "Uvicorn running on http://127.0.0.1:8000"
```

### Terminal 3: Frontend
```bash
npm run dev
# Should see: "Local:   http://localhost:5173"
```

## Testing the Auth Flow

### Google Sign-In (NEW)

1. Navigate to `http://localhost:5173`
2. Click "Sign in" → "Google" button
3. A Google login popup appears
4. Sign in with your Google account
5. You should be redirected to `/dashboard` or `/chat`
6. Token should be stored in `localStorage.auth_token`

### Email/Password Sign-In (Fallback via Supabase)

1. Navigate to `http://localhost:5173`
2. Navigate to "Sign up" tab
3. Enter email, password, name, select role
4. Click "Create Account"
5. Should redirect to dashboard

## API Endpoints Reference

### OAuth Endpoints

```
POST /auth/google
├─ Body: { "id_token": "google_id_token_here" }
└─ Response: { "access_token": "jwt_token", "email": "user@example.com", "role": "user"|"admin" }

GET /auth/google/callback
├─ Query: ?code=authorization_code&state=state
└─ Response: Redirects with JWT or error

POST /auth/verify-token
├─ Body: { "token": "jwt_token" }
└─ Response: { "valid": true|false, "email": "user@example.com" }

GET /auth/me
├─ Header: Authorization: Bearer jwt_token
└─ Response: { "id": "user_id", "email": "user@example.com", "role": "user"|"admin" }
```

## Troubleshooting

### "Google Client ID not configured"
- Check `.env` file has `VITE_GOOGLE_CLIENT_ID`
- Verify it matches Google Console credentials
- Restart `npm run dev` after adding to `.env`

### "MongoDB connection failed"
- Ensure `mongod` is running
- Check `MONGODB_URL` in `backend/.env`
- For Atlas: verify IP whitelist includes your IP

### "redirect_uri_mismatch" error
- Check Google Console OAuth settings
- Ensure `http://localhost:5173/auth/callback` is in "Authorized redirect URIs"
- Verify `GOOGLE_REDIRECT_URI` in backend `.env` matches

### "Invalid token" on sign-in
- Check `SECRET_KEY` is consistent between runs
- Verify token hasn't expired (default: 30 min)
- Check browser console for detailed errors

### User not created in MongoDB
- Check MongoDB is running (`mongod`)
- Verify `MONGODB_URL` is correct
- Check backend logs for connection errors

## File Inventory

**New Files Created:**
- `backend/mongodb.py` - MongoDB utilities and user CRUD
- `backend/google_oauth.py` - Google OAuth token verification and JWT handling
- `backend/api/oauth_routes.py` - OAuth endpoint handlers

**Modified Files:**
- `backend/main.py` - Added oauth router registration
- `backend/config.py` - Added MongoDB and OAuth settings
- `backend/requirements.txt` - Added pymongo, google-auth-oauthlib, python-jose, passlib
- `src/app/components/Auth.tsx` - Updated to use new /auth/google endpoint
- `src/app/components/AuthCallback.tsx` - Updated to handle new JWT flow
- `backend/.env.example` - Updated with new required variables
- `.env.example` - Created frontend environment template

## Next Steps

1. ✅ Backend OAuth infrastructure created
2. ✅ Frontend Auth components updated  
3. ✅ MongoDB integration ready
4. ⏳ **Install MongoDB** (if not already installed)
5. ⏳ **Add Google OAuth credentials** to `.env` files
6. ⏳ **Run setup**: mongod + backend + frontend
7. ⏳ **Test OAuth flow**: click Google sign-in button
8. ⏳ (Optional) Deploy to production with proper credentials

## Production Deployment

Before deploying:

1. **Change SECRET_KEY** in `backend/.env` to a long random string
2. **Update Google OAuth URIs** to your production domain
3. **Use MongoDB Atlas** or managed MongoDB service
4. **Set environment variables** on your hosting platform (don't commit `.env`)
5. **Enable HTTPS** - Google OAuth requires HTTPS redirects in production
6. **Update VITE_API_URL** to your backend domain
7. **Set CORS** headers properly in backend

## Support

For issues:
- Check browser console (F12 → Console)
- Check backend logs (`python -m uvicorn main:app --reload`)
- Review `.env` files for missing/incorrect values
- Verify MongoDB is running and accessible
- Ensure Google OAuth credentials are correct

---

**Last Updated:** March 2026  
**Status:** OAuth system fully implemented with MongoDB backend
