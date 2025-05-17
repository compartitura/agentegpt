require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { OpenAI } = require("openai");
const products = require("./product.json");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ----- MAPA DE SINÓNIMOS -----
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
  // añade más según tus necesidades...
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
  // Traduce los keywords con el mapa de sinónimos
  const keywords_translated = keywords.map(kw => synonyms[kw] || kw);

  // Coincidencia exacta (marca + modelo exacto)
  const exact = products.find(p => `${String(p.Brand || '')} ${String(p.Model || '')}`.toLowerCase() === low);
  if (exact) {
    const name = `${exact.Brand} ${exact.Model}`;
    return (
      `<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:16px;">
        <strong style="font-size:18px;">${name}</strong>
        <img src="${exact.ImageURL}" alt="${name}" style="width:90%;max-width:220px;border-radius:12px;margin:12px 0;box-shadow:0 2px 8px rgba(7,94,84,0.08);" />
        <button onclick="window.open('${exact.affiliateURL}','_blank')" style="width:100%;background:#fff;border:3px solid #075E54;border-radius:16px;padding:14px 0;cursor:pointer;color:#075E54;font-size:17px;margin:10px 0;box-shadow:0 1px 4px rgba(7,94,84,0.10);font-weight:600;transition:background .2s;">Ver producto en Thomann</button>
        <div style="padding:8px 0 0 0;font-size:15px;color:#075E54;">
          ${exact.Description ? exact.Description + "<br>" : ""}
          ¿Necesitas accesorios, partituras, métodos o cursos para este instrumento?
        </div>
      </div>
      <div style="text-align:center;margin:12px 0 0 0;">¿Algo más en lo que pueda ayudarte?</div>`
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
      // contar coincidencias de keywords
      let matches = 0;
      for (let kw of keywords_translated) {
        if (texto.includes(kw)) matches++;
      }
      // bonus si pone principiante, starter, etc.
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
    // Marcas diferentes para sugerir acotar
    const marcas = [...new Set(sim.map(p => p.Brand).filter(Boolean))];
    let pregunta_acotar = marcas.length > 1
      ? `¿Prefieres alguna marca en concreto? (${marcas.slice(0,4).join(", ")}${marcas.length>4?", ...":""})`
      : `¿Te interesa algún modelo o característica especial?`;

    let listado = sim.slice(0, 5).map(p =>
      `<div style="display:flex;align-items:center;margin-bottom:18px;">
        <img src="${p.ImageURL}" width="48" height="48" alt="${p.Brand} ${p.Model}" style="border-radius:12px;box-shadow:0 1px 4px rgba(7,94,84,0.10);margin-right:12px;max-width:48px;max-height:48px;" />
        <div style="flex:1;">
          <div style="font-weight:600;font-size:16px;">${p.Brand} ${p.Model}</div>
          <button onclick="window.open('${p.affiliateURL}','_blank')" style="margin-top:6px;width:100%;background:#fff;border:2px solid #075E54;border-radius:10px;padding:7px 0;cursor:pointer;color:#075E54;font-size:15px;box-shadow:0 1px 4px rgba(7,94,84,0.10);font-weight:500;">Ver en Thomann</button>
        </div>
      </div>`
    ).join("");

    return (
      `<div style="width:100%;max-width:370px;padding:0;margin:0 auto;">
        <div style="margin-bottom:8px;">Estos productos pueden coincidir con tu búsqueda:</div>
        ${listado}
        <div style="padding:12px 0 0 0;font-size:15px;color:#075E54;">
          ${pregunta_acotar}
        </div>
      </div>`
    );
  }

  // No encontró nada
  return `<div style="text-align:center;">No encontré ningún producto que coincida con tu búsqueda.<br>¿Puedes darme más detalles? ¿Marca, modelo, tipo de instrumento, etc.?</div>`;
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

// Búsqueda JSON para autocomplete (sigue igual)
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
