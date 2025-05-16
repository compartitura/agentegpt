// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { OpenAI } = require("openai");
const products = require("./product.json");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Prompt actualizado: NO redirigir a sitios externos,
// usar solo recursos de compartitura.org y catálogo interno.
const systemPrompt = `
Eres el Agente de Compartitura, un asistente para ayudar a músicos a encontrar partituras y productos dentro de este sitio.
Nunca ofrezcas enlaces externos fuera de compartitura.org ni de nuestro catálogo interno.
Cuando el usuario pregunte por partituras, sugiéreles directamente los archivos alojados en /partituras.
Cuando pregunte por productos, usa nuestro catálogo product.json y enlaza a /products/search o a la URL interna del producto.
`;

// Endpoint de búsqueda de productos
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

// Endpoint de chat
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user",   content: userMessage }
      ]
    });
    res.json({ reply: response.choices[0].message.content || "" });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ error: "Error al consultar la API de OpenAI." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
