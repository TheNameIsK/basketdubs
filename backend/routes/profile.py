"""
Profile routes for Basketdubs
Handles avatar configuration, user profile, and stats
"""
from flask import Blueprint, request, jsonify
from middleware import require_auth
from supabase_client import get_supabase_client

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/avatar', methods=['GET'])
@require_auth
def get_avatar():
    """Get user's avatar configuration"""
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        
        result = supabase.table('users').select('avatar_config, username').eq('id', user_id).single().execute()
        
        return jsonify({
            'avatar_config': result.data['avatar_config'] or {},
            'username': result.data['username']
        }), 200
        
    except Exception as e:
        print(f"ERROR fetching avatar: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch avatar: {str(e)}'}), 500

@profile_bp.route('/avatar', methods=['PUT'])
@require_auth
def update_avatar():
    """Update user's avatar configuration"""
    try:
        data = request.get_json()
        avatar_config = data.get('avatar_config')
        
        if avatar_config is None:
            return jsonify({'error': 'avatar_config is required'}), 400
        
        user_id = request.user.id
        supabase = get_supabase_client()
        
        # Update avatar config
        supabase.table('users').update({
            'avatar_config': avatar_config
        }).eq('id', user_id).execute()
        
        return jsonify({
            'message': 'Avatar updated successfully',
            'avatar_config': avatar_config
        }), 200
        
    except Exception as e:
        print(f"ERROR updating avatar: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to update avatar: {str(e)}'}), 500

@profile_bp.route('/username', methods=['PUT'])
@require_auth
def update_username():
    """Update user's username"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        
        if not username:
            return jsonify({'error': 'Username is required'}), 400
        
        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters'}), 400
        
        if len(username) > 20:
            return jsonify({'error': 'Username must be less than 20 characters'}), 400
        
        user_id = request.user.id
        supabase = get_supabase_client()
        
        # Check if username is already taken
        existing = supabase.table('users').select('id').eq('username', username).execute()
        if existing.data and existing.data[0]['id'] != user_id:
            return jsonify({'error': 'Username is already taken'}), 400
        
        # Update username
        supabase.table('users').update({
            'username': username
        }).eq('id', user_id).execute()
        
        return jsonify({
            'message': 'Username updated successfully',
            'username': username
        }), 200
        
    except Exception as e:
        print(f"ERROR updating username: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to update username: {str(e)}'}), 500

@profile_bp.route('/stats', methods=['GET'])
@require_auth
def get_stats():
    """Get user's prediction statistics"""
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        
        # Get all settled predictions
        predictions = supabase.table('predictions').select('result').eq(
            'user_id', user_id
        ).eq('status', 'settled').execute()
        
        total_predictions = len(predictions.data)
        wins = sum(1 for p in predictions.data if p['result'] == 'win')
        losses = total_predictions - wins
        win_rate = (wins / total_predictions * 100) if total_predictions > 0 else 0
        
        # Get current streak
        recent_predictions = supabase.table('predictions').select('result').eq(
            'user_id', user_id
        ).eq('status', 'settled').order('game_date', desc=True).limit(20).execute()
        
        current_streak = 0
        streak_type = None
        for pred in recent_predictions.data:
            if streak_type is None:
                streak_type = pred['result']
                current_streak = 1
            elif pred['result'] == streak_type:
                current_streak += 1
            else:
                break
        
        # Get user points
        user_data = supabase.table('users').select(
            'spendable_points, all_time_points'
        ).eq('id', user_id).single().execute()
        
        return jsonify({
            'total_predictions': total_predictions,
            'wins': wins,
            'losses': losses,
            'win_rate': round(win_rate, 1),
            'current_streak': current_streak,
            'streak_type': streak_type,
            'spendable_points': user_data.data['spendable_points'],
            'all_time_points': user_data.data['all_time_points']
        }), 200
        
    except Exception as e:
        print(f"ERROR fetching stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500

@profile_bp.route('/clear-username', methods=['POST'])
@require_auth
def clear_username():
    """Clear username (for testing first-login flow)"""
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        
        supabase.table('users').update({
            'username': None
        }).eq('id', user_id).execute()
        
        print(f"✅ Cleared username for user {user_id}")
        
        return jsonify({
            'message': 'Username cleared successfully'
        }), 200
        
    except Exception as e:
        print(f"ERROR clearing username: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to clear username: {str(e)}'}), 500

@profile_bp.route('/check-first-login', methods=['GET'])
@require_auth
def check_first_login():
    """Check if user needs to set username (first login)"""
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        
        result = supabase.table('users').select('username').eq('id', user_id).single().execute()
        
        # If username is null or empty, it's first login
        username = result.data.get('username')
        needs_username = not username or username.strip() == ''
        
        print(f"🔍 First login check for user {user_id}: username='{username}', needs_username={needs_username}")
        
        return jsonify({
            'is_first_login': needs_username,
            'username': username
        }), 200
        
    except Exception as e:
        print(f"ERROR checking first login: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to check first login: {str(e)}'}), 500
