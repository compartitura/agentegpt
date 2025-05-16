// chatbot.js
;(function() {
  const avatarUrl = "https://www.compartitura.org/medias/images/cecilia.png";
  const isMobile = window.innerWidth <= 600;

  // 1) Inyectar estilos con animaciones
  const style = document.createElement("style");
  style.textContent = `
    @keyframes wave {
      0% { box-shadow: 0 0 0 4px rgba(7,123,67,0.8); }
      50% { box-shadow: 0 0 0 8px rgba(7,123,67,0.4); }
      100% { box-shadow: 0 0 0 4px rgba(7,123,67,0.8); }
    }
    #chat-avatar {
      position: fixed; bottom:20px; right:20px;
      width:50px; height:50px; border-radius:50%; cursor:pointer;
      box-shadow: 0 0 0 4px rgba(7,123,67,0.8);
      animation: wave 2s ease-in-out infinite;
      z-index:10000;
    }
    #chat-avatar.animate { animation-play-state: running; }
    #chat-avatar:not(.animate) { animation-play-state: paused; }
    #chat-tooltip {
      position: fixed; bottom:80px; right:20px;
      background:#075E54; color:white;
      padding:8px 12px; border-radius:12px;
      font-size:14px; opacity:1;
      transition: opacity 0.5s ease;
      z-index:10001;
    }
    #chatbot {
      position: fixed;
      ${isMobile ? "top:0; left:0; width:100vw; height:100vh; border-radius:0;" : "bottom:80px; right:20px; width:340px; height:420px; border-radius:12px;"}
      background:white; border:1px solid #ccc;
      box-shadow:0 4px 8px rgba(0,0,0,0.15);
      display:none; flex-direction:column;
      font-family:sans-serif; z-index:9999;
    }
    #chat-header {
      display:flex; align-items:center;
      padding:10px; background:#075E54; color:white;
    }
    #chat-header img {
      width:32px; height:32px; border-radius:50%;
      margin-right:8px; box-shadow:0 0 0 2px #075E54;
    }
    #chat-header h4 { margin:0; flex:1; font-size:18px; }
    #chat-header button { background:transparent; border:none; color:white; font-size:18px; cursor:pointer; }
    #chat-output {
      flex:1; padding:12px; overflow-y:auto; background:#e5ddd5;
    }
    .chat-message { display:flex; margin-bottom:12px; }
    .chat-message.user { justify-content:flex-end; }
    .chat-bubble {
      max-width:85%; padding:14px; border-radius:16px;
      line-height:1.4; word-wrap:break-word;
      background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.1);
      position:relative;
    }
    .chat-message.user .chat-bubble { background:#dcf8c6; }
    .chat-message.agent .chat-bubble::before {
      content:''; position:absolute; top:10px; left:-8px;
      border-width:8px; border-style:solid;
      border-color:transparent #ffffff transparent transparent;
    }
    .chat-bubble a {
      display:inline-block; background:#000; color:#fff;
      padding:4px 8px; border-radius:4px;
      text-decoration:none; margin-top:6px;
    }
    .chat-bubble a:hover { opacity:0.8; }
    #chat-input {
      border:none; border-top:1px solid #ccc;
      padding:12px; font-size:16px; resize:none; outline:none;
      ${isMobile ? "height:70px;" : ""}
    }
  `;
  document.head.appendChild(style);

  // 2) Inyectar HTML
  const html = `
    <img id="chat-avatar" src="${avatarUrl}" alt="Avatar" />
    <div id="chat-tooltip">Hola, ¿te puedo ayudar?</div>
    <div id="chatbot">
      <div id="chat-header">
        <img src="${avatarUrl}" alt="Agent" />
        <h4>Agente de Compartitura</h4>
        <button id="reset-btn">✕</button>
      </div>
      <div id="chat-output"></div>
      <textarea id="chat-input" rows="2" placeholder="Escribe tu mensaje..."></textarea>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  const avatar = document.getElementById("chat-avatar");
  const tooltip = document.getElementById("chat-tooltip");
  const chatbox = document.getElementById("chatbot");
  const resetBtn = document.getElementById("reset-btn");
  const chatOutput = document.getElementById("chat-output");
  const chatInput = document.getElementById("chat-input");

  // Animación halo y tooltip
  avatar.classList.add("animate");
  setTimeout(() => {
    avatar.classList.remove("animate");
    tooltip.style.opacity = "0";
    setTimeout(() => tooltip.remove(), 500);
  }, 5000);

  // Abrir chat al primer click
  avatar.addEventListener("click", () => {
    chatbox.style.display = "flex";
    if (tooltip) tooltip.remove();
  }, { once: true });

  // Cerrar chat
  resetBtn.addEventListener("click", () => {
    chatOutput.innerHTML = "";
    chatInput.value = "";
    chatbox.style.display = "none";
  });

  // Función agregar mensaje
  function addMessage(text, user=false) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${ user ? 'user' : 'agent'}`;
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.innerHTML = text;
    msgDiv.appendChild(bubble);
    chatOutput.appendChild(msgDiv);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  // Manejo de input
  chatInput.addEventListener("keypress", async e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;
      addMessage(message, true);
      chatInput.value = "";

      // Indicador escritura
      const loading = document.createElement("div");
      loading.className = "chat-message agent";
      loading.innerHTML = "<div class='chat-bubble'>...</div>";
      chatOutput.appendChild(loading);
      chatOutput.scrollTop = chatOutput.scrollHeight;

      // Llamada API
      let response, data;
      try {
        response = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message })
        });
        data = await response.json();
      } catch {
        data = { error: "Error conexión." };
      }
      loading.remove();

      if (!response || !response.ok) {
        addMessage(`<strong>Error:</strong> ${ data.error || data.reply }`);
      } else {
        addMessage(data.reply || "Lo siento, no tengo respuesta.");
      }
    }
  });
})();
