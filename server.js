require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { OpenAI } = require("openai");
const products = require("./product.json");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sinónimos español-inglés para búsqueda flexible
const synonyms = {
  'saxofon': 'saxophone',
  'saxofón': 'saxophone',
  'trompeta': 'trumpet',
  'bateria': 'drums',
  'batería': 'drums',
  'guitarra': 'guitar',
  'piano': 'piano',
  'violin': 'violin',
  'violín': 'violin',
  'teclado': 'keyboard',
  'flauta': 'flute',
  'clarinete': 'clarinet',
  'percusión': 'percussion',
  'platillo': 'cymbal',
  'platillos': 'cymbals',
  'contrabajo': 'double bass',
  'trombon': 'trombone',
  'trombón': 'trombone',
  'acústica': 'acoustic',
  'eléctrica': 'electric',
};

const systemPrompt = `
Eres Cecilia, el Agente de Compartitura. Cuando el usuario te pide buscar o mostrar productos, utiliza siempre la función lookup_product y responde solo con productos reales del catálogo JSON.

Sin embargo, si el usuario pide consejo, información, tips o recomendaciones generales (por ejemplo: "¿qué instrumento me recomiendas para empezar?", "¿cómo puedo aprender más rápido?", "¿qué diferencias hay entre piano y teclado?"), puedes responder con información útil, consejos o recomendaciones en tono conversacional, como haría un experto amable.

Si detectas en la búsqueda palabras como "principiante", "starter", "fácil", da prioridad a productos adecuados para principiantes o sets completos.

NO inventes productos, imágenes o enlaces que no estén en el catálogo, pero SÍ puedes conversar y aconsejar como un agente musical profesional.

Cuando muestres productos, utiliza siempre botones grandes, imágenes visibles, y asegúrate de que la experiencia sea amigable para móviles.
`;

function lookup_product(query) {
  const low = query.toLowerCase();
  const keywords = low.split(" ").filter(Boolean);
  const keywords_translated = keywords.map(kw => synonyms[kw] || kw);

  // Coincidencia exacta
  const exact = products.find(
    p => `${p.Brand || ''} ${p.Model || ''}`.toLowerCase() === low
  );
  if (exact) {
    const name = `${exact.Brand} ${exact.Model}`;
    return `
      <div class="cecilia-lista">
        <a class="cecilia-lista-item" href="${exact.affiliateURL}" target="_blank">
          <div class="cecilia-lista-badge">¡Coincidencia exacta con tu petición!</div>
          <img class="cecilia-lista-img" src="${exact.ImageURL}" alt="${name}">
          <div class="cecilia-lista-body">
            <div class="cecilia-lista-title">${name}</div>
            <div class="cecilia-lista-desc">${exact.Description || ''}</div>
            <div class="cecilia-lista-price">${exact.Price || ''}</div>
          </div>
        </a>
      </div>
    `;
  }

  // Búsqueda de similitudes
  const sim = products
    .map(p => {
      const text = [p.Brand, p.Model, p.Description, p.CategoryTree]
        .join(' ').toLowerCase();
      let score = keywords_translated.reduce(
        (acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0
      );
      return { p, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.p);

  if (sim.length > 0) {
    return `
      <div class="cecilia-lista">
        <div class="cecilia-lista-header">Destacados similares con tu petición</div>
        ${sim.slice(0, 3).map(p => {
          const name = `${p.Brand} ${p.Model}`;
          return `
            <a class="cecilia-lista-item" href="${p.affiliateURL}" target="_blank">
              <img class="cecilia-lista-img" src="${p.ImageURL}" alt="${name}">
              <div class="cecilia-lista-body">
                <div class="cecilia-lista-title">${name}</div>
                ${p.Description ? `<div class="cecilia-lista-desc">${p.Description}</div>` : ''}
                ${p.Price ? `<div class="cecilia-lista-price">${p.Price}</div>` : ''}
              </div>
            </a>
          `;
        }).join('')}
      </div>
    `;
  }

  return `
    <div class="cecilia-no-results">
      No encontré ningún producto que coincida con tu búsqueda.<br>
      ¿Puedes darme más detalles? Marca, modelo, tipo de instrumento, etc.
    </div>
  `;
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use("/partituras", express.static(path.join(__dirname, "partituras")));

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
        description: "Busca un producto en product.json por cualquier campo relevante (marca, modelo, descripción, categoría) usando también sinónimos si es necesario.",
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

  const content = choice.message.content || "Lo siento, no tengo respuesta.";
  return res.json({ reply: content });
});

app.get("/products/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const matches = products.filter(p =>
    `${String(p.Brand || '')} ${String(p.Model || '')}`.toLowerCase().includes(q) ||
    String(p.CategoryTree || '').toLowerCase().includes(q)
  ).slice(0, 10).map(p => ({ name: `${p.Brand} ${p.Model}`, image: p.ImageURL, url: p.ProductURL }));
  res.json({ products: matches });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
