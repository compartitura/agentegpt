// chatbot.js
;(function() {
  const avatarUrl = "https://www.compartitura.org/medias/images/captura-12.jpg";
  const isMobile = window.innerWidth <= 600;

  // Estilos resumidos...
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse { /* ... */ }
    #chat-avatar { /* ... */ }
    #chatbot { /* ... */ }
    /* ...resto de estilos exactamente como tenías... */
  `;
  document.head.appendChild(style);

  // HTML
  const html = `
    <div id="chat-avatar"></div>
    <div id="chatbot">
      <div id="chat-header">
        <img src="${avatarUrl}" alt="Agente"/>
        <h4>Agente de Compartitura</h4>
        ${isMobile ? "" : `<button id="close-btn">✕</button>`}
      </div>
      <div id="chat-output"></div>
      <textarea id="chat-input" placeholder="Escribe tu mensaje..."></textarea>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  // Referencias
  const avatar = document.getElementById("chat-avatar");
  const chatbox = document.getElementById("chatbot");
  const closeBtn = document.getElementById("close-btn");
  const chatOutput = document.getElementById("chat-output");
  const chatInput = document.getElementById("chat-input");

  // Saludo inicial
  function addMessage(html, user = false) {
    const msg = document.createElement("div");
    msg.className = `chat-message ${user ? "user" : "agent"}`;
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.innerHTML = html;
    msg.appendChild(bubble);
    chatOutput.appendChild(msg);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }
  addMessage("Hola, ¿qué producto deseas ver?");

  // Mostrar siempre en móvil, avatar en desktop
  if (isMobile) chatbox.style.display = "flex";
  else {
    avatar.onclick = () => chatbox.style.display = "flex";
    if (closeBtn) closeBtn.onclick = () => chatbox.style.display = "none";
  }

  // Envío de mensajes
  chatInput.addEventListener("keypress", async e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const q = chatInput.value.trim();
      if (!q) return;
      addMessage(q, true);
      chatInput.value = "";

      // Indicador
      const loading = document.createElement("div");
      loading.className = "chat-message agent";
      loading.innerHTML = `<div class="chat-bubble">...</div>`;
      chatOutput.appendChild(loading);
      chatOutput.scrollTop = chatOutput.scrollHeight;

      // Intento de rule-based productos
      let handled = false;
      try {
        const resp = await fetch(`/products/search?q=${encodeURIComponent(q)}`);
        if (resp.ok) {
          const { products } = await resp.json();
          if (products.length) {
            products.forEach(p => {
              addMessage(
                `<img src="${p.image}" width="40" style="vertical-align:middle;border-radius:4px;margin-right:8px;" />` +
                `<a href="${p.referido}" target="_blank">${p.name}</a>`
              );
            });
            handled = true;
          }
        }
      } catch {}

      // Fallback a ChatGPT
      if (!handled) {
        let reply = "Lo siento, no tengo una sugerencia.";
        try {
          const res = await fetch("/chat", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ message: q })
          });
          const data = await res.json();
          reply = data.reply || data.error || reply;
        } catch {
          reply = "Error de conexión.";
        }
        addMessage(reply);
      }
      loading.remove();
    }
  });
})();
