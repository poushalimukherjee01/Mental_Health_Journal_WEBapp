// Speech-to-Text and Text-to-Speech using Web Speech API (Chrome built-in)
class SpeechHandler {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;

        this.initRecognition();
    }

    initRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                if (window.onSpeechStart) {
                    window.onSpeechStart();
                }
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (window.onSpeechResult) {
                    window.onSpeechResult(finalTranscript, interimTranscript);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                if (window.onSpeechError) {
                    window.onSpeechError(event.error);
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (window.onSpeechEnd) {
                    window.onSpeechEnd();
                }
            };
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    }

    startListening() {
        if (!this.recognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        if (this.isListening) {
            this.stopListening();
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    speak(text, options = {}) {
        if (!this.synthesis) {
            alert('Text-to-speech is not supported in your browser.');
            return;
        }

        // Stop any ongoing speech
        this.stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        utterance.lang = options.lang || 'en-US';

        utterance.onstart = () => {
            this.isSpeaking = true;
            if (window.onSpeechSpeakStart) {
                window.onSpeechSpeakStart();
            }
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (window.onSpeechSpeakEnd) {
                window.onSpeechSpeakEnd();
            }
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isSpeaking = false;
        };

        this.synthesis.speak(utterance);
    }

    stopSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }

    getVoices() {
        return new Promise((resolve) => {
            let voices = this.synthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
            } else {
                this.synthesis.onvoiceschanged = () => {
                    voices = this.synthesis.getVoices();
                    resolve(voices);
                };
            }
        });
    }
}

// Initialize speech handler
const speechHandler = new SpeechHandler()