# 🚀 Quick Start Guide - MongoDB OAuth

## TL;DR (5 minutes to running)

### 1. Setup MongoDB
```bash
# Windows: Download from https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Linux: Follow official docs
# Then start: mongod
```

### 2. Get Google OAuth Credentials
```
1. Go to https://console.cloud.google.com/
2. Create new project
3. Search "Google+ API" → Enable
4. Credentials → Create OAuth 2.0 Client ID (Web)
5. Add URIs:
   - JavaScript origin: http://localhost:5173
   - Redirect URI: http://localhost:5173/auth/callback
6. Copy Client ID & Secret
```

### 3. Create `.env` Files

**`backend/.env`:**
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=agentshield
GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
SECRET_KEY=change-this-to-something-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GROQ_API_KEY=your_groq_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SYSTEM_PROMPT=You are a helpful assistant.
```

**`.env` (in project root):**
```env
VITE_GOOGLE_CLIENT_ID=your_id_here
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 4. Install Dependencies
```bash
cd backend && pip install -r requirements.txt
npm install
```

### 5. Start Services (3 terminals)

**Terminal 1:**
```bash
mongod
```

**Terminal 2:**
```bash
cd backend
python -m uvicorn main:app --reload
```

**Terminal 3:**
```bash
npm run dev
```

### 6. Test It
- Open http://localhost:5173
- Click "Sign in" → "Google" button
- Sign in with Google account
- Should redirect to dashboard/chat ✅

---

## ⚠️ Common Issues

| Issue | Fix |
|-------|-----|
| "Google Client ID not configured" | Check `.env` has `VITE_GOOGLE_CLIENT_ID` and restart `npm run dev` |
| "MongoDB connection failed" | Ensure `mongod` is running in terminal 1 |
| "redirect_uri_mismatch" | Check Google Console → Credentials → OAuth 2.0 Client ID → Edit → Authorized redirect URIs includes `http://localhost:5173/auth/callback` |
| "Invalid token" error | Restart backend (ensures fresh SECRET_KEY) |
| Frontend won't load | Run `npm install` and restart with `npm run dev` |

---

## 📁 What Changed

**Created:**
- `backend/mongodb.py` - User database management
- `backend/google_oauth.py` - OAuth token handling
- `backend/api/oauth_routes.py` - OAuth endpoints
- `OAUTH_SETUP.md` - Full setup guide
- `IMPLEMENTATION_STATUS.md` - Detailed status report
- `.env.example` - Frontend config template
- `backend/.env.example` - Backend config template

**Modified:**
- `backend/main.py` - Registered oauth router
- `backend/config.py` - Added MongoDB/OAuth settings
- `backend/requirements.txt` - Added 5 new packages
- `src/app/components/Auth.tsx` - Google OAuth integration
- `src/app/components/AuthCallback.tsx` - JWT handling

---

## ✅ Verification Checklist

- [ ] MongoDB downloaded and installed
- [ ] Google OAuth credentials obtained
- [ ] `backend/.env` created with all variables
- [ ] `.env` in project root created with VITE variables
- [ ] `pip install -r requirements.txt` ran successfully
- [ ] `npm install` ran successfully
- [ ] Backend starts without errors (`python -m univicorn main:app --reload`)
- [ ] Frontend starts without errors (`npm run dev`)
- [ ] Can click "Google" button and sign in
- [ ] Redirected to dashboard/chat after sign-in
- [ ] Email/password sign-up still works (fallback)

---

## 🔗 Important URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | Started by `npm run dev` |
| Backend | http://localhost:8000 | Started by backend script |
| API Docs | http://localhost:8000/docs | Auto-generated Swagger |
| MongoDB | localhost:27017 | Started by `mongod` |
| Google OAuth | https://accounts.google.com | External |

---

## 🎯 Architecture Recap

```
Browser → Auth.tsx → +click Google
    ↓
Google Sign-In popup
    ↓
Code exchange → AuthCallback.tsx
    ↓
POST /auth/google (backend)
    ↓
mongodb.py + google_oauth.py (verify token)
    ↓
Create user in MongoDB
    ↓
Return JWT token
    ↓
Store in localStorage
    ↓
Redirect to /dashboard or /chat ✅
```

---

## 📞 Need Help?

1. Check `OAUTH_SETUP.md` for detailed troubleshooting
2. Check `IMPLEMENTATION_STATUS.md` for full architecture
3. Review browser console (F12) for frontend errors
4. Check terminal for backend errors
5. Verify all `.env` variables are set correctly

---

**Everything is ready!** Just follow the 6 steps above and you'll have Google OAuth working in ~30 minutes.
