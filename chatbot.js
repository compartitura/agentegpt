// chatbot.js
;(function() {
  // 0) URL de tu avatar
  const avatarUrl = "https://www.compartitura.org/medias/images/cecilia.png";

  // Detectar si es móvil (ancho <= 600px)
  const isMobile = window.innerWidth <= 600;

  // 1) Inyectar estilos
  const style = document.createElement('style');
  style.textContent = `
    /* Avatar */
    #chat-avatar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: transform 0.2s;
      ${isMobile ? 'display: none;' : ''}
    }
    #chat-avatar:hover { transform: scale(1.1); }

    /* Contenedor chat */
    #chatbot {
      position: fixed;
      ${isMobile ? 'top: 0; left: 0; width: 100vw; height: 100vh; border-radius: 0;' : 'bottom: 80px; right: 20px; width: 320px; height: 400px;'}
      background: white;
      border: 1px solid #ccc;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      display: ${isMobile ? 'flex' : 'none'};
      flex-direction: column;
      overflow: hidden;
      font-family: sans-serif;
      z-index: 9999;
    }

    /* Header estilo WhatsApp en móvil, otro color en desktop */
    #chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: ${isMobile ? '#075E54' : '#007bff'};
      color: white;
    }
    #chat-header h4 { margin: 0; font-size: 16px; }
    #reset-btn {
      background: transparent;
      border: none;
      color: white;
      font-size: 14px;
      cursor: pointer;
    }

    /* Output */
    #chat-output {
      flex: 1;
      padding: 10px;
      overflow-y: auto;
      background: ${isMobile ? '#E9ECEF' : '#e5ddd5'};
      display: flex;
      flex-direction: column;
    }

    /* Burbujas estilo WhatsApp en móvil */
    .chat-message { display: flex; margin-bottom: 8px; }
    .chat-message.user { justify-content: flex-end; }
    .chat-message.agent { justify-content: flex-start; }
    .chat-bubble {
      max-width: 80%;
      padding: 10px;
      border-radius: 12px;
      line-height: 1.4;
      word-wrap: break-word;
    }
    .chat-message.user .chat-bubble {
      background: ${isMobile ? '#dcf8c6' : '#dcf8c6'};
      border-bottom-right-radius: 0;
    }
    .chat-message.agent .chat-bubble {
      background: ${isMobile ? '#ffffff' : '#ffffff'};
      border-bottom-left-radius: 0;
    }

    /* Enlaces como botones negros */
    .chat-bubble a {
      display: inline-block;
      background: #000;
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      text-decoration: none;
      margin-top: 4px;
    }
    .chat-bubble a:hover { opacity: 0.8; }

    /* Input */
    #chat-input {
      border: none;
      border-top: 1px solid #ccc;
      padding: 10px;
      font-size: 14px;
      resize: none;
      outline: none;
      ${isMobile ? 'height: 60px; border-radius: 0; border-left: none; border-right: none;' : ''}
    }

    /* Adaptación móvil - fuente más grande */
    ${isMobile ? '#chat-input, .chat-bubble { font-size: 18px; }' : ''}
  `;
  document.head.appendChild(style);

  // 2) Inyectar HTML
  const html = `
    <img id="chat-avatar" src="${avatarUrl}" alt="Agente de Compartitura" />
    <div id="chatbot">
      <div id="chat-header">
        <h4>Agente de Compartitura</h4>
        <button id="reset-btn">Reiniciar</button>
      </div>
      <div id="chat-output"></div>
      <textarea id="chat-input" placeholder="Escribe tu mensaje..." rows="2"></textarea>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  // 3) linkify
  function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">Visitar enlace</a>`);
  }

  // 4) Interacción
  const avatar = document.getElementById('chat-avatar');
  const chatbot = document.getElementById('chatbot');
  const chatInput = document.getElementById('chat-input');
  const chatOutput = document.getElementById('chat-output');
  const resetBtn = document.getElementById('reset-btn');

  avatar.addEventListener('click', () => {
    chatbot.style.display = chatbot.style.display === 'none' ? 'flex' : 'none';
  });
  resetBtn.addEventListener('click', () => { chatOutput.innerHTML = ''; chatInput.value = ''; });

  chatInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;
      // Mostrar user
      chatOutput.insertAdjacentHTML('beforeend', `<div class="chat-message user"><div class="chat-bubble">${message}</div></div>`);
      chatInput.value = '';
      try {
        const res = await fetch('/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
        let reply;
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText })); reply = `<strong>Error:</strong> ${err.error}`;
        } else {
          const data = await res.json(); reply = data.reply || 'Lo siento, no tengo respuesta.';
        }
        chatOutput.insertAdjacentHTML('beforeend', `<div class="chat-message agent"><div class="chat-bubble">${linkify(reply)}</div></div>`);
      } catch (err) {
        chatOutput.insertAdjacentHTML('beforeend', `<div class="chat-message agent"><div class="chat-bubble"><strong>Error:</strong> no pude conectar con el servidor.</div></div>`);
      }
      chatOutput.scrollTop = chatOutput.scrollHeight;
    }
  });
})();
