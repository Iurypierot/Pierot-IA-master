const btn = document.querySelector('.talk');
const content = document.querySelector('.content');

function speak(text) {
    if (!window.speechSynthesis) {
        console.log("Speech Synthesis não suportado neste navegador.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.volume = 1;
    utterance.pitch = 1;

    // pega voz compatível com iOS (pt-BR se existir)
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang === "pt-BR") || voices[0];

    window.speechSynthesis.speak(utterance);
}

// Só vai rodar a saudação depois de um clique do usuário no iOS
function wishMe() {
    const day = new Date();
    const hour = day.getHours();

    if (hour >= 0 && hour < 12) {
        speak("Bom Dia chefe...");
    } else if (hour >= 12 && hour < 17) {
        speak("Boa tarde ...");
    } else {
        speak("Boa noite senhor...");
    }
}

// iOS exige interação -> só inicializa fala depois do primeiro clique
document.addEventListener('click', function init() {
    speak("Inicializando Busca...");
    wishMe();
    document.removeEventListener('click', init); // evita repetir
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR"; // melhora no iOS

    recognition.onresult = (event) => {
        const currentIndex = event.resultIndex;
        const transcript = event.results[currentIndex][0].transcript;
        content.textContent = transcript;
        takeCommand(transcript.toLowerCase());
    };

    btn.addEventListener('click', () => {
        content.textContent = "Audição...";
        recognition.start();
    });
} else {
    content.textContent = "Reconhecimento de voz não suportado neste dispositivo.";
}

function takeCommand(message) {
    if (message.includes('hey') || message.includes('hello')) {
        speak("Olá senhor, em que posso ajudá-lo?");
    } else if (message.includes("open google")) {
        window.open("https://google.com", "_blank");
        speak("Abrindo o Google...");
    } else if (message.includes("open youtube")) {
        window.open("https://youtube.com", "_blank");
        speak("Abrindo o Youtube...");
    } else if (message.includes("open facebook")) {
        window.open("https://facebook.com", "_blank");
        speak("Abrindo o Facebook...");
    } else if (message.includes('what is') || message.includes('who is') || message.includes('what are')) {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "Isto é o que encontrei na internet sobre " + message;
        speak(finalText);
    } else if (message.includes('wikipedia')) {
        window.open(`https://pt.wikipedia.org/wiki/${message.replace("wikipedia", "").trim()}`, "_blank");
        const finalText = "Isto é o que encontrei na internet sobre " + message;
        speak(finalText);
    } else if (message.includes('time')) {
        const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        speak("A hora atual é " + time);
    } else if (message.includes('date')) {
        const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric" });
        speak("A data de hoje é " + date);
    } else {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        speak("Encontrei algumas informações para " + message + " no Google");
    }
}
