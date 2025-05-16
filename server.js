// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { OpenAI } = require("openai");
const products = require("./product.json"); // ← tu archivo con 115 465 objetos

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1) Endpoint para buscar productos
app.get("/products/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const matches = products
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    )
    .slice(0, 10);
  res.json({ products: matches });
});

// 2) Endpoint de chat
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: process.env.SYSTEM_PROMPT
        },
        { role: "user", content: userMessage }
      ]
    });
    const content = response.choices?.[0]?.message?.content || "";
    res.json({ reply: content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Error al consultar la API de OpenAI." });
  }
});

// 3) Fallback para servir index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
