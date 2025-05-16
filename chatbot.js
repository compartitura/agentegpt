// chatbot.js
;(function() {
  const avatarUrl = "https://www.compartitura.org/medias/images/captura-12.jpg";
  const isMobile  = window.innerWidth <= 600;

  // 1) Estilos
  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing:border-box; margin:0; padding:0; }
    @keyframes pulse {
      0%,100% { box-shadow:0 0 0 4px rgba(37,211,102,0.8); }
      50%    { box-shadow:0 0 0 12px rgba(37,211,102,0.4); }
    }
    #chatbot-toggle {
      display:${isMobile?"none":"block"};
      position:fixed; bottom:20px; right:20px;
      width:80px; height:80px; border-radius:50%;
      background:url(${avatarUrl}) center/cover no-repeat;
      cursor:pointer; z-index:10000; animation:pulse 2s infinite;
    }
    #chatbot {
      position:fixed;
      ${isMobile
        ? "top:0; left:0; width:100%; height:100%;"
        : "bottom:100px; right:20px; width:360px; height:460px;"}
      background:#fff; border:1px solid #ccc;
      box-shadow:0 4px 8px rgba(0,0,0,0.15);
      display:${isMobile?"flex":"none"};
      flex-direction:column; z-index:9999; font-family:sans-serif;
    }
    #chatbot-header {
      display:flex; align-items:center; padding:10px;
      background:#075E54; color:#fff; flex-shrink:0;
    }
    #chatbot-header img { width:32px; height:32px; border-radius:50%; margin-right:8px; }
    #chatbot-header h4 { flex:1; font-size:16px; }
    #chatbot-close { background:transparent; border:none; color:#fff; font-size:18px; cursor:pointer; }
    #chatbot-messages {
      flex:1; padding:10px; overflow-y:auto; background:#e5ddd5;
    }
    .chat-message { margin-bottom:10px; }
    .chat-message.user { justify-content:flex-end; display:flex; }
    .chat-bubble {
      display:inline-block; max-width:80%; padding:12px; border-radius:16px;
      background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.1); word-wrap:break-word;
    }
    .chat-message.user .chat-bubble { background:#dcf8c6; }
    .chat-bubble a {
      display:inline-block; margin-top:6px;
      background:#000; color:#fff; padding:4px 8px; border-radius:4px;
      text-decoration:none;
    }
    .chat-bubble a:hover { opacity:0.8; }
    #chatbot-input {
      flex-shrink:0; width:100%; height:60px;
      border:none; border-top:1px solid #ccc; padding:12px;
      font-size:16px; resize:none; outline:none;
    }
  `;
  document.head.appendChild(style);

  // 2) Inyectar HTML
  document.body.insertAdjacentHTML("beforeend", `
    <div id="chatbot-toggle"></div>
    <div id="chatbot">
      <div id="chatbot-header">
        <img src="${avatarUrl}" alt="Cecilia"/>
        <h4>Agente Cecilia</h4>
        ${isMobile?"":`<button id="chatbot-close">✕</button>`}
      </div>
      <div id="chatbot-messages"></div>
      <textarea id="chatbot-input" placeholder="¿Qué necesitas?" rows="2"></textarea>
    </div>
  `);

  // 3) Referencias
  const toggle   = document.getElementById("chatbot-toggle");
  const bot      = document.getElementById("chatbot");
  const closeBtn = document.getElementById("chatbot-close");
  const msgs     = document.getElementById("chatbot-messages");
  const input    = document.getElementById("chatbot-input");

  // 4) Mostrar/ocultar
  if (isMobile) {
    bot.style.display = "flex";
  } else {
    toggle.onclick = () => bot.style.display = "flex";
    closeBtn && (closeBtn.onclick = () => bot.style.display = "none");
  }

  // 5) Añadir mensaje
  function addMessage(html, user=false) {
    const div    = document.createElement("div");
    div.className = "chat-message " + (user?"user":"agent");
    const bub   = document.createElement("div");
    bub.className = "chat-bubble";
    bub.innerHTML = html;
    div.appendChild(bub);
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }
  addMessage("Hola, ¿en qué puedo ayudarte?");

  // 6) Lógica de envío
  input.addEventListener("keypress", async e => {
    if (e.key==="Enter" && !e.shiftKey) {
      e.preventDefault();
      const q = input.value.trim(); if(!q) return;
      addMessage(q, true); input.value="";

      const loading = document.createElement("div");
      loading.className="chat-message agent";
      loading.innerHTML=`<div class="chat-bubble">...</div>`;
      msgs.appendChild(loading); msgs.scrollTop=msgs.scrollHeight;

      // Busca productos
      let handled=false;
      try {
        const resp = await fetch(`/products/search?q=${encodeURIComponent(q)}`);
        if(resp.ok){
          const {products} = await resp.json();
          if(products.length){
            products.forEach(p=>addMessage(
              `<img src="${p.image}" width="40" style="vertical-align:middle;border-radius:4px;margin-right:8px;"/>`+
              `<a href="${p.url}" target="_blank">${p.name}</a>`
            ));
            handled=true;
          }
        }
      }catch{}

      // Fallback a ChatGPT
      if(!handled){
        let reply="Lo siento, no tengo respuesta.";
        try{
          const res=await fetch("/chat",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({message:q})
          });
          const d=await res.json();
          reply=d.reply||d.error||reply;
        }catch{reply="Error de conexión.";}
        addMessage(reply);
      }

      loading.remove();
    }
  });
})();
