// Detecta se é iOS PRIMEIRO (antes de usar)
const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// Aguarda o DOM estar pronto
let btn, content;

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

// Carrega vozes quando disponíveis (Android e iOS precisam disso)
if (window.speechSynthesis) {
  loadVoices();
  // iOS e Android podem demorar para carregar vozes
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  // iOS às vezes precisa de um delay para carregar vozes
  if (isIOS) {
    setTimeout(loadVoices, 100);
  }
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
  const voices =
    availableVoices.length > 0
      ? availableVoices
      : window.speechSynthesis.getVoices();
  const ptBRVoice = voices.find(
    (v) => v.lang === "pt-BR" || v.lang.startsWith("pt")
  );
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
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

// Função para configurar o botão de escrita
function setupWriteButton() {
  const writeBtn = document.querySelector(".write");
  const inputWrite = document.querySelector(".input-write");
  const textInput = document.querySelector(".text-input");
  const sendBtn = document.querySelector(".send");
  const closeWriteBtn = document.querySelector(".close-write");
  const inputContainer = document.querySelector(".input");

  if (!writeBtn || !inputWrite || !textInput || !sendBtn || !inputContainer) {
    console.error("Elementos de escrita não encontrados!");
    return;
  }

  // Função para abrir campo de digitação
  function openWriteMode() {
    inputContainer.style.display = "none";
    inputWrite.style.display = "flex";
    // Pequeno delay para garantir que o display foi aplicado antes do focus
    setTimeout(() => {
      textInput.focus();
    }, 50);
  }

  // Função para fechar campo de digitação
  function closeWriteMode() {
    inputWrite.style.display = "none";
    inputContainer.style.display = "flex";
    textInput.value = "";
    // Foca no botão de voz quando voltar
    if (btn) {
      btn.focus();
    }
  }

  // Função para processar texto enviado
  function handleTextSubmit() {
    const text = textInput.value.trim();
    if (text) {
      content.textContent = text;
      takeCommand(text.toLowerCase());
      // Limpa o texto após enviar
      setTimeout(() => {
        if (content) {
          content.textContent = "Clique aqui para falar";
        }
      }, 500); // Pequeno delay para o usuário ver que foi enviado
      closeWriteMode();
    } else {
      // Se estiver vazio, apenas fecha
      closeWriteMode();
    }
  }

  // Eventos do botão de escrita
  writeBtn.addEventListener("click", openWriteMode);

  // Eventos do botão de envio
  sendBtn.addEventListener("click", handleTextSubmit);

  // Eventos do botão de fechar
  if (closeWriteBtn) {
    closeWriteBtn.addEventListener("click", closeWriteMode);
  }

  // Enviar ao pressionar Enter
  textInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTextSubmit();
    }
  });

  // Fechar ao pressionar Escape
  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeWriteMode();
    }
  });
}

// Variável para o botão de enviar voz
let sendVoiceBtn = null;
let pendingTranscript = null; // Armazena o texto pendente para envio

// Função para inicializar quando o DOM estiver pronto
function initApp() {
  btn = document.querySelector(".talk");
  content = document.querySelector(".content");
  sendVoiceBtn = document.querySelector(".send-voice");

  if (!btn || !content) {
    console.error("Elementos não encontrados!");
    return;
  }

  setupRecognition();
  setupWriteButton();
  setupSendVoiceButton();
}

// Função para configurar o botão de enviar voz
function setupSendVoiceButton() {
  if (!sendVoiceBtn) return;

  sendVoiceBtn.addEventListener("click", () => {
    if (pendingTranscript && pendingTranscript.trim().length > 0) {
      const text = pendingTranscript.trim();
      content.textContent = text;
      takeCommand(text.toLowerCase());
      // Limpa o texto e esconde o botão após enviar
      setTimeout(() => {
        content.textContent = "Clique aqui para falar";
        hideSendButton();
        pendingTranscript = null;
      }, 500); // Pequeno delay para o usuário ver que foi enviado
      stopRecognition();
    }
  });
}

// Função para mostrar o botão de enviar
function showSendButton() {
  if (sendVoiceBtn) {
    sendVoiceBtn.style.display = "flex";
    // Animação suave
    setTimeout(() => {
      if (sendVoiceBtn) {
        sendVoiceBtn.style.opacity = "1";
        sendVoiceBtn.style.transform = "translateY(0)";
      }
    }, 10);
  }
}

