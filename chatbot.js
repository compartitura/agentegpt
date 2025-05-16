// chatbot.js
;(function() {
  const avatarUrl = "https://www.compartitura.org/medias/images/cecilia.png";
  const isMobile = window.innerWidth <= 600;

  // Inyecta estilos mínimos (puedes añadir animaciones como antes)
  const style = document.createElement("style");
  style.textContent = `
    #chat-avatar { position:fixed; bottom:20px; right:20px;
      width:80px; height:80px; border-radius:50%; cursor:pointer;
      box-shadow:0 0 0 4px #007bff; z-index:10000; }
    #chatbot { position:fixed;
      ${isMobile
        ? "top:0; left:0; width:100vw; height:100vh; border-radius:0;"
        : "bottom:110px; right:600px; width:320px; height:400px; border-radius:12px;"}
      background:white; border:1px solid #ccc; display:none;
      flex-direction:column; font-family:sans-serif; z-index:9999; }
    #chat-header { display:flex; align-items:center;
      padding:8px; background:#007bff; color:white; }
    #chat-header img { width:32px; height:32px; border-radius:50%; margin-right:8px; }
    #chat-header h4 { margin:0; flex:1; font-size:16px; }
    #chat-header button { background:transparent; border:none; color:white; cursor:pointer; }
    #chat-output { flex:1; padding:8px; overflow-y:auto; background:#e5ddd5; }
    .chat-message { margin-bottom:8px; }
    .chat-message.user { text-align:right; }
    .chat-bubble { display:inline-block; padding:8px; border-radius:12px;
      background:#ffffff; box-shadow:0 1px 2px rgba(0,0,0,0.1); }
    .chat-message.user .chat-bubble { background:#dcf8c6; }
    .chat-bubble a { display:inline-block; background:#000; color:#fff;
      padding:4px 8px; border-radius:4px; text-decoration:none; margin-top:4px; }
    .chat-bubble a:hover { opacity:0.8; }
    #chat-input { border:none; border-top:1px solid #ccc; padding:8px; width:100%;
      box-sizing:border-box; }
  `;
  document.head.appendChild(style);

  // Inserta HTML
  const html = `
    <img id="chat-avatar" src="${avatarUrl}" alt="Avatar"/>
    <div id="chatbot">
      <div id="chat-header">
        <img src="${avatarUrl}" alt="Agent"/>
        <h4>Agente de Compartitura</h4>
        <button id="reset-btn">✕</button>
      </div>
      <div id="chat-output">
        <div class="chat-message agent"><div class="chat-bubble">Hola, ¿en qué producto estás interesado?</div></div>
      </div>
      <textarea id="chat-input" rows="2" placeholder="Escribe tu búsqueda..."></textarea>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  const avatar = document.getElementById("chat-avatar");
  const chatbox = document.getElementById("chatbot");
  const resetBtn = document.getElementById("reset-btn");
  const chatOutput = document.getElementById("chat-output");
  const chatInput = document.getElementById("chat-input");

  // Mostrar/ocultar
  avatar.onclick = () => chatbox.style.display = "flex";
  resetBtn.onclick = () => {
    chatOutput.innerHTML = `<div class="chat-message agent"><div class="chat-bubble">Hola, ¿en qué producto estás interesado?</div></div>`;
    chatInput.value = "";
    chatbox.style.display = "none";
  };

  // Añade mensaje
  function addMessage(text, user=false) {
    const div = document.createElement("div");
    div.className = "chat-message " + (user?"user":"agent");
    const span = document.createElement("div");
    span.className = "chat-bubble";
    span.innerHTML = text;
    div.appendChild(span);
    chatOutput.appendChild(div);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  // Al presionar Enter
  chatInput.addEventListener("keypress", async e => {
    if (e.key==="Enter" && !e.shiftKey) {
      e.preventDefault();
      const q = chatInput.value.trim();
      if (!q) return;
      addMessage(q,true);
      chatInput.value="";

      // Intento búsqueda de productos
      try {
        const resp = await fetch(`/products/search?q=${encodeURIComponent(q)}`);
        const { products } = await resp.json();
        if (products.length) {
          products.forEach(p=>{
            addMessage(`${p.name}<br><a href="${p.url}">Ver producto</a>`);
          });
          return;
        }
      } catch{}

      // Si no hay producto, fallback a ChatGPT
      const loading = document.createElement("div");
      loading.className="chat-message agent";
      loading.innerHTML=`<div class="chat-bubble">...</div>`;
      chatOutput.appendChild(loading);
      chatOutput.scrollTop = chatOutput.scrollHeight;

      let reply="Lo siento, no tengo respuesta.";
      try {
        const res = await fetch("/chat", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ message:q })
        });
        const { reply: r, error } = await res.json();
        reply = r || error || reply;
      } catch {
        reply="Error de conexión al servidor.";
      }
      loading.remove();
      setTimeout(()=>addMessage(reply),300);
    }
  });
})();
