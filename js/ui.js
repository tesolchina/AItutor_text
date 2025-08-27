// UI management module
const UI = {
    startTime: 0,
    isProcessing: false,
    chatHistory: [],
    
    // DOM elements
    elements: {
        startBtn: document.getElementById('startBtn'),
        stopTalkingBtn: document.getElementById('stopTalkingBtn'),
        stopSpeakingBtn: document.getElementById('stopSpeakingBtn'),
        transcriptArea: document.getElementById('transcript'),
        owlIcon: document.getElementById('owl-icon'),
        statusIndicator: document.getElementById('status-indicator'),
        soundWaves: document.querySelector('.sound-waves'),
        thinkingDots: document.querySelector('.thinking-dots'),
        interimResults: document.getElementById('interim-results'),
        modelSelector: document.getElementById('model-selector'),
        languageSelector: document.getElementById('language-selector')
    },
    
    init: function() {
        // Initialize button listeners
        this.elements.startBtn.addEventListener('click', () => {
            SpeechRecognition.startListening();
        });
        
        this.elements.stopTalkingBtn.addEventListener('click', () => {
            SpeechRecognition.stopListening();
            this.processUserInput();
        });
        
        this.elements.stopSpeakingBtn.addEventListener('click', () => {
            TTS.stop();
        });
        
        // Set initial state
        this.setIdleState();
    },
    
    startListeningUI: function() {
        this.elements.startBtn.style.display = 'none';
        this.elements.stopTalkingBtn.style.display = 'inline-block';
        this.elements.interimResults.style.display = 'block';
        this.setListeningState();
        
        // Start timer
        this.startTime = Date.now();
    },
    
    stopListeningUI: function() {
        this.elements.stopTalkingBtn.style.display = 'none';
        this.elements.startBtn.style.display = 'inline-block';
        this.elements.interimResults.style.display = 'none';
    },
    
    setIdleState: function() {
        // Remove all state classes
        this.elements.owlIcon.classList.remove('owl-idle', 'owl-listening', 'owl-thinking', 'owl-speaking');
        
        // Hide all state indicators
        this.elements.soundWaves.style.display = 'none';
        this.elements.thinkingDots.style.display = 'none';
        
        // Set idle state
        this.elements.owlIcon.classList.add('owl-idle');
        const langCode = this.getSelectedLanguage().split('-')[0].toUpperCase();
        this.elements.statusIndicator.textContent = `Idle (${langCode})`;
    },
    
    setListeningState: function() {
        // Remove all state classes
        this.elements.owlIcon.classList.remove('owl-idle', 'owl-listening', 'owl-thinking', 'owl-speaking');
        
        // Hide all state indicators
        this.elements.soundWaves.style.display = 'none';
        this.elements.thinkingDots.style.display = 'none';
        
        // Set listening state
        this.elements.owlIcon.classList.add('owl-listening');
        this.elements.soundWaves.style.display = 'block';
        this.elements.statusIndicator.textContent = 'Listening...';
    },
    
    setThinkingState: function() {
        // Remove all state classes
        this.elements.owlIcon.classList.remove('owl-idle', 'owl-listening', 'owl-thinking', 'owl-speaking');
        
        // Hide all state indicators
        this.elements.soundWaves.style.display = 'none';
        this.elements.thinkingDots.style.display = 'none';
        
        // Set thinking state
        this.isProcessing = true;
        this.elements.owlIcon.classList.add('owl-thinking');
        this.elements.thinkingDots.style.display = 'block';
        this.elements.statusIndicator.textContent = 'Thinking...';
    },
    
    setSpeakingState: function() {
        // Remove all state classes
        this.elements.owlIcon.classList.remove('owl-idle', 'owl-listening', 'owl-thinking', 'owl-speaking');
        
        // Hide all state indicators
        this.elements.soundWaves.style.display = 'none';
        this.elements.thinkingDots.style.display = 'none';
        
        // Set speaking state
        this.elements.owlIcon.classList.add('owl-speaking');
        this.elements.statusIndicator.textContent = 'Speaking...';
        this.elements.stopSpeakingBtn.disabled = false;
        
        // Start timer for tutor
        this.startTime = Date.now();
    },
    
    finishSpeaking: function() {
        this.setIdleState();
        this.elements.stopSpeakingBtn.disabled = true;
        
        // Update the duration in the last tutor message and in chat history
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        
        // Update the displayed meta text
        const tutorMeta = this.elements.transcriptArea.querySelector('.tutor-row:last-child .message-meta');
        if (tutorMeta) {
            const currentText = tutorMeta.textContent;
            tutorMeta.textContent = currentText + ` • ${duration} seconds`;
        }
        
        // Update the chat history entry
        if (this.chatHistory.length > 0 && this.chatHistory[this.chatHistory.length - 1].speaker === 'Tutor') {
            this.chatHistory[this.chatHistory.length - 1].duration = duration;
        }
    },
    
    updateStatus: function(message) {
        this.elements.statusIndicator.textContent = message;
    },
    
    getSelectedModel: function() {
        return this.elements.modelSelector.value;
    },
    
    getSelectedLanguage: function() {
        return this.elements.languageSelector.value;
    },
    
    countWords: function(str) {
        return str.trim().split(/\s+/).length;
    },
    
    addMessageToTranscript: function(speaker, message, isUser, duration, wordCount) {
        const messageRow = document.createElement('div');
        messageRow.className = isUser ? 'message-row user-row' : 'message-row tutor-row';
        
        const messageBubble = document.createElement('div');
        messageBubble.className = isUser ? 'message-bubble user-bubble' : 'message-bubble tutor-bubble';
        messageBubble.textContent = message;
        
        const messageMeta = document.createElement('div');
        messageMeta.className = 'message-meta';
        
        // Add word count and duration (if available)
        let metaText = `${wordCount} words`;
        if (duration > 0) {
            metaText += ` • ${duration} seconds`;
        }
        messageMeta.textContent = metaText;
        
        messageRow.appendChild(messageBubble);
        messageRow.appendChild(messageMeta);
        this.elements.transcriptArea.appendChild(messageRow);
        
        // Scroll to bottom
        this.elements.transcriptArea.scrollTop = this.elements.transcriptArea.scrollHeight;
    },
    
    processUserInput: async function() {
        const transcript = SpeechRecognition.getCurrentTranscript();
        console.log("Processing with transcript value:", JSON.stringify(transcript));
        
        const userInput = transcript || "Sorry, I didn't catch that. Could you try again?";
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const wordCount = this.countWords(userInput);
        
        // Add user message to transcript
        this.addMessageToTranscript('You', userInput, true, duration, wordCount);
        
        // Add to chat history
        this.chatHistory.push({
            speaker: 'You',
            message: userInput,
            duration: duration,
            wordCount: wordCount,
            timestamp: new Date().toISOString()
        });
        
        // Clear transcript for next input
        SpeechRecognition.resetTranscript();
        
        try {
            // Get response from LLM
            const llmResponse = await API.getLLMResponse(
                userInput, 
                this.getSelectedModel(), 
                this.getSelectedLanguage()
            );
            
            // Change state from thinking to speaking
            this.isProcessing = false;
            
            // Add tutor response to transcript
            const tutorWordCount = this.countWords(llmResponse);
            this.addMessageToTranscript('Tutor', llmResponse, false, 0, tutorWordCount);
            
            // Add to chat history
            this.chatHistory.push({
                speaker: 'Tutor',
                message: llmResponse,
                duration: 0, // Will be updated after speaking
                wordCount: tutorWordCount,
                timestamp: new Date().toISOString()
            });
            
            // Speak the response
            TTS.speak(llmResponse);
            
        } catch (error) {
            this.isProcessing = false;
            this.setIdleState();
            alert(`Error: ${error.message}`);
        }
    }
};