// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { OpenAI } = require("openai");
const products = require("./product.json"); // Asegúrate de que cada objeto tenga un campo `referido`

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `
Eres el Agente de Compartitura, un asistente que usa SOLO recursos de este sitio.
Para productos, usa siempre el campo "referido" de nuestro catálogo y nunca enlaces internos basados en ID.
`;

// Endpoint de búsqueda de productos (usa "referido")
app.get("/products/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const matches = products
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    )
    .slice(0, 10)
    .map(p => ({
      name: p.name,
      referido: p.referido,  // URL de referido
      image: p.image
    }));
  res.json({ products: matches });
});

// Endpoint de chat con rule-based + fallback
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";
  const q = userMessage.toLowerCase();

  // Si menciona productos
  if (/comprar|producto|instrumento/i.test(q)) {
    const matches = products
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(p =>
        `- <img src="${p.image}" width="40" style="vertical-align:middle;border-radius:4px;margin-right:8px;" />` +
        `<a href="${p.referido}" target="_blank"> ${p.name}</a>`
      )
      .join("\n");
    return res.json({ reply: `Estos productos que coinciden:\n${matches}` });
  }

  // Fallback a OpenAI
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user",   content: userMessage }
      ]
    });
    const content = response.choices[0].message.content || "";
    res.json({ reply: content });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ reply: "Error al consultar la API de OpenAI." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
