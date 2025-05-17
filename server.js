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

const systemPrompt = `
Eres Cecilia, el Agente de Compartitura. Responde así:
- Si la pregunta coincide con un producto (Brand+Model) o categoría/subcategoría del JSON, muestra:
  1. Nombre en negrita.
  2. Botón blanco con borde verde de 4px, imagen a la izquierda y texto igual a Brand+Model.
  3. Pregunta seguimiento: “¿Necesitas accesorios, partituras, métodos o cursos para este instrumento?”
  4. Cierre: “¿Algo más en lo que pueda ayudarte?”
- Para cualquier otra pregunta, usa OpenAI sin formato de producto ni pregunta de seguimiento.
`;

// Búsqueda JSON
app.get("/products/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const matches = products
    .filter(p => {
      const full = `${p.Brand} ${p.Model}`.toLowerCase();
      return (
        full.includes(q) ||
        p.CategoryTree.toLowerCase().includes(q) ||
        (p.CategoryTree.split('>').some(c => c.trim().toLowerCase().includes(q)))
      );
    })
    .slice(0, 10)
    .map(p => ({
      name: `${p.Brand} ${p.Model}`,
      image: p.ImageURL,
      url:   p.ProductURL
    }));
  res.json({ products: matches });
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  const msg = (req.body.message || "").trim();
  const low = msg.toLowerCase();

  // Intent: buscar producto
  // Comprobar coincidencia JSON exacta
  const found = products.filter(p => {
    const name = `${p.Brand} ${p.Model}`.toLowerCase();
    return name === low;
  });
  if (found.length) {
    const p = found[0];
    const name = `${p.Brand} ${p.Model}`;
    const html =
      `<strong>${name}</strong><br/><br/>` +
      `<button onclick="window.open('${p.ProductURL}','_blank')" style="display:flex;align-items:center;background:#fff;border:4px solid #075E54;border-radius:8px;padding:8px 12px;cursor:pointer;color:#075E54;font-size:14px;">` +
      `<img src="${p.ImageURL}" width="40" style="border-radius:4px;margin-right:12px;"/>${name}</button><br/><br/>` +
      `<div style="padding:12px;font-size:14px;color:#075E54;">¿Necesitas accesorios, partituras, métodos o cursos para este instrumento?</div><br/><br/>` +
      `¿Algo más en lo que pueda ayudarte?`;
    return res.json({ reply: html });
  }

  // Si pregunta genérica de instrumento sin marca/modelo
  const generic = low.match(/(?:necesito|quiero|busco) un ([a-záéíóúñ ]+)/i);
  if (generic) {
    const term = generic[1].trim();
    // pregunta genérica: no aplicar formato de producto
    return res.json({ reply: `Entendido. ¿Tienes alguna marca o modelo de ${term} en mente?` });
  }

  // Otras preguntas -> OpenAI
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user",   content: msg }
      ]
    });
    const content = response.choices[0].message.content;
    return res.json({ reply: content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ reply: "Error al consultar la API de OpenAI." });
  }
});

app.use("/partituras", express.static(path.join(__dirname, "partituras")));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));