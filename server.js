require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
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

  // Coincidencia exacta (marca + modelo exacto)
  const exact = products.find(p => `${String(p.Brand || '')} ${String(p.Model || '')}`.toLowerCase() === low);
  if (exact) {
    const name = `${exact.Brand} ${exact.Model}`;
    return (
      `<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:20px;">
        <div style="text-align:center;width:100%;font-weight:600;font-size:18px;margin-bottom:4px;color:#000;">${name}</div>
        <button onclick="window.open('${exact.affiliateURL}','_blank')" style="display:flex;align-items:center;justify-content:center;background:#fff;border:2px solid #000;border-radius:10px;padding:7px 18px;margin:6px 0;cursor:pointer;color:#000;font-size:15px;font-weight:500;">
          <img src="${exact.ImageURL}" alt="${name}" style="width:38px;height:38px;object-fit:cover;border-radius:8px;margin-right:10px;">
          Más información
        </button>
      </div>
      <div style="font-size:14px;color:#000;text-align:center;">
        ${exact.Description ? exact.Description + "<br>" : ""}
        ¿Necesitas accesorios, partituras, métodos o cursos para este instrumento?
      </div>
      <div style="text-align:center;margin-top:14px;color:#000;">¿Algo más en lo que pueda ayudarte?</div>`
    );
  }

  // Coincidencias ponderadas por palabras clave y sinónimos
  const productos_con_matches = products
    .map(p => {
      const texto = [
        String(p.Brand || ''),
        String(p.Model || ''),
        String(p.Description || ''),
        String(p.CategoryTree || '')
      ].join(" ").toLowerCase();
      let matches = 0;
      for (let kw of keywords_translated) {
        if (texto.includes(kw)) matches++;
      }
      if (low.includes("principiante") || low.includes("starter") || low.includes("fácil") || low.includes("beginner")) {
        if (texto.includes("starter") || texto.includes("beginner") || texto.includes("student") || texto.includes("set")) matches += 2;
      }
      if (low.includes("profesional") || low.includes("pro")) {
        if (texto.includes("pro") || texto.includes("artist") || texto.includes("professional")) matches += 2;
      }
      return { p, matches };
    })
    .filter(obj => obj.matches > 0)
    .sort((a, b) => b.matches - a.matches);

  const sim = productos_con_matches.map(obj => obj.p);

  if (sim.length > 0) {
    const marcas = [...new Set(sim.map(p => p.Brand).filter(Boolean))];
    let pregunta_acotar = marcas.length > 1
      ? `¿Prefieres alguna marca en concreto? (${marcas.slice(0,3).join(", ")}${marcas.length>3?", ...":""})`
      : `¿Te interesa algún modelo o característica especial?`;

    let listado = sim.slice(0, 3).map(p =>
      `<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:18px;">
        <div style="text-align:center;width:100%;font-weight:600;font-size:15px;margin-bottom:4px;color:#000;">${p.Brand} ${p.Model}</div>
        <button onclick="window.open('${p.affiliateURL}','_blank')" style="display:flex;align-items:center;justify-content:center;background:#fff;border:2px solid #000;border-radius:10px;padding:7px 18px;cursor:pointer;color:#000;font-size:14px;font-weight:500;">
          <img src="${p.ImageURL}" alt="${p.Brand} ${p.Model}" style="width:34px;height:34px;object-fit:cover;border-radius:7px;margin-right:10px;">
          Más información
        </button>
      </div>`
    ).join("");

    return (
      `<div style="width:100%;max-width:370px;padding:0;margin:0 auto;">
        <div style="margin-bottom:8px;color:#000;">Estos productos pueden coincidir con tu búsqueda:</div>
        ${listado}
        <div style="padding:10px 0 0 0;font-size:14px;color:#000;">
          ${pregunta_acotar}
        </div>
      </div>`
    );
  }

  // No encontró nada
  return `<div style="text-align:center;color:#000;">No encontré ningún producto que coincida con tu búsqueda.<br>¿Puedes darme más detalles? ¿Marca, modelo, tipo de instrumento, etc.?</div>`;
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
