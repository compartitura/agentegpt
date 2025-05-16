// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Prompt por defecto
const systemPrompt = process.env.SYSTEM_PROMPT || `
Eres el Agente de Compartitura, un asistente para ayudar a músicos a encontrar partituras y vender instrumentos.
`;

// Endpoint de chat
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });
    const content = response.choices?.[0]?.message?.content || "";
    res.json({ reply: content });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ reply: "Error al consultar la API de OpenAI." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
