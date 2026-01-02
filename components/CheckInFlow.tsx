
import React, { useState, useRef, useEffect } from 'react';
import { FaceOverlay } from './FaceOverlay';
import { SessionData } from '../types';
import { analyzeFaceMultiFrame, initializeFaceMesh } from '../services/faceAnalysis';
import { analyzeHeartRate } from '../services/rppgAnalysis';
import { analyzeSkin } from '../services/skinAnalysis';
import { analyzeGaze } from '../services/gazeAnalysis';

interface CheckInFlowProps {
  stage: 'PRE' | 'POST';
  onComplete: (data: SessionData) => void;
}

export const CheckInFlow: React.FC<CheckInFlowProps> = ({ stage, onComplete }) => {
  const [step, setStep] = useState<'IDLE' | 'RECORDING' | 'ANALYZING' | 'TRANSCRIPT'>('IDLE');
  const [timeLeft, setTimeLeft] = useState(15);
  const [transcript, setTranscript] = useState('');
  const [isFaceMeshReady, setIsFaceMeshReady] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeFaceMesh().then(() => setIsFaceMeshReady(true));
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setStep('RECORDING');
      setTimeLeft(15);
    } catch (err) {
      alert("Error al acceder a la cámara. Por favor verifica los permisos.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    let timer: any;
    if (step === 'RECORDING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (step === 'RECORDING' && timeLeft === 0) {
      setStep('ANALYZING');
      // We don't stop camera yet because we might need it for analysis
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    if (step === 'ANALYZING') {
      performRealAnalysis();
    }
  }, [step]);

  const performRealAnalysis = async () => {
    if (!videoRef.current) return;

    try {
      setAnalysisStatus('Leyendo micro-gestos (FACS)...');
      const facs = await analyzeFaceMultiFrame(videoRef.current, 15, (p) => {
        setAnalysisProgress(Math.round(p * 0.4)); // FACS represents first 40%
      });

      setAnalysisStatus('Capturando pulso biológico (rPPG)...');
      const bio = await analyzeHeartRate(videoRef.current, 3500); // Reduced to 3.5s for speed
      setAnalysisProgress(80);

      setAnalysisStatus('Analizando textura de piel...');
      const skin = await analyzeSkin(videoRef.current);
      setAnalysisProgress(100);

      setAnalysisStatus('Finalizando mapeo...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX

      const gaze = analyzeGaze([]);

      const sessionData: SessionData = {
        facs,
        bio,
        skin,
        gaze,
        transcript: '',
        timestamp: new Date().toISOString(),
        stage
      };

      (window as any).tempSessionData = sessionData;

      setStep('TRANSCRIPT');
      stopCamera();
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("La captura falló. Por favor intenta de nuevo.");
      setStep('IDLE');
      stopCamera();
    }
  };

  const handleSubmit = () => {
    const baseData = (window as any).tempSessionData;
    if (baseData) {
      onComplete({
        ...baseData,
        transcript,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-100">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-neutral-800">
              {stage === 'PRE' ? 'Evaluación Inicial (Antes)' : 'Evaluación Final (Después)'}
            </h2>
            <div className={`px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${stage === 'PRE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              Etapa: {stage}
            </div>
          </div>

          {step === 'IDLE' && (
            <div className="text-center py-20 space-y-6">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                {!isFaceMeshReady ? (
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                )}
              </div>
              <h3 className="text-xl font-medium text-neutral-700">
                {isFaceMeshReady ? 'Comienza tu análisis neuro-somático' : 'Cargando modelos de IA...'}
              </h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                Grabaremos 15 segundos de video para extraer tus biomarcadores reales. Mantén una expresión natural y buena iluminación.
              </p>
              <button
                onClick={startCamera}
                disabled={!isFaceMeshReady}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-emerald-200"
              >
                {isFaceMeshReady ? 'Iniciar Captura' : 'Esperando...'}
              </button>
            </div>
          )}

          {(step === 'RECORDING' || step === 'ANALYZING') && (
            <div className="relative aspect-video rounded-2xl bg-black overflow-hidden group shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <FaceOverlay isAnalyzing={step === 'ANALYZING'} stage={stage} />

              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2" />
                {step === 'RECORDING' ? `00:${timeLeft.toString().padStart(2, '0')}` : 'PROCESANDO BIOMARCADORES...'}
              </div>

              {step === 'ANALYZING' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8">
                  <div className="w-full max-w-xs bg-white/20 h-1 rounded-full overflow-hidden mb-4">
                    <div
                      className="bg-[#2d4a3e] h-full transition-all duration-500 ease-out"
                      style={{ width: `${analysisProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-lg font-serif italic text-[#a7f3d0]">{analysisStatus}</p>
                  <p className="text-xs opacity-60 mt-2 font-mono">NEURAL ENGINE PROCESSING • {analysisProgress}%</p>
                </div>
              )}
            </div>
          )}

          {step === 'TRANSCRIPT' && (
            <div className="space-y-6">
              <h3 className="text-xl font-medium text-neutral-800">¿Cómo te sientes en este momento?</h3>
              <p className="text-sm text-neutral-500">Tus palabras proporcionan el contexto semántico necesario para el análisis de congruencia.</p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Describe brevemente tu estado interno..."
                className="w-full h-32 p-4 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              <button
                disabled={!transcript.trim()}
                onClick={handleSubmit}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl"
              >
                Finalizar Registro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
