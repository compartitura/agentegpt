// chatbot.js ;(function() { const avatarUrl = "https://www.compartitura.org/medias/images/captura-12.jpg";

// Crear estilos const style = document.createElement('style'); style.textContent = /* Chatbot general */ #chatbot-container { position: fixed; bottom: 0; right: 0; left: 0; top: 0; display: none; flex-direction: column; background: white; z-index: 10000; } /* Cabecera */ #chatbot-header { display: flex; align-items: center; padding: 10px; background: #075E54; color: white; flex-shrink: 0; } #chatbot-header img { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; } #chatbot-header h4 { margin: 0; font-size: 18px; flex: 1; } #chatbot-close { background: transparent; border: none; color: white; font-size: 20px; cursor: pointer; } /* Área de mensajes */ #chatbot-messages { flex: 1; padding: 10px; overflow-y: auto; background: #e5ddd5; } .chat-message { margin-bottom: 10px; display: flex; } .chat-message.user { justify-content: flex-end; } .chat-bubble { max-width: 80%; padding: 12px; border-radius: 16px; background: #fff; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.1); } .chat-message.user .chat-bubble { background: #dcf8c6; } .chat-message.agent .chat-bubble::before { content: ''; position: absolute; top: 12px; left: -8px; border-width: 8px; border-style: solid; border-color: transparent #ffffff transparent transparent; } .chat-bubble a { display: inline-block; background: #000; color: #fff; padding: 4px 8px; border-radius: 4px; text-decoration: none; margin-top: 6px; } .chat-bubble a:hover { opacity: 0.8; } /* Input fijo */ #chatbot-input-container { padding: 10px; border-top: 1px solid #ccc; flex-shrink: 0; background: #f9f9f9; } #chatbot-input { width: 100%; box-sizing: border-box; padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 8px; resize: none; } /* Avatar boton */ #chatbot-toggle { position: fixed; bottom: 20px; right: 20px; width: 80px; height: 80px; background: url(${avatarUrl}) center/cover no-repeat; border-radius: 50%; cursor: pointer; z-index: 10001; box-shadow: 0 0 0 4px rgba(37,211,102,0.8); animation: pulse 2s ease-in-out infinite; } @keyframes pulse { 0% { box-shadow: 0 0 0 4px rgba(37,211,102,0.8); } 50% { box-shadow: 0 0 0 12px rgba(37,211,102,0.4); } 100% { box-shadow: 0 0 0 4px rgba(37,211,102,0.8); } }; document.head.appendChild(style);

// Inyectar HTML const html = <div id="chatbot-toggle"></div> <div id="chatbot-container"> <div id="chatbot-header"> <img src="${avatarUrl}" alt="Agente" /> <h4>Agente de Compartitura</h4> <button id="chatbot-close">✕</button> </div> <div id="chatbot-messages"></div> <div id="chatbot-input-container"> <textarea id="chatbot-input" rows="2" placeholder="Escribe tu mensaje..."></textarea> </div> </div>; document.body.insertAdjacentHTML('beforeend', html);

// Referencias const toggle = document.getElementById('chatbot-toggle'); const container = document.getElementById('chatbot-container'); const closeBtn = document.getElementById('chatbot-close'); const messages = document.getElementById('chatbot-messages'); const input = document.getElementById('chatbot-input');

// Función para añadir mensaje function addMessage(text, isUser = false) { const msgEl = document.createElement('div'); msgEl.className = 'chat-message ' + (isUser ? 'user' : 'agent'); const bubble = document.createElement('div'); bubble.className = 'chat-bubble'; bubble.innerHTML = text; msgEl.appendChild(bubble); messages.appendChild(msgEl); messages.scrollTop = messages.scrollHeight; }

// Saludo inicial addMessage('Hola, ¿te puedo ayudar?');

// Eventos toggle.onclick = () => container.style.display = 'flex'; closeBtn.onclick = () => container.style.display = 'none';

// Enviar mensaje al presionar Enter input.addEventListener('keypress', async e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const q = input.value.trim(); if (!q) return; addMessage(q, true); input.value = '';

// Indicador
  const loading = document.createElement('div');
  loading.className = 'chat-message agent';
  loading.innerHTML = '<div class="chat-bubble">...</div>';
  messages.appendChild(loading);
  messages.scrollTop = messages.scrollHeight;

  // Búsqueda de productos
  let handled = false;
  try {
    const resp = await fetch(`/products/search?q=${encodeURIComponent(q)}`);
    if (resp.ok) {
      const data = await resp.json();
      const { products } = data;
      if (products && products.length) {
        products.forEach(p => {
          addMessage(
            `<img src="${p.image}" width="40" style="vertical-align:middle;border-radius:4px;margin-right:8px;"/>` +
            `<a href="${p.referido}" target="_blank">${p.name}</a>`
          );
        });
        handled = true;
      }
    }
  } catch {}

  if (!handled) {
    let reply = 'Lo siento, no tengo respuesta.';
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });
      const rdata = await res.json();
      reply = rdata.reply || rdata.error || reply;
    } catch {
      reply = 'Error de conexión.';
    }
    addMessage(reply);
  }

  loading.remove();
}

}); })();

