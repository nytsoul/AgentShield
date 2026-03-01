# Google Authentication Debugging Guide

## Latest Fix: `requestCredential is not a function`

### ✅ FIXED (March 1, 2026)

**Error:** `TypeError: window.google.accounts.id.requestCredential is not a function`

**Problem:** The method `requestCredential()` doesn't exist in Google's Sign-In library

**Solution:**
1. ✅ Changed from `requestCredential()` → `google.accounts.id.prompt()` 
2. ✅ Added `useCallback` hook for stable callback function
3. ✅ Improved script loading with proper `onload` callback
4. ✅ Added fallback to OAuth2 authorization code flow
5. ✅ Better console logging with emoji indicators (✅ ❌ 📌 📤)

**Expected Console Output:**
```
✅ Google GSI script loaded
✅ Google Sign-In initialized with client ID: 1051549067212-...
📌 Opening Google One Tap prompt...
[Google popup appears]
📌 Received credential response: true
📤 Sending ID token to backend...
✅ Successfully authenticated: your_email@gmail.com
[Redirects to dashboard]
```

---

## Previous Fixed Issues

✅ **Missing google-auth package** - Added `google-auth==2.27.0` to requirements.txt  
✅ **Improved Auth.tsx script loading** - Now waits for script to load before initializing  
✅ **Fixed credential request flow** - Now uses correct `google.accounts.id.prompt()` method  
✅ **Better error handling** - Detailed console logs for debugging  

## Testing Google OAuth

### Prerequisites
1. Backend `.env` has:
```env
GOOGLE_CLIENT_ID=1051549067212-bn2q2ap4iran0kks75krk1fqrjb773bu.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
SECRET_KEY=your_secret_key
```

2. Frontend `.env` has:
```env
VITE_GOOGLE_CLIENT_ID=1051549067212-bn2q2ap4iran0kks75krk1fqrjb773bu.apps.googleusercontent.com
VITE_API_URL=http://localhost:8000
```

3. MongoDB is running (if you want persistent user storage):
```bash
mongod
```

### Start Services

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn main:app --reload
# Should see: Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Should see: Local:   http://localhost:5173
```

### Test Google Sign-In

1. **Open browser to** `http://localhost:5173`
2. **Open DevTools** (F12 → Console)
3. **Click "Sign in" button** to go to Auth page
4. **Click "Google" button**
5. **Check browser console** for these logs (in order):
   ```
   Google GSI script loaded
   Google Sign-In initialized: 1051549067212-...
   Received credential response: true
   Sending ID token to backend...
   Successfully authenticated: your_email@gmail.com
   ```


### Flow Diagram

```
User clicks "Google" button
              ↓
Google Sign-In script loads (accounts.google.com)
              ↓
User completes Google login
              ↓
Browser receives credential (JWT)
              ↓
Frontend sends ID token to POST /auth/google
              ↓
Backend verifies token with Google servers
              ↓
Backend creates/updates user in MongoDB
              ↓
Backend returns JWT access token
              ↓
Frontend stores token in localStorage
              ↓
User redirected to /dashboard ✅
```

## Common Installation Issues

```bash
# If pip install fails
pip install --upgrade pip

# If permissions issue
python -m pip install google-auth==2.27.0

# If requirements not installed
cd backend
pip install -r requirements.txt
```

## Verify Dependencies

```bash
python -c "from google.auth.transport.requests import Request; print('✓ google-auth installed')"
python -c "from google.oauth2.id_token import verify_oauth2_token; print('✓ OAuth2 token modules available')"
python -c "from pymongo import MongoClient; print('✓ MongoDB driver ready')"
python -c "from jose import jwt; print('✓ JWT library ready')"
```
