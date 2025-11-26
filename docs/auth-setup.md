# Authentication Setup Guide - Basketdubs

This guide documents the complete authentication setup using Google OAuth, Supabase, and React.

---

## Overview

**Stack:**
- **Frontend:** React + Supabase JS Client
- **Backend:** Flask + Supabase Python Client
- **Auth Provider:** Google OAuth 2.0
- **Database:** Supabase (PostgreSQL)

**Flow:**
1. User clicks "Sign in with Google"
2. Supabase redirects to Google OAuth
3. User authenticates with Google
4. Google redirects to Supabase callback
5. Supabase creates session and redirects to app
6. Database trigger auto-creates user profile

---

## Part 1: Google Cloud Console Setup

### 1.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to: **APIs & Services → Credentials**
4. Click **"Create Credentials" → "OAuth 2.0 Client ID"**
5. Configure OAuth consent screen if prompted:
   - User Type: External
   - App name: Basketdubs
   - User support email: Your email
   - Developer contact: Your email

### 1.2 Configure OAuth Client

**Application type:** Web application

**Authorized JavaScript origins:**
```
http://localhost:5173
```

**Authorized redirect URIs:**
```
https://lbbnyriwbstptwvhnvgq.supabase.co/auth/v1/callback
```

**Important:** Replace `lbbnyriwbstptwvhnvgq` with your actual Supabase project reference.

### 1.3 Save Credentials

After creating, you'll get:
- **Client ID:** `156724908519-b2am740d7a6tqck6ajvio17lp9fh84fm.apps.googleusercontent.com`
- **Client Secret:** `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`

Keep these safe - you'll need them for Supabase configuration.

---

## Part 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note your project reference (e.g., `lbbnyriwbstptwvhnvgq`)

### 2.2 Run Database Schema

Go to **SQL Editor** and run the complete schema from `supabase_structure.sql`:

Key components:
- `public.users` table with points and avatar config
- `auth.users` trigger that auto-creates profiles
- Row Level Security (RLS) policies
- Inventory, predictions, and shop tables

### 2.3 Enable Google OAuth Provider

1. Navigate to: **Authentication → Providers**
2. Find **Google** in the list
3. Toggle it **ON**
4. Enter your Google OAuth credentials:
   - **Client ID:** (from Google Cloud Console)
   - **Client Secret:** (from Google Cloud Console)
5. Click **Save**

### 2.4 Configure URL Settings

Navigate to: **Authentication → URL Configuration**

**Site URL:**
```
http://localhost:5173
```

**Redirect URLs:** (Add both)
```
http://localhost:5173/**
http://localhost:5173/court
```

The `**` wildcard allows any path under localhost:5173.

### 2.5 Get API Credentials

Navigate to: **Settings → API**

You need two values:

**Project URL:**
```
https://lbbnyriwbstptwvhnvgq.supabase.co
```

**anon/public key:** (Long JWT token starting with `eyJ...`)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiYm55cml3YnN0cHR3dmhudmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwMjI3NzksImV4cCI6MjA0NzU5ODc3OX0...
```

---

## Part 3: Backend Configuration

### 3.1 Environment Variables

Create/update `backend/.env`:

```env
# Flask
FLASK_SECRET_KEY=your-random-secret-key

# Supabase REST API (NOT database connection string!)
SUPABASE_URL=https://lbbnyriwbstptwvhnvgq.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth (optional for backend)
GOOGLE_CLIENT_ID=156724908519-b2am740d7a6tqck6ajvio17lp9fh84fm.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Direct PostgreSQL (for future use with psycopg2)
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=db.lbbnyriwbstptwvhnvgq.supabase.co
DB_PORT=5432
DB_NAME=postgres
```

**Critical:** Use the HTTPS URL (`https://xxx.supabase.co`), NOT the PostgreSQL connection string!

### 3.2 Backend Files Structure

