"""
NBA Games routes for Basketdubs - SUPABASE VERSION
Read-only endpoint that fetches games from Supabase.
The cron job (score_updater_supabase.py) handles all API calls and updates.
"""
from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from supabase_client import get_supabase_client

games_bp = Blueprint('games', __name__)

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


