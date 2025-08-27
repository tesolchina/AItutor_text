from flask import Flask, request, jsonify, send_from_directory
import requests
import os
import json

app = Flask(__name__)

# Get the directory of this script (app.py)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths to files (relative to app.py's directory)
API_KEY_FILE = os.path.join(SCRIPT_DIR, 'APIkey.txt')
SYSTEM_PROMPT_FILE = os.path.join(SCRIPT_DIR, 'systemPrompt.txt')

# Load API key and system prompt on startup
try:
    with open(API_KEY_FILE, 'r') as f:
        OPENROUTER_API_KEY = f.read().strip()
        print(f"API key loaded: {OPENROUTER_API_KEY[:5]}...{OPENROUTER_API_KEY[-5:]} (length: {len(OPENROUTER_API_KEY)})")
    
    with open(SYSTEM_PROMPT_FILE, 'r') as f:
        SYSTEM_PROMPT = f.read().strip()
        print(f"System prompt loaded (length: {len(SYSTEM_PROMPT)})")
    
    print("API key and system prompt loaded successfully.")
except FileNotFoundError as e:
    print(f"Error: {e}. Please ensure APIkey.txt and systemPrompt.txt are in the same folder as app.py.")
    exit(1)

# Serve the HTML file (assumes index.html is in the same folder as app.py)
@app.route('/')
def index():
    return send_from_directory(SCRIPT_DIR, 'index.html')

# Endpoint for chat: Receive user input, call Grok, return response
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('user_input')
    if not user_input:
        return jsonify({'error': 'No user input provided'}), 400
    
    print(f"Received user input: '{user_input}'")
    
    try:
        # OpenRouter API endpoint
        api_url = "https://openrouter.ai/api/v1/chat/completions"
        
        # Headers for the API request
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Audio Tutor"
        }
        
        # Payload for the API request - using multiple possible model names
        model_options = ["xai/grok-3", "grok-3", "x-ai/grok-3", "anthropic/claude-3-opus:beta"]
        
        # Start with the first model option
        current_model = model_options[0]
        
        # Prepare the request payload
        payload = {
            "model": current_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_input}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        print(f"Sending request to OpenRouter with model: {current_model}")
        
        # Make the API call
        response = requests.post(
            url=api_url,
            headers=headers,
            json=payload  # Using json parameter for proper serialization
        )
        
        # Check if the request was successful
        if response.status_code != 200:
            print(f"Error response from OpenRouter: {response.status_code} {response.text}")
            
            # If it's a model-related error, try alternative models
            if response.status_code == 400 and "model" in response.text.lower():
                for backup_model in model_options[1:]:
                    print(f"Trying alternative model: {backup_model}")
                    payload["model"] = backup_model
                    
                    response = requests.post(
                        url=api_url,
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        print(f"Success with model: {backup_model}")
                        break
                    else:
                        print(f"Failed with model: {backup_model} - {response.status_code} {response.text}")
            
            # If still not successful, return error
            if response.status_code != 200:
                return jsonify({'error': f'API error ({response.status_code}): {response.text}'}), 500
        
        # Parse the response
        result = response.json()
        
        # Extract the model's reply
        try:
            llm_response = result['choices'][0]['message']['content']
            print(f"Received response from LLM: '{llm_response[:50]}...'")
            return jsonify({'response': llm_response})
        except (KeyError, IndexError) as e:
            print(f"Error parsing response: {e}. Response data: {result}")
            return jsonify({'error': 'Error parsing model response'}), 500
        
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return jsonify({'error': f'Network error: {str(e)}'}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({'error': f'Sorry, an unexpected error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)