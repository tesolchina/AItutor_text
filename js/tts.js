// Text-to-Speech module
const TTS = {
    isSpeaking: false,
    
    speak: function(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice language based on detected text language
        const hasChinese = /[\u4e00-\u9fff]/.test(text);
        if (hasChinese) {
            utterance.lang = 'zh-CN';
        } else {
            utterance.lang = 'en-US';
        }
        
        // Try to find a good voice
        const voices = speechSynthesis.getVoices();
        let preferredVoice;
        
        if (hasChinese) {
            preferredVoice = voices.find(voice => 
                voice.lang.includes('zh') && voice.name.includes('Google')
            ) || voices.find(voice => voice.lang.includes('zh'));
        } else {
            preferredVoice = voices.find(voice => 
                voice.lang.includes('en') && voice.name.includes('Google') && voice.name.includes('Female')
            ) || voices.find(voice => 
                voice.lang.includes('en') && voice.name.includes('Google')
            ) || voices.find(voice => voice.lang.includes('en'));
        }
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log(`Using voice: ${preferredVoice.name} (${preferredVoice.lang})`);
        }
        
        // Start speaking animation
        UI.setSpeakingState();
        this.isSpeaking = true;
        
        // Handle speech end
        utterance.onend = this.handleSpeechEnd.bind(this);
        
        speechSynthesis.speak(utterance);
        return utterance;
    },
    
    handleSpeechEnd: function() {
        this.isSpeaking = false;
        UI.finishSpeaking();
    },
    
    stop: function() {
        speechSynthesis.cancel();
        this.handleSpeechEnd();
    },
    
    // Initialize voices when they become available
    init: function() {
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => {
                console.log("Voices loaded:", speechSynthesis.getVoices().length);
            };
        }
    }
};