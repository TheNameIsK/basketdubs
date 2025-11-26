# 🏀 Basketdubs

A gamified NBA prediction app where you pick game winners to earn points and customize your avatar. Zero gambling, 100% fun.

## What It Does

- **Predict NBA games** - Pick winners for upcoming games
- **Earn points** - Get +2 points for correct predictions, -1 for wrong ones
- **Customize your avatar** - Spend points on jerseys, shoes, headbands, and backgrounds
- **Compete on the leaderboard** - See how you stack up against other players
- **Chat with LeBot** - AI assistant that knows everything about basketball

## Tech Stack

**Frontend:**
- React + Vite
- Tailwind CSS
- React Router
- Axios

**Backend:**
- Python Flask
- APScheduler (cron jobs)
- Google Gemini AI
- balldontlie.io API

**Database & Auth:**
- Supabase (PostgreSQL)
- Google OAuth

## Features

### The Court (Main Page)
- View upcoming games and make predictions
- See recent game results with your win/loss record
- Track your points balance
- View prediction history with team logos

### The Shop
- Browse avatar items by category (head, body, shoes, backgrounds)
- Purchase items with earned points
- See what you already own

### Profile
- View your avatar with equipped items
- Check your stats (win rate, current streak)
- Edit your username
- Manage your inventory

### Leaderboard
- Top 50 players ranked by all-time points
- See your rank even if you're not in the top 50
- Gold/silver/bronze medals for top 3

### LeBot AI Assistant
- Chat with an NBA-obsessed AI
- Get basketball facts, rules, and history
- 10 messages per day with context memory
- Strict NBA-only guardrails

## How It Works

1. **Sign in with Google** - Quick OAuth authentication
2. **Pick your username** - Set up your profile
3. **Make predictions** - Click a team to predict they'll win
4. **Wait for results** - Games are scored automatically every 10 minutes
5. **Earn points** - Correct predictions give you +2 points
6. **Spend points** - Buy avatar items in the shop
7. **Climb the leaderboard** - Compete for the top spot

## Project Structure

```
basketdubs/
├── backend/
│   ├── routes/          # API endpoints
│   ├── cron/            # Background jobs
│   ├── utils/           # Helper functions
│   ├── app.py           # Flask app
│   └── config.py        # Configuration
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # Auth context
│   │   └── services/    # API clients
│   └── public/
│       └── assets/      # Images and logos
└── docs/                # Documentation
```

## Local Development

### Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase account
- Google OAuth credentials
- API keys (balldontlie, Gemini)

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
FLASK_SECRET_KEY=your_secret_key
BALLDONTLIE_API_KEY=your_api_key
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_secret_key
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

Run the backend:
```bash
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Run the frontend:
```bash
npm run dev
```

### Database Setup

Run the SQL schema in Supabase:
```bash
# Apply the schema from supabase_structure.sql
```

## Deployment

See `docs/deployment-guide.md` for full deployment instructions.

**Quick overview:**
- Backend: Render (Flask with gunicorn)
- Frontend: Vercel (React + Vite)
- Database: Supabase (PostgreSQL)
- Keep-alive: UptimeRobot

## Key Features Explained

### Automatic Scoring
A background job runs every 10 minutes to:
1. Fetch finished games from the NBA API
2. Compare results with user predictions
3. Award points (+2 for wins, -1 for losses)
4. Update the leaderboard

### Smart Caching
Games are cached in Supabase for 6 hours to:
- Reduce API calls
- Speed up prediction history (110x faster!)
- Persist data across server restarts

### Rate Limiting
- LeBot: 10 messages per day per user
- Prediction history: Optimized with database JOINs (no rate limiting needed)

## Documentation

- `docs/deployment-guide.md` - Full deployment walkthrough
- `docs/deployment-checklist.md` - Quick deployment reference
- `docs/auth-setup.md` - Google OAuth configuration
- `docs/lebot-ai-assistant.md` - AI assistant details
- `docs/leaderboard-feature.md` - Leaderboard implementation
- `docs/asset-management.md` - Asset organization

## Security Notes

- Never commit `.env` files (already in `.gitignore`)
- Use environment variables for all secrets
- Supabase anon key is safe to expose (it's public by design)
- Backend secret keys must stay private

## Contributing

This is a private repo, but if you're working on it:

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a PR with description

## License

Private project - All rights reserved

---