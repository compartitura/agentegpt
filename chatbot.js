// chatbot.js
;(function() {
  const avatarUrl = "https://www.compartitura.org/medias/images/captura-12.jpg";
  const isMobile = window.innerWidth <= 600;

  // 1) Estilos
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse {
      0% { box-shadow: 0 0 0 4px rgba(37,211,102,0.8); }
      50% { box-shadow: 0 0 0 12px rgba(37,211,102,0.4); }
      100% { box-shadow: 0 0 0 4px rgba(37,211,102,0.8); }
    }
    #chatbot-toggle {
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
        : "bottom:100px; right:20px; width:360px; height:460px; border-radius:12px;"}
      background: white; border:1px solid #ccc;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      display: ${isMobile ? "block" : "none"};
      font-family: sans-serif; z-index:9999;
    }
    #chatbot-header {
      display:flex; align-items:center; padding:10px;
      background:#075E54; color:white; flex-shrink:0;
    }
    #chatbot-header img {
      width:32px; height:32px; border-radius:50%; margin-right:8px;
    }
    #chatbot-header h4 { margin:0; flex:1; font-size:16px; }
    #chatbot-close { background:transparent; border:none; color:white; font-size:18px; cursor:pointer; }
    #chatbot-messages {
      position:absolute; top:48px; bottom:${isMobile?"80px":"48px"};
      left:0; right:0; padding:10px; overflow-y:auto; background:#e5ddd5;
    }
    .chat-message { margin-bottom:10px; }
    .chat-message.user { text-align:right; }
    .chat-bubble {
      display:inline-block; padding:12px; border-radius:16px;
      background:#fff; position:relative; max-width:80%;
      box-shadow:0 1px 3px rgba(0,0,0,0.1);
    }
    .chat-message.user .chat-bubble { background:#dcf8c6; }
    .chat-bubble a {
      display:inline-block; background:#000; color:#fff;
      padding:4px 8px; border-radius:4px; text-decoration:none; margin-top:6px;
    }
    .chat-bubble a:hover { opacity:0.8; }
    #chatbot-input {
      position:absolute; bottom:0; left:0; width:100%;
      box-sizing:border-box; padding:12px; font-size:16px;
      border:none; border-top:1px solid #ccc; outline:none;
      height:80px;
    }
  `;
  document.head.appendChild(style);

  // 2) Inyectar HTML
  document.body.insertAdjacentHTML("beforeend", `
    <div id="chatbot-toggle"></div>
    <div id="chatbot">
      <div id="chatbot-header">
        <img src="${avatarUrl}" alt="Agente" />
        <h4>Agente de Compartitura</h4>
        ${isMobile ? "" : `<button id="chatbot-close">✕</button>`}
      </div>
      <div id="chatbot-messages"></div>
      <textarea id="chatbot-input" placeholder="Escribe tu mensaje..."></textarea>
    </div>
  `);

  // 3) Referencias
  const toggle = document.getElementById("chatbot-toggle");
  const bot = document.getElementById("chatbot");
  const closeBtn = document.getElementById("chatbot-close");
  const msgs = document.getElementById("chatbot-messages");
  const input = document.getElementById("chatbot-input");

  // 4) Mostrar siempre en móvil; toggle en desktop
  if (isMobile) {
    bot.style.display = "flex";
  } else {
    toggle.onclick = () => bot.style.display = "flex";
    closeBtn.onclick = () => bot.style.display = "none";
  }

  // 5) Añadir mensaje
  function addMessage(html, user = false) {
    const div = document.createElement("div");
    div.className = "chat-message " + (user ? "user" : "agent");
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.innerHTML = html;
    div.appendChild(bubble);
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }
  addMessage("Hola, ¿te puedo ayudar?");

  // 6) Enviar con Enter
  input.addEventListener("keypress", async e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      addMessage(q, true);
      input.value = "";

      // indicador
      const load = document.createElement("div");
      load.className = "chat-message agent";
      load.innerHTML = `<div class="chat-bubble">...</div>`;
      msgs.appendChild(load);
      msgs.scrollTop = msgs.scrollHeight;

      // búsqueda productos
      let handled = false;
      try {
        const resp = await fetch(`/products/search?q=${encodeURIComponent(q)}`);
        if (resp.ok) {
          const { products } = await resp.json();
          if (products.length) {
            products.forEach(p =>
              addMessage(
                `<img src="${p.image}" width="40" style="vertical-align:middle;border-radius:4px;margin-right:8px;"/>` +
                `<a href="${p.referido}" target="_blank">${p.name}</a>`
              )
            );
            handled = true;
          }
        }
      } catch {}

      // fallback ChatGPT
      if (!handled) {
        let reply = "Lo siento, no tengo respuesta.";
        try {
          const res = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: q })
          });
          const data = await res.json();
          reply = data.reply || data.error || reply;
        } catch {
          reply = "Error de conexión.";
        }
        addMessage(reply);
      }
      load.remove();
    }
  });
})();
