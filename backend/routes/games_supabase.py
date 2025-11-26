"""
NBA Games routes for Basketdubs - SUPABASE VERSION
Stores games in Supabase instead of Redis for better integration
"""
from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from balldontlie import BalldontlieAPI
from config import BALLDONTLIE_API_KEY
from supabase_client import get_supabase_client

games_bp = Blueprint('games', __name__)
bdl = BalldontlieAPI(api_key=BALLDONTLIE_API_KEY)

CACHE_DURATION_HOURS = 6

def should_refresh_cache():
    """
    Check if we need to refresh the games cache
    Returns True if:
    - No games in database for today
    - Last update was more than 6 hours ago
    """
    from datetime import timezone
    
    supabase = get_supabase_client()
    today = datetime.now().date()
    six_hours_ago = datetime.now(timezone.utc) - timedelta(hours=CACHE_DURATION_HOURS)
    
    # Check if we have recent games
    result = supabase.table('games').select('updated_at').gte(
        'game_date', str(today - timedelta(days=2))
    ).order('updated_at', desc=True).limit(1).execute()
    
    if not result.data:
        return True  # No games in database
    
    last_update = datetime.fromisoformat(result.data[0]['updated_at'].replace('Z', '+00:00'))
    return last_update < six_hours_ago

def fetch_and_store_games():
    """
    Fetch games from balldontlie API and store in Supabase
    Fetches: yesterday, today, and tomorrow only
    """
    supabase = get_supabase_client()
    today = datetime.now().date()
    
    # Fetch games: yesterday, today, tomorrow
    start_date = today - timedelta(days=1)  # Yesterday
    end_date = today + timedelta(days=1)     # Tomorrow
    
    print(f"🏀 Fetching games from API ({start_date} to {end_date})")
    
    games_response = bdl.nba.games.list(
        start_date=start_date.strftime('%Y-%m-%d'),
        end_date=end_date.strftime('%Y-%m-%d'),
        per_page=100
    )
    
    # Prepare data for upsert
    games_data = []
    for game in games_response.data:
        # Normalize status
        status = game.status if game.status else 'Scheduled'
        is_timestamp = 'T' in str(status)
        if is_timestamp:
            status = 'Scheduled'
        
        game_datetime = game.status if is_timestamp else game.date
        
        games_data.append({
            'id': game.id,
            'game_date': game_datetime,
            'status': status,
            'period': int(game.period) if game.period else None,
            'time': game.time,
            'home_team_id': game.home_team.id,
            'home_team_name': game.home_team.name,
            'home_team_abbreviation': game.home_team.abbreviation,
            'home_team_city': game.home_team.city,
            'home_team_score': int(float(game.home_team_score)) if game.home_team_score else None,
            'visitor_team_id': game.visitor_team.id,
            'visitor_team_name': game.visitor_team.name,
            'visitor_team_abbreviation': game.visitor_team.abbreviation,
            'visitor_team_city': game.visitor_team.city,
            'visitor_team_score': int(float(game.visitor_team_score)) if game.visitor_team_score else None,
        })
    
    # Upsert all games (insert or update if exists)
    if games_data:
        supabase.table('games').upsert(games_data).execute()
        print(f"✓ Stored {len(games_data)} games in Supabase")
        
        # Clean up old games (older than 7 days)
        # This prevents the table from growing forever
        cleanup_old_games(supabase)
    
    return games_data

def cleanup_old_games(supabase):
    """
    Delete games older than 7 days
    This is safe because:
    1. Predictions are only for recent games
    2. Foreign key has ON DELETE CASCADE (deletes orphaned predictions)
    3. Keeps database size manageable
    """
    try:
        cutoff_date = datetime.now() - timedelta(days=7)
        
        # Delete old games
        result = supabase.table('games').delete().lt(
            'game_date', cutoff_date.isoformat()
        ).execute()
        
        if result.data:
            print(f"🗑️  Cleaned up {len(result.data)} old games (older than 7 days)")
    except Exception as e:
        print(f"⚠️  Failed to clean up old games: {e}")
        # Don't fail the whole operation if cleanup fails

@games_bp.route('', methods=['GET'])
def get_games():
    """
    Get games from Supabase (read-only, cron job handles updates)
    Returns games for: yesterday, today, and tomorrow (in server time)
    """
    try:
        supabase = get_supabase_client()
        
        # Just read from Supabase - cron job handles API calls
        print("✓ Reading games from Supabase")
        
        # Fetch games from Supabase: yesterday, today, tomorrow
        # Use datetime to ensure proper comparison with timestamp columns
        now = datetime.now()
        today = now.date()
        
        # Start: beginning of yesterday
        start_datetime = datetime.combine(today - timedelta(days=1), datetime.min.time())
        # End: end of tomorrow
        end_datetime = datetime.combine(today + timedelta(days=1), datetime.max.time())
        
        print(f"📅 Fetching games from {start_datetime} to {end_datetime}")
        
        result = supabase.table('games').select('*').gte(
            'game_date', start_datetime.isoformat()
        ).lte(
            'game_date', end_datetime.isoformat()
        ).execute()
        
        print(f"✓ Found {len(result.data)} games in database")
        
        # Categorize games
        upcoming = []
        recent = []
        
        for game in result.data:
            # Format for frontend
            game_data = {
                'id': game['id'],
                'date': game['game_date'],
                'status': game['status'],
                'period': game['period'],
                'time': game['time'],
                'home_team': {
                    'id': game['home_team_id'],
                    'name': game['home_team_name'],
                    'abbreviation': game['home_team_abbreviation'],
                    'city': game['home_team_city'],
                    'full_name': f"{game['home_team_city']} {game['home_team_name']}"
                },
                'visitor_team': {
                    'id': game['visitor_team_id'],
                    'name': game['visitor_team_name'],
                    'abbreviation': game['visitor_team_abbreviation'],
                    'city': game['visitor_team_city'],
                    'full_name': f"{game['visitor_team_city']} {game['visitor_team_name']}"
                },
                'home_score': game['home_team_score'],
                'visitor_score': game['visitor_team_score']
            }
            
            if game['status'] == 'Scheduled':
                upcoming.append(game_data)
            else:
                recent.append(game_data)
        
        return jsonify({
            'upcoming': upcoming,
            'recent': recent
        }), 200
        
    except Exception as e:
        print(f"ERROR fetching games: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch games: {str(e)}'}), 500

@games_bp.route('/refresh', methods=['POST'])
def force_refresh():
    """
    Manually refresh games from API (for testing)
    """
    try:
        fetch_and_store_games()
        return jsonify({'message': 'Games refreshed successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
