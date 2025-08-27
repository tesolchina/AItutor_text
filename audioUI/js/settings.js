// Settings management module
const Settings = {
    elements: {
        settingsToggle: document.getElementById('settings-toggle'),
        settingsPanel: document.getElementById('settings-panel'),
        settingsClose: document.getElementById('settings-close'),
        systemPromptInput: document.getElementById('system-prompt'),
        savePromptBtn: document.getElementById('save-prompt'),
        exportChatBtn: document.getElementById('export-chat'),
        copyChatBtn: document.getElementById('copy-chat'),
        clipboardModal: document.getElementById('clipboard-modal'),
        chatText: document.getElementById('chat-text'),
        copyBtn: document.getElementById('copy-to-clipboard'),
        closeModalBtn: document.getElementById('close-modal'),
        modelSelector: document.getElementById('model-selector'),
        languageSelector: document.getElementById('language-selector')
    },
    
    init: function() {
        // Settings panel toggle
        this.elements.settingsToggle.addEventListener('click', () => {
            this.elements.settingsPanel.classList.add('open');
        });
        
        this.elements.settingsClose.addEventListener('click', () => {
            this.elements.settingsPanel.classList.remove('open');
        });
        
        // Language selection change
        this.elements.languageSelector.addEventListener('change', () => {
            const selectedLanguage = this.elements.languageSelector.value;
            console.log('Selected language:', selectedLanguage);
            
            // Update UI language indicator
            const langCode = selectedLanguage.split('-')[0].toUpperCase();
            UI.updateStatus(`Idle (${langCode})`);
        });
        
        // Model selection change
        this.elements.modelSelector.addEventListener('change', () => {
            console.log('Selected model:', this.elements.modelSelector.value);
        });
        
        // Save system prompt
        this.elements.savePromptBtn.addEventListener('click', this.saveSystemPrompt.bind(this));
        
        // Export and copy chat
        this.elements.exportChatBtn.addEventListener('click', this.exportChat.bind(this));
        this.elements.copyChatBtn.addEventListener('click', this.copyChat.bind(this));
        
        // Copy to clipboard
        this.elements.copyBtn.addEventListener('click', this.copyToClipboard.bind(this));
        
        // Close modal
        this.elements.closeModalBtn.addEventListener('click', () => {
            this.elements.clipboardModal.style.display = 'none';
        });
        
        // Also close modal if clicking outside
        this.elements.clipboardModal.addEventListener('click', (e) => {
            if (e.target === this.elements.clipboardModal) {
                this.elements.clipboardModal.style.display = 'none';
            }
        });
    },
    
    async saveSystemPrompt() {
        try {
            // Show status in button
            this.elements.savePromptBtn.textContent = 'Saving...';
            this.elements.savePromptBtn.disabled = true;
            
            const result = await API.saveSystemPrompt(this.elements.systemPromptInput.value);
            
            if (result.success) {
                this.elements.savePromptBtn.textContent = 'Saved!';
                setTimeout(() => {
                    this.elements.savePromptBtn.textContent = 'Save Prompt';
                    this.elements.savePromptBtn.disabled = false;
                }, 2000);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error saving system prompt:', error);
            alert(`Error saving prompt: ${error.message}`);
            this.elements.savePromptBtn.textContent = 'Save Prompt';
            this.elements.savePromptBtn.disabled = false;
        }
    },
    
    async exportChat() {
        if (UI.chatHistory.length === 0) {
            alert('No chat history to export.');
            return;
        }
        
        try {
            // Show status in button
            this.elements.exportChatBtn.textContent = 'Exporting...';
            this.elements.exportChatBtn.disabled = true;
            
            // Get blob from API
            const blob = await API.exportChat(UI.chatHistory);
            
            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'chat_history.md';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting chat:', error);
            alert(`Error exporting chat: ${error.message}`);
        } finally {
            this.elements.exportChatBtn.textContent = 'Export as Markdown';
            this.elements.exportChatBtn.disabled = false;
        }
    },
    
    copyChat() {
        if (UI.chatHistory.length === 0) {
            alert('No chat history to copy.');
            return;
        }
        
        // Generate formatted text
        let formattedText = "# Audio Tutor Chat History\n\n";
        formattedText += `Exported on: ${new Date().toLocaleString()}\n\n`;
        
        UI.chatHistory.forEach(entry => {
            formattedText += `## ${entry.speaker}\n\n`;
            formattedText += `${entry.message}\n\n`;
            formattedText += `Duration: ${entry.duration}s | Words: ${entry.wordCount}\n\n`;
            formattedText += "---\n\n";
        });
        
        this.elements.chatText.value = formattedText;
        this.elements.clipboardModal.style.display = 'flex';
    },
    
    copyToClipboard() {
        this.elements.chatText.select();
        navigator.clipboard.writeText(this.elements.chatText.value)
            .then(() => {
                this.elements.copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    this.elements.copyBtn.textContent = 'Copy to Clipboard';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy to clipboard. See console for details.');
            });
    },
    
    async loadModels() {
        try {
            const models = await API.loadModels();
            
            // Clear existing options
            this.elements.modelSelector.innerHTML = '';
            
            // Add models to selector
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                option.selected = model.isDefault;
                this.elements.modelSelector.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading models:', error);
            alert('Failed to load available models. Using default model instead.');
        }
    },
    
    async loadSystemPrompt() {
        try {
            const prompt = await API.loadSystemPrompt();
            this.elements.systemPromptInput.value = prompt;
        } catch (error) {
            console.error('Error loading system prompt:', error);
            alert('Failed to load system prompt. Please check console for details.');
        }
    }
};