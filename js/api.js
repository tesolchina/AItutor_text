// API client for backend communication
const API = {
    // Get available models
    loadModels: async function() {
        try {
            const response = await fetch('/models');
            return await response.json();
        } catch (error) {
            console.error('Error loading models:', error);
            return [];
        }
    },
    
    // Get system prompt
    loadSystemPrompt: async function() {
        try {
            const response = await fetch('/system-prompt');
            const data = await response.json();
            return data.prompt;
        } catch (error) {
            console.error('Error loading system prompt:', error);
            return '';
        }
    },
    
    // Save system prompt
    saveSystemPrompt: async function(prompt) {
        try {
            const response = await fetch('/system-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            return await response.json();
        } catch (error) {
            console.error('Error saving system prompt:', error);
            throw error;
        }
    },
    
    // Get response from LLM
    getLLMResponse: async function(input, model, language) {
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_input: input,
                    model: model,
                    language: language
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server returned an error');
            }
            
            const data = await response.json();
            return data.response || data.error;
        } catch (error) {
            console.error('Error getting LLM response:', error);
            throw error;
        }
    },
    
    // Export chat history
    exportChat: async function(history) {
        try {
            const response = await fetch('/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: history })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server returned an error');
            }
            
            return await response.blob();
        } catch (error) {
            console.error('Error exporting chat:', error);
            throw error;
        }
    }
};