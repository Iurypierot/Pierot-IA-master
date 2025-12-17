const btn = document.querySelector('.talk');
const content = document.querySelector('.content');

// Variável para armazenar as vozes (importante para Android)
let voicesLoaded = false;
let availableVoices = [];

// Função para carregar vozes (necessário para Android)
function loadVoices() {
    if (window.speechSynthesis) {
        availableVoices = window.speechSynthesis.getVoices();
        voicesLoaded = true;
    }
}

// Carrega vozes quando disponíveis (Android precisa disso)
if (window.speechSynthesis) {
    loadVoices();
    // Android pode demorar para carregar vozes
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text) {
    if (!window.speechSynthesis) {
        console.log("Speech Synthesis não suportado neste navegador.");
        return;
    }

    // Para Android: garante que as vozes estão carregadas
    if (!voicesLoaded) {
        loadVoices();
    }

    // Cancela qualquer fala anterior (evita sobreposição)
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.volume = 1;
    utterance.pitch = 1;

    // Pega voz compatível com pt-BR (funciona em iOS e Android)
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const ptBRVoice = voices.find(v => v.lang === "pt-BR" || v.lang.startsWith("pt"));
    utterance.voice = ptBRVoice || voices[0] || null;

    // Tratamento de erros para Android
    utterance.onerror = (event) => {
        console.error("Erro na síntese de voz:", event.error);
    };

    window.speechSynthesis.speak(utterance);
}

// Inicialização rápida - sem saudação para ser mais rápido
let initialized = false;
function initializeApp() {
    if (initialized) return;
    initialized = true;
    // Não fala nada, apenas inicializa silenciosamente
}

// Configuração do Speech Recognition (compatível com iOS e Android)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true; // Ativado para processar mais rápido

    recognition.onresult = (event) => {
        const currentIndex = event.resultIndex;
        const transcript = event.results[currentIndex][0].transcript;
        const isFinal = event.results[currentIndex].isFinal;
        
        content.textContent = transcript;
        
        // Processa imediatamente quando final, sem esperar
        if (isFinal) {
            takeCommand(transcript.toLowerCase());
        }
    };

    recognition.onerror = (event) => {
        console.error("Erro no reconhecimento:", event.error);
        if (event.error === 'no-speech') {
            content.textContent = "Nenhuma fala detectada. Tente novamente.";
        } else if (event.error === 'audio-capture') {
            content.textContent = "Erro ao capturar áudio. Verifique as permissões do microfone.";
        } else if (event.error === 'not-allowed') {
            content.textContent = "Permissão de microfone negada. Por favor, permita o acesso ao microfone.";
        } else {
            content.textContent = "Erro: " + event.error;
        }
        // Para Android: para o reconhecimento em caso de erro
        try {
            recognition.stop();
        } catch (e) {
            // Ignora erros ao parar
        }
    };

    recognition.onend = () => {
        // Reconhecimento terminou (normal ou por erro)
        // Não faz nada aqui, o usuário pode clicar novamente
    };

    recognition.onstart = () => {
        content.textContent = "Audição...";
    };

    btn.addEventListener('click', () => {
        if (!initialized) {
            initializeApp();
        }
        
        // Cancela qualquer fala em andamento para ser mais rápido
        window.speechSynthesis.cancel();
        
        try {
            // Para qualquer reconhecimento anterior
            if (recognition && recognition.state !== 'inactive') {
                recognition.stop();
            }
            
            // Inicia imediatamente, sem delay desnecessário
            content.textContent = "Ouvindo...";
            recognition.start();
        } catch (error) {
            console.error("Erro ao iniciar reconhecimento:", error);
            content.textContent = "Erro ao iniciar reconhecimento de voz.";
        }
    });
} else {
    content.textContent = "Reconhecimento de voz não suportado neste dispositivo.";
}