```
backend/
├── app.py                 # Main Flask app
├── config.py              # Environment config loader
├── supabase_client.py     # Supabase client initialization
├── middleware.py          # Auth middleware (@require_auth)
└── routes/
    └── auth.py            # Auth endpoints
```

### 3.3 Key Backend Code

**supabase_client.py:**
```python
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_client():
    return supabase
```

**Auth Middleware:**
```python
from functools import wraps
from flask import request, jsonify
from supabase_client import get_supabase_client

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authorization'}), 401
        
        token = auth_header.split(' ')[1]
        supabase = get_supabase_client()
        user = supabase.auth.get_user(token)
        
        if not user:
            return jsonify({'error': 'Invalid token'}), 401
        
        request.user = user.user
        return f(*args, **kwargs)
    return decorated_function
```

---

## Part 4: Frontend Configuration

### 4.1 Environment Variables

Create/update `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=156724908519-b2am740d7a6tqck6ajvio17lp9fh84fm.apps.googleusercontent.com

# Supabase REST API
VITE_SUPABASE_URL=https://lbbnyriwbstptwvhnvgq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 Install Dependencies

```bash
npm install @supabase/supabase-js react-router-dom
```

### 4.3 Frontend Files Structure

```
frontend/src/
├── main.jsx                      # App entry point
├── App.jsx                       # Router setup
├── contexts/
│   └── AuthContext.jsx           # Auth state management
├── services/
│   └── supabase.js               # Supabase client
└── pages/
    ├── Login.jsx                 # Login page
    └── Court.jsx                 # Protected page
```

### 4.4 Key Frontend Code

**services/supabase.js:**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**AuthContext.jsx:**
```javascript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/court`
    }
  })
  if (error) throw error
}
```

**Protected Route Pattern:**
```javascript
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  return user ? children : <Navigate to="/login" />
}
```

---

## Part 5: Testing the Setup

### 5.1 Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
py app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5.2 Test Authentication Flow

1. Open `http://localhost:5173`
2. You should be redirected to `/login`
3. Click "Sign in with Google"
4. Authenticate with Google
5. You should be redirected to `/court`
6. Check browser console for session info

### 5.3 Verify Database

Check that user was created:
```
http://localhost:5000/api/test-db
```

Should return user data from `public.users` table.

---

## Common Issues & Solutions

### Issue: "Invalid URL" Error

**Problem:** Using PostgreSQL connection string instead of HTTPS URL

**Wrong:**
```
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

**Correct:**
```
https://xxx.supabase.co
```

### Issue: "Unsupported provider" Error

**Problem:** Google OAuth not enabled in Supabase

**Solution:** Go to Authentication → Providers → Enable Google

### Issue: Stuck on Login Page After Auth

**Problem:** Redirect URL not configured in Supabase

**Solution:** Add `http://localhost:5173/**` to Redirect URLs in Supabase

### Issue: User Not Created in Database

**Problem:** Database trigger not working

**Solution:** Re-run the trigger creation SQL:
```sql
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, username)
  values (
    new.id, 
    new.email, 
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## Security Notes

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use environment variables** for all secrets
3. **The anon key is safe to expose** in frontend (it's public)
4. **Never expose service_role key** in frontend
5. **RLS policies protect data** even with anon key
6. **Use HTTPS in production** - Update all URLs

---

## Production Deployment Checklist

When deploying to production:

- [ ] Update Google OAuth redirect URIs with production domain
- [ ] Update Supabase redirect URLs with production domain
- [ ] Change Site URL in Supabase to production domain
- [ ] Use HTTPS for all URLs
- [ ] Set secure environment variables on hosting platform
- [ ] Enable rate limiting on auth endpoints
- [ ] Set up proper CORS policies
- [ ] Configure custom domain for Supabase (optional)

---

## Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [React Router Protected Routes](https://reactrouter.com/en/main/start/tutorial)

---

**Last Updated:** November 19, 2025
**Project:** Basketdubs v1.0
