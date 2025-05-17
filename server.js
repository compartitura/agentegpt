require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { OpenAI } = require("openai");
const products = require("./product.json");

// Usa tu nueva API Key aquí directamente
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `
Eres Cecilia, el Agente de Compartitura. SIEMPRE debes usar la función lookup_product para responder cualquier búsqueda relacionada con instrumentos o productos musicales, sin importar si la consulta es específica o genérica.

Nunca inventes productos ni muestres instrumentos que no estén en el catálogo JSON.

Si la búsqueda es muy genérica ("instrumentos", "quiero una batería"), responde solo con la lista de productos reales del catálogo que coincidan, mostrando siempre:
- Nombre real del producto (Brand + Model) en negrita
- Botón con enlace afiliado (affiliateURL) y la imagen del producto (ImageURL)
- Una pregunta para acotar: por ejemplo, "¿Te interesa alguna marca, modelo o característica en especial?"

Si hay muchos resultados, muestra solo los primeros 5 y pregunta para acotar la búsqueda.

Si no hay resultados, pide al usuario más detalles (marca, modelo, tipo, etc).

NO inventes nada fuera del catálogo, ni nombres, ni imágenes, ni enlaces.
`;

function lookup_product(query) {
  const low = query.toLowerCase();

  // 1. Coincidencia exacta (marca + modelo exacto)
  const exact = products.find(p => `${String(p.Brand || '')} ${String(p.Model || '')}`.toLowerCase() === low);
  if (exact) {
    const name = `${exact.Brand} ${exact.Model}`;
    return (
      `<strong>${name}</strong><br/><br/>` +
      `<button onclick="window.open('${exact.affiliateURL}','_blank')" style="display:flex;align-items:center;background:#fff;border:4px solid #075E54;border-radius:8px;padding:8px 12px;cursor:pointer;color:#075E54;font-size:14px;">` +
      `<img src="${exact.ImageURL}" width="40" style="border-radius:4px;margin-right:12px;"/>${name}</button><br/><br/>` +
      `<div style="padding:12px;font-size:14px;color:#075E54;">¿Necesitas accesorios, partituras, métodos o cursos para este instrumento?</div>` +
      `<br/><br/>¿Algo más en lo que pueda ayudarte?`
    );
  }

  // 2. Coincidencias aproximadas por palabras clave
  const keywords = low.split(" ").filter(Boolean);

  const sim = products.filter(p => {
    const texto = [
      String(p.Brand || ''),
      String(p.Model || ''),
      String(p.Description || ''),
      String(p.CategoryTree || '')
    ].join(" ").toLowerCase();

    // Coincide si TODAS las palabras clave están en algún campo del producto
    return keywords.every(kw => texto.includes(kw));
  });

  if (sim.length > 0) {
    let listado = sim.slice(0, 5).map(p =>
      `<button onclick="window.open('${p.affiliateURL}','_blank')" style="display:flex;align-items:center;background:#fff;border:2px solid #075E54;border-radius:8px;padding:8px 12px;cursor:pointer;color:#075E54;font-size:14px;margin-bottom:8px;">` +
      `<img src="${p.ImageURL}" width="40" style="border-radius:4px;margin-right:12px;"/>${p.Brand} ${p.Model}</button>`
    ).join("<br/>");

    return (
      `<div>Estos productos pueden coincidir con tu búsqueda:<br/><br/>${listado}</div>` +
      `<div style="padding:12px;font-size:14px;color:#075E54;">¿Alguna marca o modelo en concreto? ¿Te interesa algún tipo o característica especial?</div>`
    );
  }

  // 3. No encontró nada
  return `<div>No encontré ningún producto que coincida con tu búsqueda.<br/>¿Puedes darme más detalles? ¿Marca, modelo, tipo de instrumento, etc.?</div>`;
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

app.post("/chat", async (req, res) => {
  const msg = (req.body.message || "").trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user",   content: msg }
    ],
    functions: [
      {
        name: "lookup_product",
        description: "Busca un producto en product.json por cualquier campo relevante (marca, modelo, descripción, categoría)",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Texto de búsqueda del usuario" }
          },
          required: ["query"]
        }
      }
    ],
    function_call: "auto"
  });

  const choice = response.choices[0];
  if (choice.finish_reason === "function_call") {
    const args = JSON.parse(choice.message.function_call.arguments);
    const html = lookup_product(args.query);
    return res.json({ reply: html });
  }

  // Fallback: respuesta directa
  const content = choice.message.content || "Lo siento, no tengo respuesta.";
  return res.json({ reply: content });
});

// Búsqueda JSON para autocomplete
app.get("/products/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const matches = products.filter(p =>
    `${p.Brand} ${p.Model}`.toLowerCase().includes(q) ||
    p.CategoryTree.toLowerCase().includes(q)
  ).slice(0, 10).map(p => ({ name: `${p.Brand} ${p.Model}`, image: p.ImageURL, url: p.ProductURL }));
  res.json({ products: matches });
});

// Estáticos
app.use("/partituras", express.static(path.join(__dirname, "partituras")));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