function takeCommand(message) {
    // Remove palavras comuns para melhor detecção
    const cleanMessage = message.trim();
    
    // Comandos para ChatGPT - prioridade alta
    if (message.includes('chatgpt') || message.includes('chat gpt') || message.includes('gpt') || 
        message.includes('abrir chatgpt') || message.includes('abrir gpt') ||
        message.includes('assistente ia') || message.includes('perguntar para ia')) {
        
        // Abre ChatGPT diretamente
        window.open("https://chat.openai.com", "_blank");
        content.textContent = "Abrindo ChatGPT...";
        return; // Não fala nada para ser mais rápido
    }
    
    // Comandos para IA/Inteligência Artificial - direciona para ChatGPT
    if (message.includes('ia') || message.includes('inteligência artificial') || 
        message.includes('perguntar para a ia') || message.includes('falar com ia')) {
        window.open("https://chat.openai.com", "_blank");
        content.textContent = "Abrindo ChatGPT...";
        return;
    }
    
    // Comandos para Google - prioridade alta
    if (message.includes('google') || message.includes('pesquisar') || message.includes('buscar') ||
        message.includes('procurar') || message.includes('o que é') || message.includes('quem é') ||
        message.includes('como') || message.includes('onde')) {
        
        // Extrai a busca
        let searchQuery = cleanMessage
            .replace(/google|pesquisar|buscar|procurar|o que é|quem é|como|onde/gi, '')
            .trim();
        
        if (!searchQuery) {
            // Se não tem query, apenas abre Google
            window.open("https://www.google.com", "_blank");
            content.textContent = "Abrindo Google...";
        } else {
            // Faz busca no Google
            const encodedQuery = encodeURIComponent(searchQuery);
            window.open(`https://www.google.com/search?q=${encodedQuery}`, "_blank");
            content.textContent = `Buscando: ${searchQuery}`;
        }
        return; // Não fala nada para ser mais rápido
    }
    
    // Comandos específicos rápidos
    if (message.includes("youtube") || message.includes("vídeo")) {
        let videoQuery = cleanMessage.replace(/youtube|vídeo|video/gi, '').trim();
        if (videoQuery) {
            const encodedQuery = encodeURIComponent(videoQuery);
            window.open(`https://www.youtube.com/results?search_query=${encodedQuery}`, "_blank");
            content.textContent = `Buscando no YouTube: ${videoQuery}`;
        } else {
            window.open("https://youtube.com", "_blank");
            content.textContent = "Abrindo YouTube...";
        }
        return;
    }
    
    if (message.includes("wikipedia") || message.includes("wikipédia")) {
        let wikiQuery = cleanMessage.replace(/wikipedia|wikipédia/gi, '').trim();
        if (wikiQuery) {
            const encodedQuery = encodeURIComponent(wikiQuery);
            window.open(`https://pt.wikipedia.org/wiki/${encodedQuery}`, "_blank");
            content.textContent = `Abrindo Wikipedia: ${wikiQuery}`;
        } else {
            window.open("https://pt.wikipedia.org", "_blank");
            content.textContent = "Abrindo Wikipedia...";
        }
        return;
    }
    
    // Comandos de informação rápida
    if (message.includes('hora') || message.includes('horas')) {
        const time = new Date().toLocaleString('pt-BR', { hour: "2-digit", minute: "2-digit" });
        content.textContent = `São ${time}`;
        speak(`São ${time}`);
        return;
    }
    
    if (message.includes('data') || message.includes('dia')) {
        const date = new Date().toLocaleDateString('pt-BR');
        content.textContent = `Hoje é ${date}`;
        speak(`Hoje é ${date}`);
        return;
    }
    
    // Por padrão, busca no Google (mais rápido)
    // Remove palavras comuns de comando
    const searchQuery = cleanMessage
        .replace(/hey|hello|olá|oi|abrir|abre|mostrar|mostra/gi, '')
        .trim();
    
    if (searchQuery) {
        const encodedQuery = encodeURIComponent(searchQuery);
        window.open(`https://www.google.com/search?q=${encodedQuery}`, "_blank");
        content.textContent = `Buscando: ${searchQuery}`;
    } else {
        // Se não tem nada, abre Google
        window.open("https://www.google.com", "_blank");
        content.textContent = "Abrindo Google...";
    }
}
