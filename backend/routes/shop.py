"""
Shop routes for Basketdubs
Handles item browsing and purchases
"""
from flask import Blueprint, request, jsonify
from middleware import require_auth
from supabase_client import get_supabase_client

shop_bp = Blueprint('shop', __name__)

@shop_bp.route('/items', methods=['GET'])
def get_shop_items():
    """
    Get all available shop items
    Public endpoint - no auth required
    """
    try:
        supabase = get_supabase_client()
        
        # Get all active items
        result = supabase.table('shop_items').select('*').eq('is_active', True).order('cost').execute()
        
        # Group by category
        items_by_category = {}
        for item in result.data:
            category = item['category']
            if category not in items_by_category:
                items_by_category[category] = []
            items_by_category[category].append(item)
        
        return jsonify(items_by_category), 200
        
    except Exception as e:
        print(f"ERROR fetching shop items: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch shop items: {str(e)}'}), 500

@shop_bp.route('/purchase', methods=['POST'])
@require_auth
def purchase_item():
    """
    Purchase an item from the shop
    Body: { item_id: int }
    """
    try:
        data = request.get_json()
        item_id = data.get('item_id')
        
        if not item_id:
            return jsonify({'error': 'item_id is required'}), 400
        
        user_id = request.user.id
        supabase = get_supabase_client()
        
        # Get the item details
        item = supabase.table('shop_items').select('*').eq('id', item_id).single().execute()
        
        if not item.data:
            return jsonify({'error': 'Item not found'}), 404
        
        if not item.data['is_active']:
            return jsonify({'error': 'Item is not available'}), 400
        
        item_cost = item.data['cost']
        
        # Get user's current points
        user = supabase.table('users').select('spendable_points').eq('id', user_id).single().execute()
        current_points = user.data['spendable_points']
        
        # Check if user has enough points
        if current_points < item_cost:
            return jsonify({
                'error': f'Not enough points. You have {current_points}, need {item_cost}'
            }), 400
        
        # Check if user already owns this item
        existing = supabase.table('inventory').select('*').eq('user_id', user_id).eq('item_id', item_id).execute()
        
        if existing.data:
            return jsonify({'error': 'You already own this item'}), 400
        
        # Deduct points
        new_points = current_points - item_cost
        supabase.table('users').update({
            'spendable_points': new_points
        }).eq('id', user_id).execute()
        
        # Add to inventory
        supabase.table('inventory').insert({
            'user_id': user_id,
            'item_id': item_id
        }).execute()
        
        return jsonify({
            'message': 'Purchase successful',
            'item': item.data,
            'new_balance': new_points
        }), 200
        
    except Exception as e:
        print(f"ERROR purchasing item: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to purchase item: {str(e)}'}), 500

@shop_bp.route('/inventory', methods=['GET'])
@require_auth
def get_user_inventory():
    """
    Get user's owned items
    """
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        
        # Get inventory with item details
        result = supabase.table('inventory').select('*, shop_items(*)').eq('user_id', user_id).execute()
        
        # Extract just the item data
        owned_items = [inv['shop_items'] for inv in result.data]
        
        return jsonify(owned_items), 200
        
    except Exception as e:
        print(f"ERROR fetching inventory: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch inventory: {str(e)}'}), 500
