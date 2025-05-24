require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { OpenAI } = require("openai");
const products = require("./product.json");
<<<<<<< HEAD

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
  // ...agrega más si lo necesitas
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
    // Lista para coincidencia exacta con badge
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
    // Lista de productos similares con encabezado y límite a 3
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

  // Nada encontrado
  return `
    <div class="cecilia-no-results">
      No encontré ningún producto que coincida con tu búsqueda.<br>
      ¿Puedes darme más detalles? Marca, modelo, tipo de instrumento, etc.
    </div>
  `;
}







=======
>>>>>>> 52ab82f (Guarda mis cambios)

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use("/partituras", express.static(path.join(__dirname, "partituras")));

<<<<<<< HEAD
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

  // Fallback: respuesta directa para conversación/consejo
  const content = choice.message.content || "Lo siento, no tengo respuesta.";
  return res.json({ reply: content });
});

// Búsqueda JSON para autocomplete
app.get("/products/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const matches = products.filter(p =>
    `${String(p.Brand || '')} ${String(p.Model || '')}`.toLowerCase().includes(q) ||
    String(p.CategoryTree || '').toLowerCase().includes(q)
  ).slice(0, 10).map(p => ({ name: `${p.Brand} ${p.Model}`, image: p.ImageURL, url: p.ProductURL }));
  res.json({ products: matches });
});

// Estáticos
app.use("/partituras", express.static(path.join(__dirname, "partituras")));
=======
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
>>>>>>> 52ab82f (Guarda mis cambios)

// Sirve index.html automáticamente; archivos estáticos ya cubiertos
const PORT = process.env.PORT || 3001;
<<<<<<< HEAD
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
=======
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
>>>>>>> 52ab82f (Guarda mis cambios)
