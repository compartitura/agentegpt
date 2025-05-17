;(function() {
  const avatarUrl = "https://www.compartitura.org/medias/images/captura-12.jpg";
  const isMobile  = window.innerWidth <= 600;

  // Carga de fuente Inter
  const fontLink = document.createElement("link");
  fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap";
  fontLink.rel  = "stylesheet";
  document.head.appendChild(fontLink);

  // Estilos: solo lo verde (bordes, botones, header) es ahora negro
  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, textarea, button { font-family: 'Inter', sans-serif; }
    @keyframes bounce {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    #chatbot-toggle {
      display: none;
      position: fixed; bottom: 20px; right: 20px;
      width: 80px; height: 80px; border-radius: 50%;
      background: url(${avatarUrl}) center/cover no-repeat;
      cursor: pointer; z-index: 10000;
      box-shadow: 0 0 12px rgba(0,0,0,0.6);
      animation: bounce 2s infinite;
    }
    #chatbot {
      position: fixed;
      top: 0; left: 0;
      width: 100vw !important;
      min-width: 100vw !important;
      height: 100vh !important;
      min-height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      background: #fff;
      border: 1px solid #ccc;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      display: flex; flex-direction: column; z-index: 99999;
      border-radius: 0 !important;
      padding: 0 !important;
    }
    #chatbot.open { display: flex; }
    #chatbot-header { display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #000; color: #fff; }
    #chatbot-header .left { display: flex; align-items: center; }
    #chatbot-header img { width: 32px; height: 32px; border-radius: 50%; margin: 0 8px; }
    #chatbot-header h4 { font-size: 16px; margin-right: auto; }
    #chatbot-close, #menu-btn { background: transparent; border: none; color: #000; cursor: pointer; }
    #chatbot-close { font-size: 18px; }
    #menu-btn { font-size: 24px; }
    #quick-menu { position: absolute; top: 44px; right: 10px; background: #fff; border: 1px solid #000; box-shadow: 0 2px 4px rgba(0,0,0,0.2); list-style: none; padding: 5px 0; margin: 0; display: none; width: 220px; z-index: 10001; }
    #quick-menu li { padding: 8px 12px; color: #000; cursor: pointer; }
    #quick-menu li:hover { background: #f0f0f0; }
    #chatbot-messages { flex: 1; padding: 10px; overflow-y: auto; background: #e5ddd5; }
    .chat-message { margin-bottom: 10px; display: flex; }
    .chat-message.user { justify-content: flex-end; }
    .chat-bubble { display: inline-block; max-width: 80%; padding: 12px; border-radius: 16px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); word-wrap: break-word; white-space: pre-wrap; }
    .chat-message.user .chat-bubble { background: #dcf8c6; }
    #chatbot-input-container { position: relative; }
    #chatbot-input { width: 100%; height: 60px; border: none; border-top: 1px solid #ccc; padding: 12px; font-size: 16px; resize: none; outline: none; padding-right: 50px; }
    #send-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; background: url('https://www.compartitura.org/medias/images/enviar-1.png') center/cover no-repeat; cursor: pointer; display: none; color: #000; }
    html, body {
      overscroll-behavior: none !important;
      background: #fff !important;
      height: 100vh !important;
      max-height: 100vh !important;
      width: 100vw !important;
      overflow: hidden !important;
      margin: 0 !important; padding: 0 !important;
    }
    @media (max-width: 600px) {
      #chatbot {
        position: fixed !important;
        top: 0; left: 0;
        width: 100vw !important;
        min-width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        z-index: 99999 !important;
        overscroll-behavior: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      html, body {
        overscroll-behavior: none !important;
        background: #fff !important;
        height: 100vh !important;
        max-height: 100vh !important;
        width: 100vw !important;
        overflow: hidden !important;
        margin: 0 !important; padding: 0 !important;
      }
      #chatbot-input-container {
        position: fixed !important;
        bottom: 0; left: 0;
        width: 100vw !important;
        background: #fff !important;
        z-index: 10002;
      }
      #chatbot-input {
        height: 52px !important;
        font-size: 17px !important;
        background: #fff !important;
      }
      #send-btn {
        top: 52%;
      }
      #chatbot-messages {
        padding-bottom: 70px !important;
      }
    }
  `;
  document.head.appendChild(style);

  // HTML Structure
  document.body.insertAdjacentHTML("beforeend", `
    <div id="chatbot-toggle"></div>
    <div id="chatbot">
      <div id="chatbot-header">
        <div class="left">
          <button id="chatbot-close">←</button>
          <img src="${avatarUrl}" alt="Cecilia"/><h4>Cecilia</h4>
        </div>
        <button id="menu-btn">⋮</button>
        <ul id="quick-menu">
          <li data-q="Buscar partituras">Buscar partituras</li>
          <li data-q="Buscar instrumentos">Buscar instrumentos</li>
          <li data-q="Vender instrumentos">Vender instrumentos</li>
          <li data-q="Buscar empleo / músicos">Buscar empleo / músicos</li>
          <li data-q="Acceso a la comunidad en WhatsApp">Acceso a la comunidad en WhatsApp</li>
          <li data-q="Activar/Renovar acceso al servidor">Activar/Renovar acceso al servidor</li>
          <li data-q="Buscar cursos">Buscar cursos</li>
          <li data-q="Buscar eventos de música clásica">Buscar eventos de música clásica</li>
        </ul>
      </div>
      <div id="chatbot-messages"></div>
      <div id="chatbot-input-container">
        <textarea id="chatbot-input" placeholder="¿Qué necesitas?" rows="2"></textarea>
        <div id="send-btn"></div>
      </div>
    </div>
  `);

  // References
  const toggle    = document.getElementById("chatbot-toggle");
  const bot       = document.getElementById("chatbot");
  const menuBtn   = document.getElementById("menu-btn");
  const closeBtn  = document.getElementById("chatbot-close");
  const quickMenu = document.getElementById("quick-menu");
  const msgs      = document.getElementById("chatbot-messages");
  const input     = document.getElementById("chatbot-input");
  const sendBtn   = document.getElementById("send-btn");

  // Mobile: always open full-screen
  if (isMobile) {
    bot.classList.add('open');
  } else {
    toggle.style.display = 'block'; toggle.onclick = () => bot.classList.toggle('open');
  }
  closeBtn.onclick = () => bot.classList.remove('open');

  // Quick-menu events
  menuBtn.onclick = e => { e.stopPropagation(); quickMenu.style.display = quickMenu.style.display==='block'? 'none':'block'; };
  document.addEventListener('click', ()=> quickMenu.style.display='none');
  quickMenu.querySelectorAll('li').forEach(li=> li.onclick=()=>{ quickMenu.style.display='none'; sendToCecilia(li.dataset.q); });

  // Show send icon
  input.addEventListener('input', ()=> sendBtn.style.display = input.value.trim() ? 'block':'none');
  sendBtn.onclick = ()=> { if(input.value.trim()){ sendToCecilia(input.value.trim()); input.value=''; sendBtn.style.display='none'; }};
  input.addEventListener('keypress', e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(input.value.trim()){ sendToCecilia(input.value.trim()); input.value=''; sendBtn.style.display='none'; } }});

  // Send with bouncing dots
  async function sendToCecilia(text){
    addMessage(text,true);
    const ind = document.createElement('div'); ind.className='chat-message agent';
    ind.innerHTML = `<div id="typing-indicator">`+ '<div class="typing-dot"></div>'.repeat(3)+`</div>`;
    msgs.appendChild(ind); msgs.scrollTop=msgs.scrollHeight;
    await new Promise(r=> setTimeout(r,3000)); ind.remove();
    let reply='Lo siento, no tengo respuesta.';
    try{ const res=await fetch('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})}); const d=await res.json(); reply=d.reply||d.error||reply;}catch{reply='Error de conexión.';}
    addMessage(reply);
  }

  function addMessage(html,user=false){
    const div=document.createElement('div'); div.className='chat-message '+(user?'user':'agent');
    const bub=document.createElement('div'); bub.className='chat-bubble'; bub.innerHTML=html;
    div.appendChild(bub); msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight;
  }

  // Initial greeting
  addMessage('Hola, ¿en qué puedo ayudarte?');
})();
