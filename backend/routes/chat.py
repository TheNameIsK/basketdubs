"""
Chat routes for LeBot - NBA AI Assistant
Uses Google Gemini API with rate limiting
"""
from flask import Blueprint, request, jsonify
from middleware import require_auth
from supabase_client import get_supabase_client
from config import GEMINI_API_KEY
import google.generativeai as genai
from datetime import date

chat_bp = Blueprint('chat', __name__)

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# System prompt with guardrails
SYSTEM_PROMPT = """You are LeBot, the official AI assistant for Basketdubs - an NBA prediction game.

PERSONALITY:
- You're enthusiastic about basketball and the NBA
- You use basketball slang and emojis occasionally (🏀, 🔥, 💯)
- You're helpful, friendly, and encouraging
- You keep responses concise (2-3 sentences max unless asked for details)

STRICT RULES - YOU MUST FOLLOW THESE:
1. ONLY answer questions about basketball, NBA, players, teams, games, stats, and predictions
2. If asked about anything else (politics, other sports, personal advice, etc.), politely redirect to basketball topics
3. DO NOT provide gambling advice or odds
4. DO NOT make definitive predictions - always frame as "could" or "might"
5. DO NOT discuss controversial topics outside of basketball
6. If you don't know something about basketball, admit it honestly

TOPICS YOU CAN DISCUSS:
✅ NBA teams, players, history, stats
✅ Game analysis and player performance
✅ Basketball rules and strategies
✅ NBA news and updates
✅ Helping users make predictions
✅ Basketball trivia and fun facts

TOPICS YOU MUST REFUSE:
❌ Politics, religion, controversial social issues
❌ Other sports (football, soccer, etc.)
❌ Personal advice (relationships, health, finance)
❌ Gambling odds or betting advice
❌ Anything not related to basketball/NBA

RESPONSE FORMAT:
- Keep it short and engaging
- Use basketball terminology
- Add relevant emojis sparingly
- If redirecting, suggest a basketball topic instead

Remember: You're here to make basketball predictions more fun and informed!"""

@chat_bp.route('/message', methods=['POST'])
@require_auth
def send_message():
    """
    Send a message to LeBot and get a response
    Rate limited to 10 messages per day per user
    """
    try:
        user_id = request.user.id
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        if len(user_message) > 500:
            return jsonify({'error': 'Message too long (max 500 characters)'}), 400
        
        supabase = get_supabase_client()
        today = date.today()
        
        # Check current usage for today by counting actual messages
        # This ensures consistency between bot_usage and chat_history
        message_count = supabase.table('chat_history').select(
            'id', count='exact'
        ).eq('user_id', user_id).eq(
            'message_date', str(today)
        ).eq('role', 'user').execute()  # Only count user messages
        
        current_count = message_count.count or 0
        
        # Check if user has exceeded daily limit
        if current_count >= 10:
            return jsonify({
                'error': 'Daily limit reached',
                'message': 'You\'ve used all 10 daily messages. Come back tomorrow! 🏀',
                'remaining': 0
            }), 429
        
        # Get chat history for today (last 10 messages for context)
        history = supabase.table('chat_history').select('role, content').eq(
            'user_id', user_id
        ).eq('message_date', str(today)).order(
            'created_at', desc=False
        ).limit(20).execute()  # Get last 20 (10 pairs of user+bot)
        
        # Generate response using Gemini with context
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Build conversation history for context
            conversation = f"{SYSTEM_PROMPT}\n\n"
            
            # Add previous messages for context
            if history.data:
                conversation += "Previous conversation today:\n"
                for msg in history.data:
                    role_label = "User" if msg['role'] == 'user' else "LeBot"
                    conversation += f"{role_label}: {msg['content']}\n"
                conversation += "\n"
            
            # Add current user message
            conversation += f"User: {user_message}\n\nLeBot:"
            
            response = model.generate_content(conversation)
            bot_response = response.text
            
        except Exception as e:
            print(f"ERROR generating AI response: {str(e)}")
            return jsonify({
                'error': 'AI service unavailable',
                'message': 'Sorry, I\'m having trouble right now. Try again in a moment! 🏀'
            }), 503
        
        # Store user message in chat history
        supabase.table('chat_history').insert({
            'user_id': user_id,
            'message_date': str(today),
            'role': 'user',
            'content': user_message
        }).execute()
        
        # Store bot response in chat history
        supabase.table('chat_history').insert({
            'user_id': user_id,
            'message_date': str(today),
            'role': 'bot',
            'content': bot_response
        }).execute()
        
        # Update usage count in bot_usage table (for quick reference)
        # Note: This is now derived from chat_history count, not incremented
        new_count = current_count + 1
        
        # Upsert usage record (update if exists, insert if not)
        usage_check = supabase.table('bot_usage').select('*').eq(
            'user_id', user_id
        ).eq('usage_date', str(today)).execute()
        
        if usage_check.data:
            # Update existing record
            supabase.table('bot_usage').update({
                'query_count': new_count
            }).eq('user_id', user_id).eq('usage_date', str(today)).execute()
        else:
            # Create new record
            supabase.table('bot_usage').insert({
                'user_id': user_id,
                'usage_date': str(today),
                'query_count': new_count
            }).execute()
        
        return jsonify({
            'message': bot_response,
            'remaining': 10 - new_count,
            'used': new_count
        }), 200
        
    except Exception as e:
        print(f"ERROR in chat endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to process message: {str(e)}'}), 500

@chat_bp.route('/usage', methods=['GET'])
@require_auth
def get_usage():
    """
    Get user's current daily usage
    Counts actual messages from chat_history for accuracy
    """
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        today = date.today()
        
        # Count actual user messages from chat_history (source of truth)
        message_count = supabase.table('chat_history').select(
            'id', count='exact'
        ).eq('user_id', user_id).eq(
            'message_date', str(today)
        ).eq('role', 'user').execute()
        
        current_count = message_count.count or 0
        
        return jsonify({
            'used': current_count,
            'remaining': 10 - current_count,
            'limit': 10,
            'date': str(today)
        }), 200
        
    except Exception as e:
        print(f"ERROR fetching usage: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch usage: {str(e)}'}), 500

@chat_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    """
    Get user's chat history for today
    Returns last 20 messages (10 pairs of user+bot)
    """
    try:
        user_id = request.user.id
        supabase = get_supabase_client()
        today = date.today()
        
        history = supabase.table('chat_history').select('role, content, created_at').eq(
            'user_id', user_id
        ).eq('message_date', str(today)).order(
            'created_at', desc=False
        ).limit(20).execute()
        
        messages = []
        for msg in history.data:
            messages.append({
                'role': msg['role'],
                'content': msg['content'],
                'timestamp': msg['created_at']
            })
        
        return jsonify({
            'messages': messages,
            'count': len(messages)
        }), 200
        
    except Exception as e:
        print(f"ERROR fetching history: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch history: {str(e)}'}), 500
