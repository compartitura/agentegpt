// Espera a que el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  // Mostrar siempre la pantalla central al cargar
  const centralPanel = document.querySelector('.wa-central');
  centralPanel && centralPanel.scrollIntoView({ behavior: 'auto' });

  const input = document.getElementById('wa-input');
  const waChat = document.getElementById('wa-chat-messages');
  const sendBtn = document.getElementById('send-btn');
  const avatarBtn = document.getElementById('avatar-btn');
  const leftBtn = document.querySelector('.nav-btn.left');
  const rightBtn = document.querySelector('.nav-btn.right');

  // Navegación móvil
  leftBtn && leftBtn.addEventListener('click', () => scroll(-1));
  rightBtn && rightBtn.addEventListener('click', () => scroll(1));

  // Dropdown global
  document.addEventListener('click', e => {
    if (!e.target.closest('.wa-menu-btn')) {
      document.querySelectorAll('.wa-menu-dropdown').forEach(m => m.style.display = 'none');
    }
  });

  // Botones desplegable
  document.querySelectorAll('.wa-menu-btn').forEach(btn => {
    btn.addEventListener('click', e => toggleDropdown(e.currentTarget));
  });

  // Enviar con Enter
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarCecilia();
    }
  });

  // Enviar con clic
  sendBtn.addEventListener('click', enviarCecilia);

  // Ir al chat al clicar avatar
  avatarBtn.addEventListener('click', () => {
    const central = document.querySelector('.wa-central');
    central && central.scrollIntoView({ behavior: 'smooth' });
  });
});

// Función para mostrar/ocultar dropdown
function toggleDropdown(btn) {
  const menu = btn.nextElementSibling;
  document.querySelectorAll('.wa-menu-dropdown').forEach(m => {
    if (m !== menu) m.style.display = 'none';
  });
  menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

// Función de scroll por panel
function scroll(dir) {
  const layout = document.querySelector('.wa-layout');
  layout.scrollBy({ left: window.innerWidth * dir, behavior: 'smooth' });
}

// Envía mensaje a Cecilia
async function enviarCecilia() {
  // Desplazar a pantalla central al enviar
  const centralPanel = document.querySelector('.wa-central');
  centralPanel && centralPanel.scrollIntoView({ behavior: 'smooth' });

  const inputEl = document.getElementById('wa-input');
  const waChatEl = document.getElementById('wa-chat-messages');
  const text = inputEl.value.trim();
  if (!text) return;

  // Crear burbuja de usuario
  const userBubble = document.createElement('div');
  userBubble.className = 'wa-bubble user';
  userBubble.textContent = text;
  waChatEl.appendChild(userBubble);
  // Scroll al usuario
    // waChatEl.scrollTop = waChatEl.scrollHeight;
    userBubble.scrollIntoView({ behavior: 'smooth' });
  inputEl.value = '';

  // Indicador de escritura
  const typing = document.createElement('div');
  typing.className = 'wa-bubble cecilia typing';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'typing-dot';
    typing.appendChild(dot);
  }
  waChatEl.appendChild(typing);
  waChatEl.scrollTop = waChatEl.scrollHeight;

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    typing.remove();
    const botBubble = document.createElement('div');
    botBubble.className = 'wa-bubble cecilia';
    botBubble.innerHTML = `${data.reply}`;

    waChatEl.appendChild(botBubble);
    // Scroll a la última respuesta
    botBubble.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    typing.remove();
    const errEl = document.createElement('div');
    errEl.className = 'wa-bubble cecilia';
    errEl.textContent = 'Error al contactar Cecilia';
    waChatEl.appendChild(errEl);
    waChatEl.scrollTop = waChatEl.scrollHeight;
  }
}
// ——————————————————
// navegación desde la barra de iconos
// ——————————————————
document.addEventListener('DOMContentLoaded', () => {
  const layout = document.querySelector('.wa-layout');
  const cols   = ['wa-extra-left','wa-left','wa-sidebar','wa-main','wa-right'];
  const btns   = document.querySelectorAll('.botonera-btn');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector('.' + btn.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  layout.addEventListener('scroll', () => {
    const idx = Math.round(layout.scrollLeft / window.innerWidth);
    const activeCol = cols[idx];
    btns.forEach(b => b.classList.toggle('active', b.dataset.target === activeCol));
  });
});
