"""
Leaderboard routes for Basketdubs
Displays top users by all-time points
"""
from flask import Blueprint, request, jsonify
from middleware import require_auth
from supabase_client import get_supabase_client

leaderboard_bp = Blueprint('leaderboard', __name__)

@leaderboard_bp.route('', methods=['GET'])
@require_auth
def get_leaderboard():
    """
    Get top users by all_time_points
    Returns top 50 users with rank, username, and points
    Also includes current user's rank if not in top 50
    """
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        
        # Get top 50 users by all_time_points
        # Only include users with username set (exclude first-time users)
        top_users = supabase.table('users').select(
            'id, username, all_time_points, spendable_points'
        ).not_.is_('username', 'null').order(
            'all_time_points', desc=True
        ).limit(50).execute()
        
        # Add rank to each user
        leaderboard = []
        current_user_rank = None
        current_user_in_top = False
        
        for idx, user in enumerate(top_users.data):
            rank = idx + 1
            user_data = {
                'rank': rank,
                'user_id': user['id'],
                'username': user['username'],
                'all_time_points': user['all_time_points'],
                'spendable_points': user['spendable_points'],
                'is_current_user': user['id'] == user_id
            }
            leaderboard.append(user_data)
            
            if user['id'] == user_id:
                current_user_in_top = True
                current_user_rank = rank
        
        # If current user is not in top 50, get their rank
        current_user_data = None
        if not current_user_in_top:
            # Get current user's data
            user_data = supabase.table('users').select(
                'id, username, all_time_points, spendable_points'
            ).eq('id', user_id).single().execute()
            
            # Count how many users have more points
            users_above = supabase.table('users').select(
                'id', count='exact'
            ).not_.is_('username', 'null').gt(
                'all_time_points', user_data.data['all_time_points']
            ).execute()
            
            current_user_rank = users_above.count + 1
            current_user_data = {
                'rank': current_user_rank,
                'user_id': user_data.data['id'],
                'username': user_data.data['username'],
                'all_time_points': user_data.data['all_time_points'],
                'spendable_points': user_data.data['spendable_points'],
                'is_current_user': True
            }
        
        return jsonify({
            'leaderboard': leaderboard,
            'current_user_rank': current_user_rank,
            'current_user_data': current_user_data,
            'total_users': len(top_users.data)
        }), 200
        
    except Exception as e:
        print(f"ERROR fetching leaderboard: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch leaderboard: {str(e)}'}), 500

@leaderboard_bp.route('/stats', methods=['GET'])
@require_auth
def get_leaderboard_stats():
    """
    Get overall leaderboard statistics
    Total users, average points, etc.
    """
    try:
        supabase = get_supabase_client()
        
        # Get total users with username
        total_users = supabase.table('users').select(
            'id', count='exact'
        ).not_.is_('username', 'null').execute()
        
        # Get all users' points for statistics
        all_users = supabase.table('users').select(
            'all_time_points'
        ).not_.is_('username', 'null').execute()
        
        points_list = [user['all_time_points'] for user in all_users.data]
        
        stats = {
            'total_users': total_users.count,
            'average_points': sum(points_list) / len(points_list) if points_list else 0,
            'highest_points': max(points_list) if points_list else 0,
            'lowest_points': min(points_list) if points_list else 0
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        print(f"ERROR fetching leaderboard stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500
