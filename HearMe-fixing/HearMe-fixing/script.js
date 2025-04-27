document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const languageDirection = document.getElementById('languageDirection');
    const startBtn = document.getElementById('start');
    const stopBtn = document.getElementById('stop');
    const sourceTextArea = document.getElementById('sourceText');
    const targetTextArea = document.getElementById('targetText');
    const downloadSourceBtn = document.getElementById('downloadSource');
    const downloadTargetBtn = document.getElementById('downloadTarget');
    const downloadAudioBtn = document.getElementById('downloadAudio');
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const sourceLabel = document.getElementById('sourceLabel');
    const targetLabel = document.getElementById('targetLabel');

    // Initial validation for DOM elements
    if (!languageDirection || !startBtn || !stopBtn || !sourceTextArea || !targetTextArea || 
        !downloadSourceBtn || !downloadTargetBtn || !downloadAudioBtn || !heroTitle || 
        !heroSubtitle || !sourceLabel || !targetLabel) {
        console.error('Critical elements missing:', {
            languageDirection: !!languageDirection,
            startBtn: !!startBtn,
            stopBtn: !!stopBtn,
            sourceTextArea: !!sourceTextArea,
            targetTextArea: !!targetTextArea,
            downloadSourceBtn: !!downloadSourceBtn,
            downloadTargetBtn: !!downloadTargetBtn,
            downloadAudioBtn: !!downloadAudioBtn,
            heroTitle: !!heroTitle,
            heroSubtitle: !!heroSubtitle,
            sourceLabel: !!sourceLabel,
            targetLabel: !!targetLabel
        });
        alert('Site initialization failed. Check console for details.');
        return;
    }

    let recognition;
    let mediaRecorder;
    let audioChunks = [];
    let fullSourceText = '';
    let translatedText = ''; // Store the translated text for download

    // Update UI based on language direction
    function updateUI() {
        const direction = languageDirection.value;
        if (direction === 'fr-en') {
            heroTitle.textContent = 'Live French to English Translator';
            heroSubtitle.textContent = 'Real-time speech transcription, translation, and recording for seamless communication.';
            sourceLabel.innerHTML = '<span class="emoji">🎧</span> French Transcript';
            targetLabel.innerHTML = '<span class="emoji">🌐</span> English Translation';
            downloadSourceBtn.textContent = 'Download French Transcript';
            downloadTargetBtn.textContent = 'Download English Translation';
        } else {
            heroTitle.textContent = 'Live English to French Translator';
            heroSubtitle.textContent = 'Transcription, traduction et enregistrement en temps réel pour une communication fluide.';
            sourceLabel.innerHTML = '<span class="emoji">🎧</span> English Transcript';
            targetLabel.innerHTML = '<span class="emoji">🌐</span> French Translation';
            downloadSourceBtn.textContent = 'Download English Transcript';
            downloadTargetBtn.textContent = 'Download French Translation';
        }
    }

    // Initialize UI
    updateUI();

    // Update UI when language direction changes
    languageDirection.addEventListener('change', () => {
        updateUI();
        // Reset text areas
        fullSourceText = '';
        translatedText = '';
        sourceTextArea.value = '';
        targetTextArea.value = '';
        if (recognition) {
            recognition.stop();
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            console.log(`Navigated to ${link.getAttribute('href')}`);
        });
    });

    // Check for Speech Recognition API support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = async (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    fullSourceText += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            sourceTextArea.value = fullSourceText + interimTranscript;
            if (fullSourceText.trim()) {
                translatedText = await translateText(fullSourceText);
                targetTextArea.value = translatedText;
            }
        };
    } else {
        alert('Speech Recognition API is not supported in this browser. Please use Chrome or another supported browser.');
    }

    // Start speech recognition and recording
    startBtn.addEventListener('click', async () => {
        recognition.lang = languageDirection.value === 'fr-en' ? 'fr-FR' : 'en-US';
        
        recognition.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;

        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
    });

    // Stop speech recognition and recording
    stopBtn.addEventListener('click', () => {
        recognition.stop();
        startBtn.disabled = false;
        stopBtn.disabled = true;

        // Stop recording
        mediaRecorder.stop();
    });

    // Mock translation data for fallback
    function getMockTranslation(text, sourceLang, targetLang) {
        const mockTranslations = {
            'fr-en': {
                'Bonjour.': 'Hello.', // Add this
                'Bonjour, comment vas-tu ?': 'Hello, how are you?',
                'Je suis très bien, merci !': 'I am very well, thank you!'
            },
            'en-fr': {
                'Hello.': 'Bonjour.', // Add this
                'Hello, how are you?': 'Bonjour, comment vas-tu ?',
                'I am very well, thank you!': 'Je suis très bien, merci !'
            }
        };
    
        const direction = `${sourceLang}-${targetLang}`;
        return mockTranslations[direction][text] || `Mock translation of "${text}" from ${sourceLang} to ${targetLang}`;
    }

    // Translate text using OpenRouter API with fallback
    async function translateText(text) {
        const direction = languageDirection.value;
        const langPair = direction === 'fr-en' ? { from: 'fr', to: 'en' } : { from: 'en', to: 'fr' };
    
        console.log("Attempting to translate:", text);
        
        try {
            const response = await fetch('http://localhost:5000/translate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    from: langPair.from,
                    to: langPair.to
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Translation response:", data);
            
            if (!data.success) {
                throw new Error(data.error || 'Translation failed');
            }
            
            return data.translation;
        } catch (error) {
            console.error("Translation error:", error);
            // Show error in UI
            targetTextArea.value = `Error: ${error.message}`;
            return getMockTranslation(text, langPair.from, langPair.to);
        }
    }

    // Download functions
    downloadSourceBtn.addEventListener('click', () => {
        const filename = languageDirection.value === 'fr-en' ? 'french_transcript.txt' : 'english_transcript.txt';
        downloadText(filename, sourceTextArea.value);
    });

    downloadTargetBtn.addEventListener('click', () => {
        const filename = languageDirection.value === 'fr-en' ? 'english_translation.txt' : 'french_translation.txt';
        downloadText(filename, targetTextArea.value);
    });

    downloadAudioBtn.addEventListener('click', () => {
        if (audioChunks.length > 0) {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'recorded_audio.webm';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            alert('No audio recorded yet!');
        }
    });

    function downloadText(filename, text) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
});