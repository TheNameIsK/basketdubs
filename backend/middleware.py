"""
Authentication middleware for Flask routes
"""
from functools import wraps
from flask import request, jsonify
from supabase_client import get_supabase_client

def require_auth(f):
    """
    Decorator to protect routes that require authentication.
    Expects 'Authorization: Bearer <token>' header.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            supabase = get_supabase_client()
            # Verify the token with Supabase
            user = supabase.auth.get_user(token)
            
            if not user:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Attach user info to request for use in route
            request.user = user.user
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({'error': f'Authentication failed: {str(e)}'}), 401
    
    return decorated_function
