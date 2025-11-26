from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from routes.auth import auth_bp
from routes.games_supabase import games_bp  # Using Supabase version
from routes.predictions_supabase import predictions_bp  # Using Supabase version
from routes.results import results_bp
from routes.shop import shop_bp
from routes.profile import profile_bp
from routes.leaderboard import leaderboard_bp
from routes.chat import chat_bp
from apscheduler.schedulers.background import BackgroundScheduler
from cron.score_updater_supabase import update_scores  # Using Supabase version

load_dotenv()
app = Flask(__name__)

# CORS configuration for production and development
CORS(app, origins=[
    "http://localhost:5173",  # Local development
    "https://basketdubs.vercel.app",  # Production
    "https://*.vercel.app"  # Vercel preview deployments
])

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(games_bp, url_prefix='/api/games')
app.register_blueprint(predictions_bp, url_prefix='/api/predictions')
app.register_blueprint(results_bp, url_prefix='/api/results')
app.register_blueprint(shop_bp, url_prefix='/api/shop')
app.register_blueprint(profile_bp, url_prefix='/api/profile')
app.register_blueprint(leaderboard_bp, url_prefix='/api/leaderboard')
app.register_blueprint(chat_bp, url_prefix='/api/chat')

# Initialize the cron job scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(
    func=update_scores,
    trigger="interval",
    minutes=10,  # Run every 10 minutes
    id='score_updater',
    name='Update game scores and user points',
    replace_existing=True
)
scheduler.start()

print("✅ Cron job scheduler started - Score updater will run every 10 minutes")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Basketdubs API is running'}), 200

@app.route('/api/test-db', methods=['GET'])
def test_db():
    """Test database connection"""
    try:
        from supabase_client import get_supabase_client
        supabase = get_supabase_client()
        users = supabase.table('users').select('*').execute()
        return jsonify({'status': 'ok', 'users': users.data}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/cron/trigger', methods=['POST'])
def trigger_cron():
    """Manually trigger the score updater (for testing)"""
    try:
        update_scores()
        return jsonify({'status': 'ok', 'message': 'Score updater executed'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False, port=5000)