// Função para esconder o botão de enviar
function hideSendButton() {
  if (sendVoiceBtn) {
    sendVoiceBtn.style.opacity = "0";
    sendVoiceBtn.style.transform = "translateY(-10px)";
    setTimeout(() => {
      if (sendVoiceBtn) {
        sendVoiceBtn.style.display = "none";
      }
    }, 300);
  }
  pendingTranscript = null;
}

// Configura o reconhecimento de voz
function setupRecognition() {
  if (!SpeechRecognition) {
    if (content) {
      content.textContent =
        "Reconhecimento de voz não suportado neste dispositivo.";
    }
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  // iOS funciona melhor sem interimResults
  recognition.interimResults = !isIOS;
  recognition.maxAlternatives = 1;

  let lastProcessed = "";
  let processingTimeout = null;
  let recognitionTimeout = null;

  recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript
      .toLowerCase()
      .trim();
    const isFinal = event.results[currentIndex].isFinal;

    content.textContent = transcript;
    pendingTranscript = transcript; // Armazena o texto pendente

    // Limpa timeout anterior
    if (processingTimeout) {
      clearTimeout(processingTimeout);
    }

    // Quando há texto reconhecido, mostra o botão de enviar
    if (transcript.length > 0) {
      showSendButton();
    }

    // iOS: quando final, mostra botão e para o microfone (mas não processa automaticamente)
    if (isIOS) {
      if (isFinal && transcript !== lastProcessed && transcript.length > 0) {
        lastProcessed = transcript;
        // Para o microfone mas não processa - espera o botão de enviar
        stopRecognition();
      } else if (!isFinal && transcript.length > 1 && transcript !== lastProcessed) {
        // iOS: após estabilidade, mostra botão e para microfone
        processingTimeout = setTimeout(() => {
          const currentTranscript = content.textContent.trim().toLowerCase();
          if (currentTranscript === transcript && 
              transcript !== lastProcessed && 
              transcript.length > 0) {
            lastProcessed = transcript;
            // Para o microfone mas não processa - espera o botão de enviar
            stopRecognition();
          }
        }, 800);
      }
    }
    // Android/Outros: quando final, mostra botão e para o microfone
    else {
      if (isFinal && transcript !== lastProcessed) {
        lastProcessed = transcript;
        // Para o microfone mas não processa - espera o botão de enviar
        stopRecognition();
      }
      // Para resultados intermediários, mostra botão mas continua ouvindo
      else if (
        !isFinal &&
        transcript.length > 2 &&
        transcript !== lastProcessed
      ) {
        // Mostra botão mas continua ouvindo para capturar mais
        if (isQuickCommand(transcript)) {
          processingTimeout = setTimeout(() => {
            if (transcript !== lastProcessed) {
              lastProcessed = transcript;
              // Para o microfone mas não processa - espera o botão de enviar
              stopRecognition();
            }
          }, 200);
        }
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("Erro no reconhecimento:", event.error);
    if (event.error === "no-speech") {
      content.textContent = "Nenhuma fala detectada. Tente novamente.";
    } else if (event.error === "audio-capture") {
      content.textContent =
        "Erro ao capturar áudio. Verifique as permissões do microfone nas configurações.";
    } else if (event.error === "not-allowed") {
      content.textContent =
        "Permissão de microfone negada. Vá em Configurações > Safari > Microfone e permita o acesso.";
    } else if (event.error === "aborted") {
      // iOS às vezes aborta, não é um erro real
      content.textContent = "Clique aqui para falar";
    } else {
      content.textContent = "Erro: " + event.error + ". Tente novamente.";
    }
    // Para o reconhecimento em caso de erro
    try {
      if (recognition.state !== "stopped" && recognition.state !== "inactive") {
        recognition.stop();
      }
    } catch (e) {
      // Ignora erros ao parar
    }
  };

  recognition.onend = () => {
    // Limpa timeout se existir
    if (recognitionTimeout) {
      clearTimeout(recognitionTimeout);
      recognitionTimeout = null;
    }
    
    // Se não tem texto válido, esconde o botão
    const currentText = content.textContent.trim().toLowerCase();
    if (!currentText || 
        currentText === "audição..." || 
        currentText === "ouvindo..." ||
        currentText === "clique aqui para falar" ||
        currentText.length === 0) {
      hideSendButton();
      content.textContent = "Clique aqui para falar";
    }
    // Se tem texto, mantém o botão visível para o usuário enviar
  };

  // Função para parar o reconhecimento de voz
  function stopRecognition() {
    try {
      // Limpa timeout
      if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
        recognitionTimeout = null;
      }
      if (
        recognition &&
        (recognition.state === "listening" || recognition.state === "starting")
      ) {
        if (isIOS) {
          recognition.abort(); // iOS funciona melhor com abort
        } else {
          recognition.stop();
        }
      }
    } catch (e) {
      // Ignora erros ao parar
      console.log("Reconhecimento já estava parado");
    }
  }

  recognition.onstart = () => {
    content.textContent = "Audição...";
    hideSendButton(); // Esconde botão ao iniciar
    pendingTranscript = null;
    lastProcessed = ""; // Limpa o último processado para permitir nova fala
    // Limpa qualquer timeout anterior
    if (recognitionTimeout) {
      clearTimeout(recognitionTimeout);
    }
    // Timeout para desligar microfone automaticamente
    const timeoutDuration = isIOS ? 8000 : 10000; // iOS: 8 segundos, outros: 10 segundos
    recognitionTimeout = setTimeout(() => {
      if (
        recognition &&
        (recognition.state === "listening" || recognition.state === "starting")
      ) {
        // Se tem texto, mostra botão; senão, apenas desliga
        const currentText = content.textContent.trim().toLowerCase();
        if (currentText && 
            currentText !== "audição..." && 
            currentText !== "ouvindo..." &&
            currentText !== "clique aqui para falar" &&
            currentText.length > 0) {
          // Mostra botão para o usuário enviar manualmente
          showSendButton();
        } else {
          content.textContent = "Tempo esgotado. Clique para falar novamente.";
        }
        stopRecognition();
      }
    }, timeoutDuration);
  };

  // Função auxiliar para detectar comandos rápidos
  function isQuickCommand(message) {
    const quickCommands = [
      "chatgpt",
      "gpt",
      "google",
      "pesquisar",
      "buscar",
      "youtube",
      "wikipedia",
      "ia",
      "abrir",
    ];
    return quickCommands.some((cmd) => message.includes(cmd));
  }

  // Função para iniciar reconhecimento (compartilhada entre click e touch)
  function startRecognition() {
    if (!btn || !content) {
      console.error("Elementos não encontrados!");
      return;
    }

    if (!initialized) {
      initializeApp();
    }

    // Limpa qualquer texto anterior e esconde botão de enviar
    content.textContent = "Ouvindo...";
    hideSendButton();
    pendingTranscript = null;
    lastProcessed = "";

    // Cancela qualquer fala em andamento para ser mais rápido
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      // Para qualquer reconhecimento anterior
      if (recognition) {
        // Verifica o estado atual
        const currentState = recognition.state;
        console.log("Estado atual do reconhecimento:", currentState);

        // iOS: precisa parar completamente antes de iniciar novo
        if (isIOS) {
          if (currentState !== "inactive" && currentState !== "stopped") {
            try {
              recognition.abort(); // iOS funciona melhor com abort
            } catch (e) {
              console.log("Erro ao abortar:", e);
            }
          }
          // Pequeno delay no iOS para garantir que parou
          setTimeout(() => {
            try {
              content.textContent = "Ouvindo...";
              recognition.start();
            } catch (e) {
              console.error("Erro ao iniciar (iOS):", e);
              content.textContent = "Erro ao iniciar. Tente novamente.";
            }
          }, 100);
        } else {
          // Android/Outros: para e inicia imediatamente
          if (currentState === "listening" || currentState === "starting") {
            try {
              recognition.stop();
            } catch (e) {
              console.log("Erro ao parar:", e);
            }
          }
          // Pequeno delay para garantir que parou antes de iniciar
          setTimeout(() => {
            try {
              content.textContent = "Ouvindo...";
              recognition.start();
            } catch (e) {
              console.error("Erro ao iniciar:", e);
              content.textContent = "Erro ao iniciar. Tente novamente.";
            }
          }, 50);
        }
      } else {
        content.textContent = "Reconhecimento não disponível.";
      }
    } catch (error) {
      console.error("Erro ao iniciar reconhecimento:", error);
      if (content) {
        content.textContent = "Erro ao iniciar. Tente novamente.";
      }
      // iOS: tenta novamente após erro
      if (isIOS && error.name !== "InvalidStateError") {
        setTimeout(() => {
          try {
            if (content) content.textContent = "Ouvindo...";
            recognition.start();
          } catch (e) {
            if (content)
              content.textContent =
                "Permita o acesso ao microfone nas configurações.";
          }
        }, 200);
      }
    }
  }

  // Função para iniciar quando clicar no botão ou no texto
  function handleStart(event) {
    event.preventDefault();
    event.stopPropagation();
    startRecognition();
  }

  // Adiciona listeners ao botão
  btn.addEventListener("click", handleStart);

  // Adiciona listener ao texto também (para facilitar o clique)
  if (content) {
    content.style.cursor = "pointer";
    content.addEventListener("click", handleStart);
  }

  // iOS também responde a touchstart (importante para iOS)
  if (isIOS) {
    btn.addEventListener(
      "touchstart",
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        startRecognition();
      },
      { passive: false }
    );

    if (content) {
      content.addEventListener(
        "touchstart",
        function (event) {
          event.preventDefault();
          event.stopPropagation();
          startRecognition();
        },
        { passive: false }
      );
    }
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  // DOM já está pronto
  initApp();
}

