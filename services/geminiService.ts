
import { GoogleGenAI, Type } from "@google/genai";
import { MASTER_PROMPT } from "../constants";
import { SessionData, AssessmentResult } from "../types";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeTransformation = async (pre: SessionData, post?: SessionData): Promise<AssessmentResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY no está configurada. Por favor, añádela en el archivo .env.local");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Analiza los siguientes datos de fenotipado digital.
    ESTADO PRE-RETIRO:
    ${JSON.stringify(pre, null, 2)}
    
    ${post ? `ESTADO POST-RETIRO:\n${JSON.stringify(post, null, 2)}` : 'SOLO EVALUACIÓN INICIAL DISPONIBLE.'}
    
    Procesa esto siguiendo las instrucciones del Dr. Alara y devuelve el JSON solicitado.
  `;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
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

      const text = response.text;
      if (!text) throw new Error("No se recibió respuesta de la IA");
      
      const result = JSON.parse(text.trim());
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`Intento ${attempt}/${MAX_RETRIES} falló:`, error);
      
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }

  // Fallback response if all retries fail
  console.error("Todos los intentos fallaron. Retornando análisis de respaldo.");
  return {
    neuroScore: 50,
    keyShift: "Análisis temporalmente no disponible",
    detailedAnalysis: "No pudimos conectar con el servicio de análisis en este momento. Por favor, verifica tu conexión a internet y la configuración de la API key. Tus datos han sido guardados y puedes intentar generar el análisis nuevamente más tarde.",
    visualCues: ["Servicio temporalmente no disponible"]
  };
};
