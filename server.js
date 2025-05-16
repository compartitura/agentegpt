// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { OpenAI } = require("openai");
const products = require("./product.json");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use("/partituras", express.static(path.join(__dirname, "partituras")));

// Sistema de prompts que obliga a usar solo recursos internos
const systemPrompt = `
Eres el Agente de Compartitura, un asistente experto que SOLO utiliza recursos de ESTE sitio:
- Para partituras, ofrece enlaces a /partituras/{archivo}.
- Para productos, busca en nuestro product.json y enlaza a /products/{id}.
Nunca menciones ni enlaces sitios externos. Sé claro, conciso y profesional.
`;

// Búsqueda rule-based de partituras
app.get("/partituras/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  let files = [];
  try {
    files = fs.readdirSync(path.join(__dirname, "partituras"));
  } catch {
    return res.status(500).json({ error: "No se pudo leer carpeta partituras." });
  }
  const matches = files
    .filter(f => f.toLowerCase().includes(q))
    .slice(0, 10)
    .map(f => ({
      name: path.basename(f, path.extname(f)),
      url: `/partituras/${encodeURIComponent(f)}`
    }));
  res.json({ partituras: matches });
});

// Búsqueda rule-based de productos
app.get("/products/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const matches = products
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    )
    .slice(0, 10)
    .map(p => ({
      id: p.id,
      name: p.name,
      url: `/products/${p.id}`,
      image: p.image // espera que product.json incluya campo `image`
    }));
  res.json({ products: matches });
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chat endpoint con interceptación rule-based
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";
  const q = userMessage.toLowerCase();

  // Si menciona partituras, no llamar a OpenAI
  if (/partitura/i.test(q)) {
    const files = fs.readdirSync(path.join(__dirname, "partituras"))
      .filter(f => f.toLowerCase().includes(q))
      .slice(0, 5)
      .map(f => `- [${path.basename(f, path.extname(f))}](/partituras/${encodeURIComponent(f)})`)
      .join("\n");
    return res.json({ reply: `Estas son nuestras partituras:\n${files}` });
  }

  // Si menciona productos
  if (/comprar|producto|instrumento/i.test(q)) {
    const matches = products
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(p =>
        `- <img src="${p.image}" width="50" style="vertical-align:middle;border-radius:4px;margin-right:8px;" />` +
        `<a href="/products/${p.id}">${p.name}</a>`
      )
      .join("\n");
    return res.json({ reply: `Estos productos coincidentes:\n${matches}` });
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
    const content = response.choices?.[0]?.message?.content || "";
    res.json({ reply: content });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ reply: "Error al consultar la API de OpenAI." });
  }
});

// Sirve index.html automáticamente; archivos estáticos ya cubiertos
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
