"""
Game results routes for Basketdubs
Fetches game results from database (populated by cron job)
"""
from flask import Blueprint, jsonify, request
from middleware import require_auth
from supabase_client import get_supabase_client

results_bp = Blueprint('results', __name__)

@results_bp.route('', methods=['GET'])
@require_auth
def get_user_results():
    """
    Get user's prediction results and current points
    This data is updated by the cron job every 10 minutes
    """
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        
        # Get user's current points
        user_data = supabase.table('users').select('spendable_points, all_time_points').eq('id', user_id).single().execute()
        
        # Get settled predictions (results)
        settled_predictions = supabase.table('predictions').select('*').eq('user_id', user_id).eq('status', 'settled').order('created_at', desc=True).limit(20).execute()
        
        return jsonify({
            'points': {
                'spendable': user_data.data['spendable_points'],
                'all_time': user_data.data['all_time_points']
            },
            'recent_results': settled_predictions.data
        }), 200
        
    except Exception as e:
        print(f"ERROR fetching results: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch results: {str(e)}'}), 500
