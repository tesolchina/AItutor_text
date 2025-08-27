from flask import Flask, request, jsonify, send_from_directory, make_response
import requests
import os
import json
import datetime
import traceback

app = Flask(__name__)

# Get the directory of this script (app.py)
# This makes the paths work correctly on both Mac and Windows
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths to files (relative to app.py's directory)
API_KEY_FILE = os.path.join(SCRIPT_DIR, 'APIkey.txt')
SYSTEM_PROMPT_FILE = os.path.join(SCRIPT_DIR, 'systemPrompt.txt')

# Available models
AVAILABLE_MODELS = [
    {"id": "google/gemini-2.5-flash-lite", "name": "Gemini 2.5 Flash Lite (Fast)", "isDefault": True},
    {"id": "openai/gpt-3.5-turbo", "name": "GPT-3.5 Turbo (Fast)", "isDefault": False},
    {"id": "anthropic/claude-instant-1.2", "name": "Claude Instant (Fast)", "isDefault": False},
    {"id": "mistral/mistral-small", "name": "Mistral Small (Fast)", "isDefault": False},
    {"id": "meta/llama-3-8b-instruct", "name": "Llama 3 8B (Medium)", "isDefault": False},
    {"id": "xai/grok-3", "name": "Grok 3 (Slow)", "isDefault": False}
]

# Load API key and system prompt on startup
try:
    with open(API_KEY_FILE, 'r') as f:
        OPENROUTER_API_KEY = f.read().strip()
    
    with open(SYSTEM_PROMPT_FILE, 'r') as f:
        SYSTEM_PROMPT = f.read().strip()
    
    print("API key and system prompt loaded successfully.")
except FileNotFoundError as e:
    print(f"Error: {e}. Please ensure APIkey.txt and systemPrompt.txt are in the same folder as app.py.")
    exit(1)

# --- Static File Serving ---
# These routes are necessary for the modular structure to work.

# Serve the main index.html file
@app.route('/')
def index():
    return send_from_directory(SCRIPT_DIR, 'index.html')

# Serve JavaScript files from the 'js' folder
@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(SCRIPT_DIR, 'js'), filename)

# Serve CSS files from the 'css' folder
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(SCRIPT_DIR, 'css'), filename)


# --- API Endpoints ---

# Endpoint to get available models
@app.route('/models', methods=['GET'])
def get_models():
    return jsonify(AVAILABLE_MODELS)

# Endpoint to get current system prompt
@app.route('/system-prompt', methods=['GET'])
def get_system_prompt():
    return jsonify({"prompt": SYSTEM_PROMPT})

# Endpoint to update system prompt
@app.route('/system-prompt', methods=['POST'])
def update_system_prompt():
    global SYSTEM_PROMPT
    try:
        data = request.json
        new_prompt = data.get('prompt')
        
        if not new_prompt:
            return jsonify({'success': False, 'error': 'No prompt provided'}), 400
        
        SYSTEM_PROMPT = new_prompt
        with open(SYSTEM_PROMPT_FILE, 'w') as f:
            f.write(new_prompt)
        return jsonify({"success": True, "message": "System prompt updated successfully"})
    except Exception as e:
        print(f"Error saving prompt: {e}\n{traceback.format_exc()}")
        return jsonify({"success": False, "error": str(e)}), 500

# Endpoint to export chat as markdown
@app.route('/export', methods=['POST'])
def export_chat():
    try:
        data = request.json
        chat_history = data.get('history', [])
        
        if not chat_history:
            return jsonify({'success': False, 'error': 'No chat history provided'}), 400
        
        markdown = "# Audio Tutor Chat History\n\n"
        markdown += f"Exported on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        for entry in chat_history:
            speaker = entry.get('speaker', '')
            message = entry.get('message', '')
            duration = entry.get('duration', 0)
            word_count = entry.get('wordCount', 0)
            
            markdown += f"## {speaker}\n\n{message}\n\n*Duration: {duration}s | Words: {word_count}*\n\n---\n\n"
        
        response = make_response(markdown)
        response.headers["Content-Disposition"] = "attachment; filename=chat_history.md"
        response.headers["Content-Type"] = "text/markdown"
        return response
    except Exception as e:
        print(f"Error exporting chat: {e}\n{traceback.format_exc()}")
        return jsonify({"success": False, "error": str(e)}), 500

# Function to create payload based on model type
def create_payload(model, user_text, system_prompt, language=None):
    adjusted_prompt = system_prompt
    if language and language.startswith('zh'):
        adjusted_prompt += "\nIf the user speaks in Chinese, please respond in Chinese."
    
    # Standard format for most models
    return {
        "model": model,
        "messages": [
            {"role": "system", "content": adjusted_prompt},
            {"role": "user", "content": user_text}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }

# Endpoint for chat: Receive user input, call LLM, return response
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('user_input')
    selected_model = data.get('model', 'google/gemini-2.5-flash-lite')
    language = data.get('language', 'en-US')
    
    if not user_input:
        return jsonify({'error': 'No user input provided'}), 400
    
    print(f"Received input: '{user_input[:50]}...' | Model: {selected_model} | Language: {language}")
    
    try:
        api_url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Audio Tutor"
        }
        
        payload = create_payload(selected_model, user_input, SYSTEM_PROMPT, language)
        
        response = requests.post(url=api_url, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"Error from OpenRouter: {response.status_code} {response.text}")
            return jsonify({'error': f'API error ({response.status_code}): {response.text}'}), 500
        
        result = response.json()
        llm_response = result['choices'][0]['message']['content']
        
        print(f"LLM Response: '{llm_response[:50]}...'")
        return jsonify({'response': llm_response})
        
    except Exception as e:
        print(f"Unexpected error: {e}\n{traceback.format_exc()}")
        return jsonify({'error': f'Sorry, an unexpected error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)