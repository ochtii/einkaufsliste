from flask import Flask, request, jsonify
from flask_cors import CORS
from database import EasterEggDB
import os

app = Flask(__name__)
CORS(app)

# Initialize database
db = EasterEggDB()

def get_client_info():
    """Extract client information from request"""
    user_uuid = request.headers.get('X-User-UUID') or request.form.get('user_uuid') or request.json.get('user_uuid') if request.json else None
    user_name = request.headers.get('X-User-Name') or request.form.get('user_name') or request.json.get('user_name') if request.json else None
    user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    api_key = request.headers.get('X-API-Key') or request.form.get('api_key') or request.json.get('api_key') if request.json else None
    
    return user_uuid, user_name, user_ip, api_key

def require_auth(f):
    """Decorator to require API key authentication"""
    def decorated_function(*args, **kwargs):
        _, _, _, api_key = get_client_info()
        
        if not api_key:
            return jsonify({
                'success': False, 
                'message': 'API key required',
                'code': 'MISSING_API_KEY'
            }), 401
        
        if not db.validate_api_key(api_key):
            return jsonify({
                'success': False, 
                'message': 'Invalid API key',
                'code': 'INVALID_API_KEY'
            }), 403
        
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/egg/api/lol/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Easter Egg API',
        'version': '1.0.0'
    })

@app.route('/egg/api/lol/find/<egg_name>', methods=['POST'])
@require_auth
def find_easter_egg(egg_name):
    """Report an easter egg find"""
    user_uuid, user_name, user_ip, _ = get_client_info()
    
    if not user_uuid:
        return jsonify({
            'success': False,
            'message': 'User UUID required',
            'code': 'MISSING_USER_UUID'
        }), 400
    
    result = db.find_easter_egg(egg_name, user_uuid, user_name, user_ip)
    
    if result['success']:
        response_data = {
            'success': True,
            'message': 'Easter egg found!',
            'data': result
        }
        
        # Add celebration messages
        if result['is_first_find_ever']:
            response_data['celebration'] = {
                'type': 'FIRST_EVER',
                'title': '🎉 GLÜCKWUNSCH! 🎉',
                'message': 'Du hast dein erstes Easter Egg gefunden!',
                'effect': 'MEGA_FIREWORKS'
            }
        elif result['is_first_find_for_user']:
            response_data['celebration'] = {
                'type': 'NEW_DISCOVERY',
                'title': '⭐ Neues Easter Egg! ⭐',
                'message': get_funny_message(egg_name),
                'effect': 'CONFETTI'
            }
        else:
            response_data['celebration'] = {
                'type': 'ALREADY_FOUND',
                'title': '😊 Schon bekannt!',
                'message': 'Du hast dieses Easter Egg bereits gefunden!',
                'effect': 'SPARKLE'
            }
        
        return jsonify(response_data)
    else:
        return jsonify(result), 404

@app.route('/egg/api/lol/stats/<user_uuid>', methods=['GET'])
@require_auth
def get_user_stats(user_uuid):
    """Get user's easter egg statistics"""
    stats = db.get_user_stats(user_uuid)
    
    return jsonify({
        'success': True,
        'data': stats
    })

@app.route('/egg/api/lol/trigger/stars-and-sweets', methods=['POST'])
@require_auth
def trigger_stars_and_sweets():
    """Special endpoint for the stars and sweets easter egg"""
    user_uuid, user_name, user_ip, _ = get_client_info()
    
    if not user_uuid:
        return jsonify({
            'success': False,
            'message': 'User UUID required'
        }), 400
    
    # Check if triggered by correct combination
    data = request.json or {}
    icon = data.get('icon')
    category = data.get('category')
    
    if icon == '⭐' and category == '🍭 Süßwaren':
        result = db.find_easter_egg('stars_and_sweets', user_uuid, user_name, user_ip)
        
        if result['success'] and result['is_first_find_for_user']:
            return jsonify({
                'success': True,
                'message': 'Stars and sweets easter egg activated!',
                'data': result,
                'animation': {
                    'type': 'FALLING_STARS_SWEETS',
                    'duration': 5000,
                    'particles': ['⭐', '🍭', '✨', '🌟', '🍬', '🍫']
                }
            })
        else:
            return jsonify({
                'success': True,
                'message': 'Already found this easter egg',
                'data': result,
                'animation': {
                    'type': 'GENTLE_SPARKLE',
                    'duration': 2000,
                    'particles': ['✨', '⭐']
                }
            })
    else:
        return jsonify({
            'success': False,
            'message': 'Wrong combination for this easter egg'
        }), 400

def get_funny_message(egg_name):
    """Get a funny message for different easter eggs"""
    messages = {
        'stars_and_sweets': [
            'Süße Sterne regnen vom Himmel! 🌟🍭',
            'Du hast das süßeste Geheimnis entdeckt! ⭐🍬',
            'Sterne und Süßwaren - eine himmlische Kombination! ✨🍫',
            'Zucker-Sterne fallen für dich! 🌟🍭'
        ]
    }
    
    import random
    return random.choice(messages.get(egg_name, ['Tolles Easter Egg gefunden! 🎉']))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8888))
    app.run(host='0.0.0.0', port=port, debug=False)
