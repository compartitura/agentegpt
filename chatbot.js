// chatbot.js
;(function() {
  const avatarUrl = "https://www.compartitura.org/medias/images/captura-12.jpg";
  const isMobile = window.innerWidth <= 600;

  // Estilos básicos + burbuja grande + bocadillo
  const style = document.createElement("style");
  style.textContent = `
    #chat-avatar { position:fixed; bottom:20px; right:20px;
      width:80px; height:80px; border-radius:50%; cursor:pointer;
      box-shadow:0 0 0 4px #007bff; z-index:10000; }
    #chatbot { position:fixed;
      ${isMobile
        ? "top:0; left:0; width:100vw; height:100vh; border-radius:0;"
        : "bottom:110px; right:600px; width:360px; height:440px; border-radius:12px;"}
      background:white; border:1px solid #ccc; display:none;
      flex-direction:column; font-family:sans-serif; z-index:9999; }
    #chat-header { display:flex; align-items:center;
      padding:8px; background:#075E54; color:white; }
    #chat-header img { width:32px; height:32px; border-radius:50%; margin-right:8px;
      box-shadow:0 0 0 2px #075E54; }
    #chat-header h4 { margin:0; flex:1; font-size:16px; }
    #chat-header button { background:transparent; border:none; color:white; cursor:pointer; }
    #chat-output { flex:1; padding:12px; overflow-y:auto; background:#e5ddd5; }
    .chat-message { display:flex; margin-bottom:12px; }
    .chat-message.user { justify-content:flex-end; }
    .chat-bubble { max-width:85%; padding:14px; border-radius:16px;
      background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.1); position:relative; }
    .chat-message.user .chat-bubble { background:#dcf8c6; }
    .chat-message.agent .chat-bubble::before {
      content:''; position:absolute; top:12px; left:-8px;
      border-width:8px; border-style:solid;
      border-color:transparent #ffffff transparent transparent;
    }
    .chat-bubble a { display:inline-block; background:#000; color:#fff;
      padding:4px 8px; border-radius:4px; text-decoration:none; margin-top:6px; }
    .chat-bubble a:hover { opacity:0.8; }
    #chat-input { border:none; border-top:1px solid #ccc; padding:12px;
      font-size:14px; resize:none; outline:none; width:100%; box-sizing:border-box; }
  `;
  document.head.appendChild(style);

  // HTML
  const html = `
    <img id="chat-avatar" src="${avatarUrl}" alt="Avatar"/>
    <div id="chatbot">
      <div id="chat-header">
        <img src="${avatarUrl}" alt="Agent"/>
        <h4>Agente de Compartitura</h4>
        <button id="close-btn">✕</button>
      </div>
      <div id="chat-output">
        <div class="chat-message agent">
          <div class="chat-bubble">Hola, ¿qué producto o partitura buscas?</div>
        </div>
      </div>
      <textarea id="chat-input" rows="2" placeholder="Escribe tu búsqueda..."></textarea>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  // Referencias
  const avatar = document.getElementById("chat-avatar");
  const chatbox = document.getElementById("chatbot");
  const closeBtn = document.getElementById("close-btn");
  const chatOutput = document.getElementById("chat-output");
  const chatInput = document.getElementById("chat-input");

  // Mostrar/ocultar
  avatar.onclick = () => chatbox.style.display = "flex";
  closeBtn.onclick = () => chatbox.style.display = "none";

  // Añade mensaje
  function addMessage(html, user=false) {
    const msg = document.createElement("div");
    msg.className = `chat-message ${user?"user":"agent"}`;
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.innerHTML = html;
    msg.appendChild(bubble);
    chatOutput.appendChild(msg);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  // Enter => buscar
  chatInput.addEventListener("keypress", async e => {
    if (e.key==="Enter" && !e.shiftKey) {
      e.preventDefault();
      const q = chatInput.value.trim();
      if (!q) return;
      addMessage(q, true);
      chatInput.value="";

      // Indicator
      const load = document.createElement("div");
      load.className="chat-message agent";
      load.innerHTML=`<div class="chat-bubble">...</div>`;
      chatOutput.appendChild(load);
      chatOutput.scrollTop = chatOutput.scrollHeight;

      // Lógica: busca productos primero
      let handled=false;
      try {
        const resp = await fetch(`/products/search?q=${encodeURIComponent(q)}`);
        if (resp.ok) {
          const { products } = await resp.json();
          if (products.length) {
            products.forEach(p=>{
              addMessage(
                `<img src="${p.image}" width="40" style="vertical-align:middle;margin-right:8px;border-radius:4px;" />`+
                `<a href="${p.url}">${p.name}</a>`
              );
            });
            handled=true;
          }
        }
      } catch{}

      // fallback OpenAI
      let reply="";
      if (!handled) {
        try {
          const res = await fetch("/chat", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({ message:q })
          });
          const data = await res.json();
          reply = data.reply || "Lo siento, no tengo respuesta.";
        } catch {
          reply="Error de conexión.";
        }
        addMessage(reply);
      }
      load.remove();
    }
  });
})();
