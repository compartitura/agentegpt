const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1) Servir archivos estáticos desde la raíz
app.use(express.static(path.join(__dirname)));

// 2) Enviar index.html para cualquier ruta (fallback)
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 3) Endpoint de chat
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Eres el Agente de Compartitura, un asistente especializado en ayudar a músicos a encontrar partituras. Responde de forma clara, profesional y amigable. Si no sabes algo, ofrece ayudar al usuario a encontrarlo en el sitio compartitura.org."
        },
        { role: "user", content: userMessage }
      ]
    });
    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al consultar la API");
  }
});

// 4) Levantar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
