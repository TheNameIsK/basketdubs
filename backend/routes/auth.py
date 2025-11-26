"""
Authentication routes for Basketdubs
"""
from flask import Blueprint, request, jsonify
from supabase_client import get_supabase_client

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/verify', methods=['POST'])
def verify_token():
    """
    Verify a Google OAuth token and return user data.
    Frontend sends the token from Google OAuth, we verify with Supabase.
    """
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Token is required'}), 400
    
    try:
        supabase = get_supabase_client()
        # Get user from token
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            return jsonify({'error': 'Invalid token'}), 401
        
        user = user_response.user
        
        # Fetch user profile from public.users table
        profile = supabase.table('users').select('*').eq('id', user.id).single().execute()
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'username': profile.data.get('username'),
                'spendable_points': profile.data.get('spendable_points', 0),
                'all_time_points': profile.data.get('all_time_points', 0),
                'avatar_config': profile.data.get('avatar_config', {})
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Verification failed: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout endpoint (client-side will clear token)
    """
    return jsonify({'message': 'Logged out successfully'}), 200
