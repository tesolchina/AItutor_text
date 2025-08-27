// Main initialization module
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Audio Tutor...');
    
    // Initialize modules
    SpeechRecognition.setup();
    TTS.init();
    UI.init();
    Settings.init();
    
    // Load data
    await Promise.all([
        Settings.loadModels(),
        Settings.loadSystemPrompt()
    ]);
    
    console.log('Audio Tutor initialized successfully!');
});