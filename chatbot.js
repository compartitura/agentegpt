// chatbot.js
;(function() {
  const avatarUrl = "https://www.compartitura.org/medias/images/captura-12.jpg";
  const isMobile = window.innerWidth <= 600;

  // Inyectar estilos
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse {
      0% { box-shadow: 0 0 0 4px rgba(37,211,102,0.8); }
      50% { box-shadow: 0 0 0 12px rgba(37,211,102,0.4); }
      100% { box-shadow: 0 0 0 4px rgba(37,211,102,0.8); }
    }
    #chat-avatar {
      display: ${isMobile ? "none" : "block"};
      position: fixed; bottom:20px; right:20px;
      width:80px; height:80px; border-radius:50%;
      background: url(${avatarUrl}) center/cover no-repeat;
      cursor:pointer; z-index:10000;
      animation: pulse 2s ease-in-out infinite;
    }
    #chatbot {
      position: fixed;
      ${isMobile
        ? "top:0; left:0; width:100vw; height:100vh; border-radius:0;"
        : "bottom:110px; right:20px; width:360px; height:460px; border-radius:12px;"}
      background: white;
      border: 1px solid #ccc;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      font-family: sans-serif;
      z-index: 9999;
    }
    #chat-header { display: flex; align-items: center; padding: 8px; background: #075E54; color: white; flex-shrink: 0; }
    #chat-header img { width:40px; height:40px; border-radius:50%; margin-right:8px; box-shadow:0 0 0 2px #075E54; }
    #chat-header h4 { margin:0; flex:1; font-size:16px; }
    #chat-header button { background:transparent; border:none; color:white; font-size:18px; cursor:pointer; }
    #chat-output { flex: 1 1 auto; padding:12px; overflow-y:auto; background:#e5ddd5; }
    .chat-message { display:flex; margin-bottom:12px; }
    .chat-message.user { justify-content:flex-end; }
    .chat-bubble { max-width:85%; padding:14px; border-radius:16px; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.1); position:relative; }
    .chat-message.user .chat-bubble { background:#dcf8c6; }
    .chat-message.agent .chat-bubble::before { content:''; position:absolute; top:12px; left:-8px; border-width:8px; border-style:solid; border-color:transparent #ffffff transparent transparent; }
    .chat-bubble a { display:inline-block; background:#000; color:#fff; padding:4px 8px; border-radius:4px; text-decoration:none; margin-top:6px; }
    .chat-bubble a:hover { opacity:0.8; }
    #chat-input {
      border:none; border-top:1px solid #ccc; padding:12px; font-size:16px; outline:none; width:100%; box-sizing:border-box;
      flex-shrink: 0; height:70px; display:block;
    }
  `;
  document.head.appendChild(style);

  // Inyectar HTML con rows en textarea
  const html = `
    <div id="chat-avatar"></div>
    <div id="chatbot">
      <div id="chat-header">
        <img src="${avatarUrl}" alt="Agente" />
        <h4>Agente de Compartitura</h4>
        ${isMobile ? "" : `<button id="close-btn">✕</button>`}
      </div>
      <div id="chat-output"></div>
      <textarea id="chat-input" rows="2" placeholder="Escribe tu mensaje..."></textarea>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  const avatar = document.getElementById("chat-avatar");
  const chatbox = document.getElementById("chatbot");
  const closeBtn = document.getElementById("close-btn");
  const chatOutput = document.getElementById("chat-output");
  const chatInput = document.getElementById("chat-input");

  // Saludo inicial
  function addMessage(html, user=false) {
    const msg = document.createElement("div");
    msg.className = `chat-message ${user ? 'user' : 'agent'}`;
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.innerHTML = html;
    msg.appendChild(bubble);
    chatOutput.appendChild(msg);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }
  addMessage("Hola, ¿te puedo ayudar?");

  // Mostrar chat by default on mobile
  if (isMobile) {
    chatbox.style.display = "flex";
  }

  // Mostrar/ocultar por click en avatar (desktop)
  avatar.onclick = () => chatbox.style.display = "flex";
  if (closeBtn) closeBtn.onclick = () => chatbox.style.display = "none";

  // Manejo de Enter
  chatInput.addEventListener("keypress", async e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const q = chatInput.value.trim(); if (!q) return;
      addMessage(q, true);
      chatInput.value = "";
      const loading = document.createElement("div");
      loading.className = "chat-message agent";
      loading.innerHTML = `<div class='chat-bubble'>...</div>`;
      chatOutput.appendChild(loading);
      chatOutput.scrollTop = chatOutput.scrollHeight;

      let handled = false;
      try {
        const resp = await fetch(`/products/search?q=${encodeURIComponent(q)}`);
        if (resp.ok) {
          const { products } = await resp.json();
          if (products.length) {
            products.forEach(p => addMessage(
              `<img src="${p.image}" width="40" style="vertical-align:middle;border-radius:4px;margin-right:8px;"/>` +
              `<a href="${p.url}">${p.name}</a>`
            ));
            handled = true;
          }
        }
      } catch {}

      if (!handled) {
        let reply = "Lo siento, no tengo respuesta.";
        try {
          const res = await fetch("/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q }) });
          const data = await res.json(); reply = data.reply || data.error || reply;
        } catch { reply = "Error de conexión."; }
        addMessage(reply);
      }

      loading.remove();
    }
  });
})();
