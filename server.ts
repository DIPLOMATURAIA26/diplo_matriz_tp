import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily/safely
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    // Primero intenta process.env (Vercel/Node)
    let apiKey = process.env.GEMINI_API_KEY;
    
    // Si no está disponible, muestra warning
    if (!apiKey) {
      console.warn("⚠️ WARNING: GEMINI_API_KEY environment variable is not set.");
      console.warn("   - En desarrollo: agrega a .env (npm run dev)");
      console.warn("   - En Vercel: agrega en Settings → Environment Variables");
    }
    
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Analyze bank risk matrix and generate structured report
app.post("/api/analyze", async (req: Request, res: Response) => {
  try {
    const { banks, year, thresholds } = req.body;
    if (!banks || !Array.isArray(banks) || banks.length === 0) {
      res.status(400).json({ error: "Debe proveer una lista de bancos válida para el análisis." });
      return;
    }

    const ai = getGeminiClient();
    
    // Format the banks data clearly for the model
    const formattedBanksText = banks.map(b => 
      `- ID: ${b.code} | Nombre: ${b.name} | Depósitos: ${b.deposits} | Clientes: ${b.clients} | Auditoría Interna: ${b.audit} | Total: ${b.total} | Riesgo: ${b.riskLevel}`
    ).join("\n");

    // Format custom thresholds for the model if provided
    let thresholdsDescription = "";
    if (thresholds) {
      thresholdsDescription = `
Reglas de Calibración del Sistema actualizadas por el usuario:
- Coeficiente Volumen de Depósitos:
  * > $${thresholds.dep1Val} Millones: ${thresholds.dep1Score} pts
  * entre $${thresholds.dep2Val} y $${thresholds.dep1Val} Millones: ${thresholds.dep2Score} pts
  * entre $${thresholds.dep3Val} y $${thresholds.dep2Val} Millones: ${thresholds.dep3Score} pts
  * < $${thresholds.dep3Val} Millones: ${thresholds.dep4Score} pts
- Coeficiente Cantidad de Clientes:
  * >= ${thresholds.cli1Val.toLocaleString()} clientes: ${thresholds.cli1Score} pts
  * entre ${thresholds.cli2Val.toLocaleString()} y ${thresholds.cli1Val.toLocaleString()} clientes: ${thresholds.cli2Score} pts
  * entre ${thresholds.cli3Val.toLocaleString()} y ${thresholds.cli2Val.toLocaleString()} clientes: ${thresholds.cli3Score} pts
  * < ${thresholds.cli3Val.toLocaleString()} clientes: ${thresholds.cli4Score} pts
- Coeficiente Auditoría Interna:
  * > ${thresholds.aud1Val} observaciones: ${thresholds.aud1Score} pts
  * entre ${thresholds.aud2Val} y ${thresholds.aud1Val} observaciones: ${thresholds.aud2Score} pts
  * entre ${thresholds.aud3Val} y ${thresholds.aud2Val} observaciones: ${thresholds.aud3Score} pts
  * <= ${thresholds.aud3Val} observaciones: ${thresholds.aud4Score} pts
`;
    }

    const systemInstruction = `Eres un Analista Experto en Riesgo Financiero y Prevención de Lavado de Activos / Financiamiento del Terrorismo (PLA/FT). Tu tarea es actuar como el motor de inteligencia analítica para un Sistema de Supervisión Bancaria centralizado.

Recibirás un conjunto de datos que contiene la Matriz de Riesgo Consolidada del periodo elegido. Esta matriz fue cruzada y validada basándose exclusivamente en el ID único de la entidad (Número de Entidad).

La matriz evalúa a las entidades financieras utilizando 3 variables críticas:
1. Coeficiente Volumen de Depósitos
2. Coeficiente Cantidad de Clientes
3. Coeficiente Observaciones de Auditoría Interna

Las reglas de clasificación de riesgo según el Coeficiente Total son:
- Alto Riesgo: Desde 130 puntos o más.
- Medio Riesgo: De 90 a 129 puntos.
- Bajo Riesgo: Inferior a 90 puntos.

${thresholdsDescription}

Analiza los datos provistos y genera un reporte ejecutivo estructurado en ESPAÑOL utilizando exactamente este formato de Markdown:

### 📊 RESUMEN EJECUTIVO DE RIESGO [Año]
(Escribe un párrafo analítico y gerencial de máximo 4 líneas resumiendo la situación general del sistema financiero)

### 🚨 ALERTAS DE SUPERVISIÓN PRIORITARIA
- Menciona los bancos con mayor riesgo

### 💡 HALLAZGOS Y ANOMALÍAS DETECTADAS
- Identifica tendencias generales de riesgo

Mantén un tono sumamente profesional, corporativo, directo y técnico.`;

    const prompt = `Aquí están los datos consolidados del periodo / año ${year || "2025"}:\n\n${formattedBanksText}\n\nPor favor, genera el reporte de análisis ejecutivo.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
      }
    });

    res.json({ report: response.text });
  } catch (error: any) {
    console.error("Error en /api/analyze:", error);
    res.status(500).json({ error: error.message || "Error al procesar el análisis con Gemini AI." });
  }
});

// 2. API: Assistant consultation for custom query regarding specific bank data
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { messages, banks, year } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Formato de conversación inválido." });
      return;
    }

    const ai = getGeminiClient();

    const formattedBanksText = banks && Array.isArray(banks) 
      ? banks.map(b => `- ${b.name} (Cod ${b.code}): Depósitos: ${b.deposits}/40, Clientes: ${b.clients}/120, Auditoría: ${b.audit}/30. Total: ${b.total} (${b.riskLevel})`).join("\n")
      : "No se ha cargado una lista de bancos aún.";

    const systemInstruction = `Eres un Analista Experto en Riesgo Financiero. Actúas como asesor de supervisión bancaria.

Datos de la Matriz ${year || "2025"}:
${formattedBanksText}

Reglas del sistema:
- Coeficiente Volumen de Depósitos (Máx. 40)
- Coeficiente Cantidad de Clientes (Máx. 120)
- Coeficiente Observaciones de Auditoría Interna (Máx. 30)
- Alto Riesgo: >= 130 puntos.
- Medio Riesgo: 90 a 129 puntos.
- Bajo Riesgo: < 90 puntos.

Responde de manera sumamente profesional y técnica en ESPAÑOL.`;

    // Map conversation messages
    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Error en /api/chat:", error);
    res.status(500).json({ error: error.message || "Error al procesar la consulta con Gemini AI." });
  }
});

// Configure Vite or Static files
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// If running in a serverless environment like Vercel, do not call app.listen()
if (!process.env.VERCEL) {
  setupServer();
}

export default app;
