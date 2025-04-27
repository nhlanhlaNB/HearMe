from flask import Flask, request, jsonify, render_template
from translate import Translator
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate():
    app.logger.debug("Received translation request: %s", request.json)
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({"success": False, "error": "Invalid request"}), 400
        
    try:
        translator = Translator(from_lang=data.get('from', 'fr'), 
                             to_lang=data.get('to', 'en'))
        result = translator.translate(data['text'])
        app.logger.debug("Translation result: %s", result)
        return jsonify({"success": True, "translation": result})
    except Exception as e:
        app.logger.error("Translation error: %s", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')