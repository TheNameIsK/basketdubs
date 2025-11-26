"""
Score Updater Cron Job for Basketdubs - SUPABASE VERSION

This job runs every 10 minutes to:
1. Fetch finished games from balldontlie API
2. Update games table in Supabase with latest scores
3. Find predictions for those games
4. Calculate winners and update user points
5. Mark predictions as 'settled'
"""
from datetime import datetime, timedelta
from balldontlie import BalldontlieAPI
from config import BALLDONTLIE_API_KEY
from supabase_client import get_supabase_client

bdl = BalldontlieAPI(api_key=BALLDONTLIE_API_KEY)
supabase = get_supabase_client()

def update_scores():
    """
    Main function that runs every 10 minutes
    """
    print(f"\n{'='*60}")
    print(f"🏀 SCORE UPDATER - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    try:
        # Step 1: Get games from the last 2 days
        today = datetime.now().date()
        two_days_ago = today - timedelta(days=2)
        
        print(f"📅 Checking games from {two_days_ago} to {today}")
        
        # Fetch games from API
        games_response = bdl.nba.games.list(
            start_date=two_days_ago.strftime('%Y-%m-%d'),
            end_date=today.strftime('%Y-%m-%d'),
            per_page=100
        )
        
        # Step 2: Update games table with latest data
        games_to_update = []
        finished_game_ids = []
        
        for game in games_response.data:
            # Normalize status
            status = game.status if game.status else 'Scheduled'
            is_timestamp = 'T' in str(status)
            if is_timestamp:
                status = 'Scheduled'
            
            game_datetime = game.status if is_timestamp else game.date
            
            game_data = {
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
            }
            
            games_to_update.append(game_data)
            
            if status == 'Final':
                finished_game_ids.append(game.id)
        
        # Upsert games to Supabase
        if games_to_update:
            supabase.table('games').upsert(games_to_update).execute()
            print(f"✓ Updated {len(games_to_update)} games in database")
        
        print(f"✓ Found {len(finished_game_ids)} finished games")
        
        if not finished_game_ids:
            print("⚠️ No finished games to process")
            return
        
        # Step 3: Get all pending predictions for finished games
        predictions_response = supabase.table('predictions').select('*').in_(
            'game_id', finished_game_ids
        ).eq('status', 'pending').execute()
        
        pending_predictions = predictions_response.data
        print(f"📊 Found {len(pending_predictions)} pending predictions to settle")
        
        if not pending_predictions:
            print("⚠️ No pending predictions to process")
            return
        
        # Step 4: Process each prediction
        settled_count = 0
        points_awarded = 0
        points_deducted = 0
        
        for prediction in pending_predictions:
            # Get game data from database (already updated above)
            game_response = supabase.table('games').select('*').eq('id', prediction['game_id']).single().execute()
            game = game_response.data
            
            if not game or game['status'] != 'Final':
                continue
            
            # Determine the winner
            if game['home_team_score'] > game['visitor_team_score']:
                winner_id = game['home_team_id']
            else:
                winner_id = game['visitor_team_id']
            
            # Check if user's prediction was correct
            predicted_team_id = prediction['predicted_team_id']
            is_correct = predicted_team_id == winner_id
            
            # Calculate points change
            if is_correct:
                points_change = 2
                result = 'win'
                points_awarded += 2
            else:
                points_change = -1
                result = 'loss'
                points_deducted += 1
            
            user_id = prediction['user_id']
            
            # Step 5: Update user points
            user_response = supabase.table('users').select('spendable_points, all_time_points').eq('id', user_id).single().execute()
            current_spendable = user_response.data['spendable_points']
            current_all_time = user_response.data['all_time_points']
            
            new_spendable = max(0, current_spendable + points_change)
            new_all_time = current_all_time + points_change if is_correct else current_all_time
            
            supabase.table('users').update({
                'spendable_points': new_spendable,
                'all_time_points': new_all_time
            }).eq('id', user_id).execute()
            
            # Step 6: Mark prediction as settled
            supabase.table('predictions').update({
                'status': 'settled',
                'result': result
            }).eq('id', prediction['id']).execute()
            
            settled_count += 1
            
            # Log the result
            game_info = f"{game['visitor_team_abbreviation']} @ {game['home_team_abbreviation']}"
            print(f"  {'✓' if is_correct else '✗'} {game_info}: {result.upper()} ({points_change:+d} pts)")
        
        # Summary
        print(f"\n{'='*60}")
        print(f"✅ SUMMARY:")
        print(f"   Updated: {len(games_to_update)} games")
        print(f"   Settled: {settled_count} predictions")
        print(f"   Points awarded: +{points_awarded}")
        print(f"   Points deducted: -{points_deducted}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ ERROR in score updater: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("Running score updater manually...")
    update_scores()
