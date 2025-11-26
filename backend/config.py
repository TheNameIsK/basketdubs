import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')
BALLDONTLIE_API_KEY = os.getenv('BALLDONTLIE_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Supabase - NEW API Key System
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SECRET_KEY = os.getenv('SUPABASE_SECRET_KEY')  # For backend operations (bypasses RLS)
SUPABASE_PUBLISHABLE_KEY = os.getenv('SUPABASE_PUBLISHABLE_KEY')  # For frontend (respects RLS)

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

REFRESH_INTERVAL_SECONDS = 600  # Interval for refreshing data

REFRESH_INTERVAL_SECONDS = 600  # Interval for refreshing data
