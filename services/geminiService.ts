
import { GoogleGenAI, Type } from "@google/genai";
import { MASTER_PROMPT } from "../constants";
import { SessionData, AssessmentResult } from "../types";

const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeTransformation = async (pre: SessionData, post?: SessionData): Promise<AssessmentResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error("VITE_GEMINI_API_KEY no está configurada o es inválida en .env.local");
  }

  const ai = new GoogleGenAI({ apiKey });

  const userMessage = `
    Analiza los siguientes datos de fenotipado digital, prestando especial atención a los nuevos marcadores de vitalidad profunda.
    
    ESTADO PRE-RETIRO:
    ${JSON.stringify(pre, null, 2)}
    
    ${post ? `ESTADO POST-RETIRO:\n${JSON.stringify(post, null, 2)}` : 'SOLO EVALUACIÓN INICIAL DISPONIBLE.'}
    
    IMPORTANTE:
    - Interpreta la "fatigueIndex" (0-100) como carga alostática acumulada. >60 indica burnout neurofisiológico.
    - Interpreta la "skinVitality" (0-100) como "Resplandor Vagal". Un aumento indica mejor oxigenación y reducción de inflamación sistémica.
    
    Procesa esto siguiendo las instrucciones del Dr. Alara y devuelve el JSON solicitado.
  `;

  let lastError: any = null;

  // Primary model: 1.5-flash (ultra stable), Secondary: 2.0-flash-exp
  const models = ["gemini-1.5-flash", "gemini-2.0-flash-exp"];

  for (const modelName of models) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Intentando análisis con ${modelName} (intento ${attempt})...`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          config: {
            systemInstruction: MASTER_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                neuroScore: { type: Type.NUMBER },
                keyShift: { type: Type.STRING },
                detailedAnalysis: { type: Type.STRING },
                visualCues: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
              },
              required: ["neuroScore", "keyShift", "detailedAnalysis", "visualCues"]
            }
          },
        });

        // The @google/genai SDK returns text via candidates
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          throw new Error(`Respuesta vacía de ${modelName}`);
        }

        console.log(`[DEBUG] Raw text from ${modelName}:`, text.substring(0, 200));

        // Robust JSON extraction
        let cleanText = text.trim();

        // Remove markdown backticks if present
        if (cleanText.includes('```')) {
          const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) cleanText = match[1].trim();
        }

        // If it's still invalid or has trailing text (like the error suggests at pos 4)
        // extract the FIRST valid JSON object/array
        const firstObjectMatch = cleanText.match(/[\{\[]([\s\S]*)[\}\]]/);
        if (firstObjectMatch) {
          cleanText = firstObjectMatch[0];
        }

        try {
          const result = JSON.parse(cleanText);
          console.log("Análisis completado exitosamente.");
          return result;
        } catch (parseError) {
          console.error(`[CRÍTICO] Fallo al parsear JSON de ${modelName}:`, cleanText);
          throw new Error(`Error de formato en la respuesta de IA: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
      } catch (error: any) {
        lastError = error;
        console.error(`Error con ${modelName} (intento ${attempt}):`, error.message || error);

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY);
        }
      }
    }
  }

  // Fallback response if all models/retries fail
  console.error("Fallo crítico en el servicio de IA. Usando fallback.");
  return {
    neuroScore: 50,
    keyShift: "Análisis temporalmente limitado",
    detailedAnalysis: `Lo sentimos, hubo un problema técnico: ${lastError?.message || 'Error desconocido'}. Tus datos biométricos están a salvo y se muestran arriba. Por favor verifica que tu API Key de Gemini sea válida.`,
    visualCues: ["Modo de compatibilidad activado"]
  };
};
