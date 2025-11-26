"""
Predictions routes for Basketdubs - SUPABASE VERSION
Uses JOINs with games table instead of API calls for history
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from middleware import require_auth
from supabase_client import get_supabase_client

predictions_bp = Blueprint('predictions', __name__)

@predictions_bp.route('/<int:game_id>', methods=['DELETE'])
@require_auth
def delete_prediction(game_id):
    """Cancel/delete a prediction for a game"""
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        
        result = supabase.table('predictions').delete().eq('user_id', user_id).eq('game_id', game_id).execute()
        
        if result.data:
            return jsonify({'message': 'Prediction cancelled'}), 200
        else:
            return jsonify({'error': 'No prediction found'}), 404
            
    except Exception as e:
        print(f"ERROR deleting prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to delete prediction: {str(e)}'}), 500

@predictions_bp.route('', methods=['POST'])
@require_auth
def create_prediction():
    """Submit a prediction for a game"""
    try:
        data = request.get_json()
        game_id = data.get('game_id')
        team_id = data.get('team_id')
        game_date = data.get('game_date')
        game_status = data.get('game_status', 'Scheduled')
        
        if not game_id or not team_id or not game_date:
            return jsonify({'error': 'game_id, team_id, and game_date are required'}), 400
        
        # Check if game is still scheduled
        if game_status:
            is_scheduled = (
                'T' in str(game_status) or 
                game_status == 'Scheduled' or 
                game_status == '' or
                game_status is None
            )
            
            if not is_scheduled:
                return jsonify({'error': 'Game has already started. Predictions are locked.'}), 400
        
        user_id = request.user.id
        supabase = get_supabase_client()
        
        # Check if user already has a prediction
        existing = supabase.table('predictions').select('*').eq('user_id', user_id).eq('game_id', game_id).execute()
        
        if existing.data:
            # Update existing prediction
            if existing.data[0]['status'] == 'settled':
                return jsonify({'error': 'Cannot change prediction for a finished game'}), 400
                
            result = supabase.table('predictions').update({
                'predicted_team_id': team_id
            }).eq('user_id', user_id).eq('game_id', game_id).execute()
            
            return jsonify({
                'message': 'Prediction updated',
                'prediction': result.data[0]
            }), 200
        else:
            # Create new prediction
            result = supabase.table('predictions').insert({
                'user_id': user_id,
                'game_id': game_id,
                'predicted_team_id': team_id,
                'game_date': game_date,
                'status': 'pending',
                'result': None
            }).execute()
            
            return jsonify({
                'message': 'Prediction created',
                'prediction': result.data[0]
            }), 201
            
    except Exception as e:
        print(f"ERROR creating prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to create prediction: {str(e)}'}), 500

@predictions_bp.route('', methods=['GET'])
@require_auth
def get_user_predictions():
    """Get all predictions for the current user"""
    try:
        user_id = request.user.id
        game_ids = request.args.get('game_ids')
        
        supabase = get_supabase_client()
        query = supabase.table('predictions').select('*').eq('user_id', user_id)
        
        if game_ids:
            game_id_list = [int(gid) for gid in game_ids.split(',')]
            query = query.in_('game_id', game_id_list)
        
        result = query.execute()
        
        # Convert to dict keyed by game_id
        predictions_dict = {pred['game_id']: pred for pred in result.data}
        
        return jsonify(predictions_dict), 200
        
    except Exception as e:
        print(f"ERROR fetching predictions: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch predictions: {str(e)}'}), 500

@predictions_bp.route('/history', methods=['GET'])
@require_auth
def get_prediction_history():
    """
    Get prediction history with game details
    NO API CALLS - Uses JOIN with games table!
    """
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        
        print(f"Fetching prediction history for user: {user_id}")
        
        # Use Supabase's foreign table join syntax
        # This is MUCH faster than calling the API!
        result = supabase.table('predictions').select(
            '''
            *,
            games (
                id,
                home_team_id,
                home_team_name,
                home_team_abbreviation,
                home_team_city,
                home_team_score,
                visitor_team_id,
                visitor_team_name,
                visitor_team_abbreviation,
                visitor_team_city,
                visitor_team_score
            )
            '''
        ).eq('user_id', user_id).eq('status', 'settled').order('game_date', desc=True).limit(10).execute()
        
        print(f"Found {len(result.data)} settled predictions")
        
        if not result.data:
            return jsonify([]), 200
        
        # Format the response
        history = []
        for pred in result.data:
            game = pred.get('games')
            
            if not game:
                print(f"Warning: No game data for prediction {pred['id']}")
                continue
            
            # Determine winner
            if game['home_team_score'] > game['visitor_team_score']:
                winner_name = f"{game['home_team_city']} {game['home_team_name']}"
            else:
                winner_name = f"{game['visitor_team_city']} {game['visitor_team_name']}"
            
            # Get predicted team name and abbreviation
            if pred['predicted_team_id'] == game['home_team_id']:
                predicted_team_name = f"{game['home_team_city']} {game['home_team_name']}"
                predicted_team_abbr = game['home_team_abbreviation']
                winner_abbr = game['home_team_abbreviation'] if game['home_team_score'] > game['visitor_team_score'] else game['visitor_team_abbreviation']
            else:
                predicted_team_name = f"{game['visitor_team_city']} {game['visitor_team_name']}"
                predicted_team_abbr = game['visitor_team_abbreviation']
                winner_abbr = game['home_team_abbreviation'] if game['home_team_score'] > game['visitor_team_score'] else game['visitor_team_abbreviation']
            
            history.append({
                'game_id': pred['game_id'],
                'game_date': pred['game_date'],
                'predicted_team_name': predicted_team_name,
                'predicted_team_abbr': predicted_team_abbr,
                'winner_name': winner_name,
                'winner_abbr': winner_abbr,
                'visitor_abbr': game['visitor_team_abbreviation'],
                'home_abbr': game['home_team_abbreviation'],
                'result': pred['result'],
                'matchup': f"{game['visitor_team_abbreviation']} @ {game['home_team_abbreviation']}",
                'score': f"{game['visitor_team_score']} - {game['home_team_score']}"
            })
        
        print(f"Returning {len(history)} history items")
        return jsonify(history), 200
        
    except Exception as e:
        print(f"ERROR fetching prediction history: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch prediction history: {str(e)}'}), 500
