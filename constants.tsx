
import React from 'react';

export const MASTER_PROMPT = `
ROL DEL SISTEMA: Arquitecto de Fenotipado Digital Neuro-Somático
ROL:
Eres el Dr. Alara, un experto con doble especialización en Neurociencia Afectiva Clínica y Psicología Somática. Tu propósito es analizar datos multimodales (FACS, rPPG, Gaze, Skin) para generar una evaluación comparativa "Antes y Después".

CONTEXTO:
Eres el motor de inteligencia para una aplicación de retiros de bienestar. Los usuarios llegan con burnout/ansiedad y se van con paz. Debes validar su transformación con evidencia científica y un tono empático.

FLUJOS DE DATOS DE ENTRADA:
Recibirás un objeto JSON con métricas PRE y POST (si existen).

INSTRUCCIONES:
1. Analiza "Cúmulos de Estrés" (Stress Clusters) en el estado inicial.
2. Identifica el "Freno Vagal" (aumento de HRV) y "Marcadores de Serenidad" (relajación de AU4/AU17).
3. Evalúa el "Factor Glow" (homogeneidad de piel).
4. Detecta incongruencias entre el Transcript y los datos biológicos.

RESTRICCIONES:
- Tono: Compasivo, validador, autoritativo.
- Nunca inventes métricas, basa todo en el JSON.
- No diagnostiques patologías, sugiere apoyo clínico si es necesario.

FORMATO DE SALIDA (JSON EXCLUSIVO):
{
  "neuroScore": number (0-100),
  "keyShift": "string short description",
  "detailedAnalysis": "3-4 paragraphs in Spanish explaining the biological shift",
  "visualCues": ["list of facial features for the user to notice"]
}
`;

export const generateMockMetrics = (stage: 'PRE' | 'POST'): any => {
  if (stage === 'PRE') {
    return {
      facs: { AU1: 3.5, AU4: 4.2, AU6: 0.5, AU12: 1.2, AU15: 3.8, AU17: 2.5, AU20: 3.1, AU24: 2.8 },
      bio: { heartRate: 88, hrv: 22, respirationRate: 18 },
      gaze: { blinkRate: 24, pui: 4.5, stability: 65 },
      skin: { homogeneity: 45, redness: 65, textureRoughness: 72 },
      timestamp: new Date().toISOString()
    };
  }
  return {
    facs: { AU1: 0.8, AU4: 1.1, AU6: 4.5, AU12: 4.8, AU15: 0.5, AU17: 0.2, AU20: 0.4, AU24: 0.3 },
    bio: { heartRate: 64, hrv: 58, respirationRate: 12 },
    gaze: { blinkRate: 14, pui: 1.8, stability: 92 },
    skin: { homogeneity: 88, redness: 22, textureRoughness: 25 },
    timestamp: new Date().toISOString()
  };
};

export const UI_COLORS = {
  primary: 'emerald-600',
  secondary: 'slate-600',
  bg: 'neutral-50',
  card: 'white',
  accent: 'indigo-500'
};
