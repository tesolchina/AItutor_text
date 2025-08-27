// Speech recognition module
const SpeechRecognition = {
    recognition: null,
    isListening: false,
    recognitionTranscript: '',
    allRecognitionResults: [],
    
    setup: function() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Your browser does not support speech recognition. Please use Chrome for best results.');
            return;
        }
        
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = UI.getSelectedLanguage();
        
        // Clear results when starting
        this.allRecognitionResults = [];
        
        this.recognition.onresult = this.handleResult.bind(this);
        this.recognition.onerror = this.handleError.bind(this);
        this.recognition.onend = this.handleEnd.bind(this);
    },
    
    handleResult: function(event) {
        let interimTranscript = '';
        
        // Store ALL final results in our array
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                this.allRecognitionResults.push(event.results[i][0].transcript);
                console.log("Added final result:", event.results[i][0].transcript);
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        // Show interim results
        if (interimTranscript !== '') {
            document.getElementById('interim-results').textContent = interimTranscript;
            document.getElementById('interim-results').style.display = 'block';
        }
        
        // Update the full transcript from all results
        this.recognitionTranscript = this.allRecognitionResults.join(' ');
        console.log("Current full transcript:", this.recognitionTranscript);
    },
    
    handleError: function(event) {
        console.error("Recognition error:", event.error);
        if (event.error === 'no-speech') {
            UI.updateStatus('No speech detected. Please try again.');
        } else if (event.error === 'audio-capture') {
            UI.updateStatus('Microphone issue. Please check your device.');
        } else if (event.error === 'not-allowed') {
            UI.updateStatus('Microphone access denied. Please allow microphone use.');
        }
    },
    
    handleEnd: function() {
        if (this.isListening) {
            // If we're supposed to be listening but recognition stopped, restart it
            try {
                this.recognition.start();
                console.log("Recognition restarted automatically");
            } catch (e) {
                console.error("Failed to restart recognition:", e);
                this.isListening = false;
                UI.stopListeningUI();
            }
        } else {
            // Normal end of recognition
            UI.stopListeningUI();
        }
    },
    
    startListening: function() {
        if (!this.isListening && !UI.isProcessing) {
            // Reset the recognition transcript and results array
            this.recognitionTranscript = '';
            this.allRecognitionResults = [];
            
            try {
                // Ensure recognition is using the current language
                if (this.recognition) {
                    this.recognition.lang = UI.getSelectedLanguage();
                }
                
                this.recognition.start();
                this.isListening = true;
                UI.startListeningUI();
            } catch (error) {
                console.error("Recognition error:", error);
                // If already started, stop and restart
                this.recognition.stop();
                setTimeout(() => {
                    this.startListening();
                }, 200);
            }
        }
    },
    
    stopListening: function() {
        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            UI.stopListeningUI();
            UI.setThinkingState();
        }
    },
    
    getCurrentTranscript: function() {
        return this.recognitionTranscript;
    },
    
    resetTranscript: function() {
        this.recognitionTranscript = '';
        this.allRecognitionResults = [];
    }
};