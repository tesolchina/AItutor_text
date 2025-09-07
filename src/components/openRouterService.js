/**
 * OpenRouter API Service
 * Handles API calls to OpenRouter for the secret HKBU feature
 */

class OpenRouterService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    this.baseUrl = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.isEnabled = Boolean(this.apiKey && this.apiKey !== 'your_openrouter_api_key_here');
    
    if (!this.isEnabled) {
      console.warn('🔑 Alternative API key not configured - enhanced features disabled');
    } else {
      console.log('🔑 Enhanced service initialized successfully');
    }
  }

  /**
   * Send a chat completion request to OpenRouter
   * @param {Array} messages - Array of message objects {role: 'user'|'assistant', content: string}
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async sendChatCompletion(messages, options = {}) {
    if (!this.isEnabled) {
      throw new Error('OpenRouter API key not configured');
    }

    const defaultOptions = {
      model: 'openai/gpt-4o-mini', // Default model
      temperature: 0.7,
      max_tokens: 2000,
      stream: false,
      ...options
    };

    try {
      console.log('🚀 Sending enhanced API request:', {
        model: defaultOptions.model,
        messagesCount: messages.length
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'HKBU AI Tutor'
        },
        body: JSON.stringify({
          model: defaultOptions.model,
          messages: messages,
          temperature: defaultOptions.temperature,
          max_tokens: defaultOptions.max_tokens,
          stream: defaultOptions.stream
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Enhanced API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Enhanced API response received successfully');
      
      return {
        success: true,
        message: data.choices[0]?.message?.content || 'No response generated',
        usage: data.usage,
        model: data.model,
        raw: data
      };
    } catch (error) {
      console.error('❌ Enhanced API error:', error);
      throw error;
    }
  }

  /**
   * Get available models from OpenRouter
   * @returns {Promise<Array>} Array of available models
   */
  async getAvailableModels() {
    if (!this.isEnabled) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return [];
    }
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean} True if API key is configured
   */
  isConfigured() {
    return this.isEnabled;
  }
}

// Create singleton instance
const openRouterService = new OpenRouterService();

export default openRouterService;