// Função auxiliar para abrir Google e ChatGPT simultaneamente
function openGoogleAndChatGPT(query) {
  if (query && query.length > 1) {
    // Abre Google com a busca
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      "_blank"
    );
    // Abre ChatGPT
    window.open("https://chat.openai.com", "_blank");
    content.textContent = `Buscando: ${query}`;
  } else {
    // Se não tem query, apenas abre ambos
    window.open("https://www.google.com", "_blank");
    window.open("https://chat.openai.com", "_blank");
    content.textContent = "Abrindo Google e ChatGPT...";
  }
}

function takeCommand(message) {
  // Normaliza a mensagem para comparação rápida
  const msg = message.trim().toLowerCase();
  const cleanMessage = msg;

  // Comandos específicos para apenas ChatGPT
  if (
    msg.includes("abrir chatgpt") ||
    msg.includes("abrir gpt") ||
    msg === "chatgpt" ||
    msg === "gpt"
  ) {
    window.open("https://chat.openai.com", "_blank");
    content.textContent = "Abrindo ChatGPT...";
    return;
  }

  // Comandos específicos para apenas Google
  if (msg === "google" || msg === "abrir google") {
    window.open("https://www.google.com", "_blank");
    content.textContent = "Abrindo Google...";
    return;
  }

  // YouTube - apenas YouTube
  if (msg.includes("youtube") || msg.includes("vídeo")) {
    let videoQuery = cleanMessage.replace(/youtube|vídeo|video/gi, "").trim();
    if (videoQuery) {
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(
          videoQuery
        )}`,
        "_blank"
      );
      content.textContent = `Buscando no YouTube: ${videoQuery}`;
    } else {
      window.open("https://youtube.com", "_blank");
      content.textContent = "Abrindo YouTube...";
    }
    return;
  }

  // Wikipedia - apenas Wikipedia
  if (msg.includes("wikipedia") || msg.includes("wikipédia")) {
    let wikiQuery = cleanMessage.replace(/wikipedia|wikipédia/gi, "").trim();
    if (wikiQuery) {
      window.open(
        `https://pt.wikipedia.org/wiki/${encodeURIComponent(wikiQuery)}`,
        "_blank"
      );
      content.textContent = `Abrindo Wikipedia: ${wikiQuery}`;
    } else {
      window.open("https://pt.wikipedia.org", "_blank");
      content.textContent = "Abrindo Wikipedia...";
    }
    return;
  }

  // Comandos de informação - resposta rápida (sem abrir sites)
  if (msg.includes("hora") || msg.includes("horas")) {
    const time = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    content.textContent = `São ${time}`;
    speak(`São ${time}`);
    return;
  }

  if (msg.includes("data") || msg.includes("dia")) {
    const date = new Date().toLocaleDateString("pt-BR");
    content.textContent = `Hoje é ${date}`;
    speak(`Hoje é ${date}`);
    return;
  }

  // Para TODOS os outros comandos: abre Google E ChatGPT simultaneamente
  // Remove palavras comuns de comando para extrair a busca
  let searchQuery = cleanMessage
    .replace(
      /chatgpt|chat gpt|gpt|google|pesquisar|buscar|procurar|o que é|quem é|como|onde|ia|inteligência artificial|assistente ia|perguntar para|falar com|hey|hello|olá|oi|abrir|abre|mostrar|mostra|falar|dizer/gi,
      ""
    )
    .trim();

  // Se tem uma query de busca, usa ela; senão usa a mensagem completa
  if (searchQuery && searchQuery.length > 1) {
    openGoogleAndChatGPT(searchQuery);
  } else if (cleanMessage.length > 1) {
    // Usa a mensagem completa como busca
    openGoogleAndChatGPT(cleanMessage);
  } else {
    // Se não tem nada, apenas abre ambos
    openGoogleAndChatGPT("");
  }
}
