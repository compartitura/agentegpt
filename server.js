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
  // Detecta el instrumento principal de la consulta
  let instrumentoBuscado = '';
  const instrumentos = ['saxofón','saxofon','saxophone','trompeta','trompete','trumpet','piano','violin','violín','guitarra','flauta','clarinete','batería','bateria','percusión','oboe','trompa','trombón','trombon','fagot','tuba','contrabajo','viola','cello','barítono','teclado'];
  for(let inst of instrumentos) {
    if((query.toLowerCase()).includes(inst)) {
      instrumentoBuscado = inst.charAt(0).toUpperCase() + inst.slice(1).toLowerCase();
      break;
    }
  }

  const marcas = [...new Set(sim.map(p => p.Brand).filter(Boolean))];
  let pregunta_acotar = '';
  if (marcas.length > 1) {
    pregunta_acotar = `¿Prefieres alguna marca${instrumentoBuscado ? ' de "'+instrumentoBuscado+'"' : ''} en concreto?`;
  } else {
    pregunta_acotar = `¿Te interesa algún modelo o característica especial?`;
  }

  // Botones de marcas sugeridas para ese instrumento
  let marcasBtns = '';
  if (marcas.length > 1 && instrumentoBuscado) {
    marcasBtns = 
    `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 13px;margin-top:13px;justify-content:center;" id="marcas-btns-cecilia">
      <span style="color:#222;font-size:15px;font-weight:700;margin-right:9px;">Nuestras marcas en la categoría:</span>
      ${marcas.slice(0,4).map(m =>
        `<button class="marca-busqueda-btn" data-query="${instrumentoBuscado} ${m}" style="background:#fff;color:#181818;border:2px solid #222;border-radius:8px;padding:7px 16px;font-size:14px;cursor:pointer;font-weight:600;box-shadow:none;transition:background .13s, color .13s;">
          ${m}
        </button>`
      ).join('')}
    </div>`;
  }

  // Productos en paralelo (máximo 4 columnas, responsive), cada card es un <a>
  let listado = `<div class="cecilia-productos-grid" style="
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 18px 16px;
    margin-bottom:18px;
    background:none;
  ">` +
    sim.slice(0, 4).map(p =>
    `<a href="${p.affiliateURL}" target="_blank" style="
      flex: 1 1 195px; 
      max-width: 225px; 
      min-width: 165px;
      background: #111; 
      border:2.5px solid var(--acento,#D4AF37); 
      border-radius:18px;
      padding:15px 7px 14px 7px; 
      display:flex; flex-direction:column; align-items:center; 
      box-shadow:0 4px 20px #000b;
      min-height: 350px;
      text-decoration: none;
      transition: box-shadow .22s cubic-bezier(.21,1.2,.32,1), transform .19s;
      position:relative;
      cursor:pointer;
      outline:none;
    " onmouseover="this.style.boxShadow='0 9px 32px #222a, 0 2px 8px #D4AF37'; this.style.transform='translateY(-4px)';" 
       onmouseout="this.style.boxShadow='0 4px 20px #000b'; this.style.transform='none';">
      <div style="
        width:100%;
        background:#fff;
        border:2px solid var(--acento,#D4AF37);
        border-radius:14px;
        padding:0 0 14px 0;
        display:flex;
        flex-direction:column;
        align-items:center;
        box-shadow:none;
        margin-bottom:7px;
      ">
        <div style="
          font-weight:800;
          font-size:16px;
          color:var(--primario,#2C3E50);
          margin-top:10px;
          margin-bottom:7px;
          text-align:center;
        ">${p.Brand} ${p.Model}</div>
        <img src="${p.ImageURL}" alt="${p.Brand} ${p.Model}" style="
          width:112px;
          height:112px;
          object-fit:cover;
          border-radius:11px;
          margin-bottom:0;
          box-shadow:none;
        ">
        ${p.Description ? `<div style="
          font-size:14px;
          color:var(--primario,#2C3E50);
          margin:11px 0 0 0;
          text-align:center;
          max-width:97%;
        ">${p.Description}</div>` : ''}
      </div>
      <div style="
        margin-top:auto;
        width: 100%;
        display:flex;
        justify-content:center;
        align-items:end;
      ">
        <div style="
          background:#fff;
          color:#181818;
          font-weight:700;
          padding:7px 18px;
          font-size:14px;
          border:2px solid var(--acento,#D4AF37);
          border-radius:9px;
          text-decoration:none;
          box-shadow:none;
          transition:background 0.13s, color 0.13s;
          width: 90%;
          text-align:center;
          margin-bottom:0;
          margin-top:10px;
          pointer-events:none;
          user-select:none;
        ">
          Más información
        </div>
      </div>
    </a>`
  ).join('') + `</div>`;

  return (
    `<div style="width:100%;max-width:950px;padding:0;margin:0 auto;">
      <div style="margin-bottom:12px;color:var(--acento,#D4AF37);font-size:19px;font-weight:800;text-align:center;">
        Productos destacados para tu búsqueda:
      </div>
      ${listado}
      <div style="padding:8px 0 0 0;font-size:15px;color:#fff;font-weight:600;text-align:center;">
        ${pregunta_acotar}
        ${marcasBtns}
      </div>
    </div>
    <script>
    // Botones de marcas: ahora usan event delegation robusto y click real en el botón de enviar
    setTimeout(function(){
      var grid = document.getElementById('marcas-btns-cecilia');
      if(grid && !grid.dataset.listener){
        grid.addEventListener('click', function(e){
          var btn = e.target.closest('.marca-busqueda-btn');
          if(btn){
            var msg = btn.getAttribute('data-query');
            var input = document.getElementById('wa-input');
            if(input){
              input.value = msg;
              // Busca el botón de enviar (submit) dentro del mismo formulario:
              var form = input.closest('form');
              if(form){
                var enviarBtn = form.querySelector('.wa-btn-enviar');
                if(enviarBtn){
                  setTimeout(function(){ enviarBtn.click(); }, 60);
                } else {
                  setTimeout(function(){ form.submit(); }, 80);
                }
              }
            }
          }
        });
        grid.dataset.listener = "1";
      }
    }, 120);
    </script>
    `
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