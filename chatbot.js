// chatbot.js
;(function() {
  // 1) Inyectar estilos
  const style = document.createElement('style')
  style.textContent = `
    #chatbot {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      max-height: 400px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 12px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      font-family: sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
    }
    #chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      border-bottom: 1px solid #ccc;
      background: #f5f5f5;
    }
    #chat-header h4 {
      margin: 0;
      font-size: 14px;
    }
    #reset-btn {
      background: transparent;
      border: none;
      color: #007bff;
      font-size: 14px;
      cursor: pointer;
    }
    #chat-output {
      padding: 10px;
      overflow-y: auto;
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
    }
    #chatbot textarea {
      resize: none;
      padding: 8px;
      border: none;
      border-top: 1px solid #ccc;
      font-size: 14px;
    }
  `
  document.head.appendChild(style)

  // 2) Inyectar estructura HTML
  const html = `
    <div id="chatbot">
      <div id="chat-header">
        <h4>Agente de Compartitura</h4>
        <button id="reset-btn">Reiniciar</button>
      </div>
      <div id="chat-output"></div>
      <textarea id="chat-input" rows="2" placeholder="Escribe tu pregunta..."></textarea>
    </div>
  `
  document.body.insertAdjacentHTML('beforeend', html)

  // 3) Lógica de interacción
  const chatInput = document.getElementById("chat-input")
  const chatOutput = document.getElementById("chat-output")
  const resetBtn   = document.getElementById("reset-btn")

  // Reiniciar conversación
  resetBtn.addEventListener("click", () => {
    chatOutput.innerHTML = ""
    chatInput.value = ""
  })

  // Enviar al presionar Enter
  chatInput.addEventListener("keypress", async e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const message = chatInput.value.trim()
      if (!message) return

      chatOutput.innerHTML += `<div><strong>Tú:</strong> ${message}</div>`
      chatInput.value = ""

      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      })
      const { reply } = await res.json()
      chatOutput.innerHTML += `<div><strong>Agente de Compartitura:</strong> ${reply}</div>`
      chatOutput.scrollTop = chatOutput.scrollHeight
    }
  })
})()
