"""
Supabase client initialization for Basketdubs backend
"""
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SECRET_KEY

# Initialize Supabase client with secret key (bypasses RLS for backend operations)
# This uses the new Supabase API key system
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

def get_supabase_client():
    """Returns the initialized Supabase client with privileged access"""
    return supabase
