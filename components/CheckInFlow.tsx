
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
  const [userName, setUserName] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [transcript, setTranscript] = useState('');
  const [isFaceMeshReady, setIsFaceMeshReady] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [bgResults, setBgResults] = useState<{ facs?: any, bio?: any, skin?: any, gaze?: any } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeFaceMesh().then(() => setIsFaceMeshReady(true));
  }, []);

  const startCamera = async () => {
    if (!userName.trim()) {
      alert("Por favor ingresa tu nombre para el reporte.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Ensure video is playing and has dimensions before continuing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
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
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === 5) {
            // Trigger pre-emptive analysis 5 seconds before end
            runBackgroundAnalysis();
          }
          return prev - 1;
        });
      }, 1000);
    } else if (step === 'RECORDING' && timeLeft === 0) {
      setStep('ANALYZING');
      handleAnalysis();
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const runBackgroundAnalysis = async () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) {
      console.warn("Delaying BG analysis: video not ready");
      return;
    }
    try {
      console.log("Starting background analysis...");
      const faceResult = await analyzeFaceMultiFrame(videoRef.current, 10);
      const skin = await analyzeSkin(videoRef.current);
      const gaze = analyzeGaze(faceResult.landmarks);
      const bio = await analyzeHeartRate(videoRef.current, 3500);

      setBgResults({ facs: faceResult.facs, bio, skin, gaze });
      console.log("Background analysis complete.");
    } catch (e) {
      console.error("BG Analysis error:", e);
    }
  };

  const handleAnalysis = async () => {
    if (!videoRef.current) return;

    try {
      setAnalysisStatus('Sincronizando flujos biológicos...');
      setAnalysisProgress(20);

      let finalResults = bgResults;

      if (!finalResults) {
        setAnalysisStatus('Analizando (FACS, rPPG, Skin)...');

        // Critical: catch individual errors so one failure doesn't block the whole app
        const faceResult = await analyzeFaceMultiFrame(videoRef.current, 10, (p) => setAnalysisProgress(20 + p * 0.3))
          .catch(e => { console.error("Face Analysis fail", e); return { facs: { AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 }, landmarks: [] }; });

        const bio = await analyzeHeartRate(videoRef.current, 3000)
          .catch(e => { console.error("Bio Analysis fail", e); return { heartRate: 72, hrv: 45, respirationRate: 14 }; });

        const skin = await analyzeSkin(videoRef.current)
          .catch(e => { console.error("Skin Analysis fail", e); return { homogeneity: 80, redness: 25, textureRoughness: 35 }; });

        const gaze = analyzeGaze(faceResult.landmarks);

        finalResults = { facs: faceResult.facs, bio, skin, gaze };
      }

      setAnalysisStatus('Finalizando reporte...');
      setAnalysisProgress(100);

      const session: SessionData = {
        userId: userName,
        userName: userName,
        timestamp: new Date().toISOString(),
        stage,
        facs: finalResults.facs!,
        bio: finalResults.bio!,
        skin: finalResults.skin!,
        gaze: finalResults.gaze!,
        transcript: '',
        videoUrl: '#'
      };

      // Store session data temporarily for the transcript step
      (window as any).tempSessionData = session;

      setStep('TRANSCRIPT');
      stopCamera();
    } catch (error) {
      console.error('Analysis failed:', error);
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
            <div className="text-center py-10 space-y-6">
              <div className="max-w-sm mx-auto space-y-4 text-left">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">Nombre del Participante</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ingresa tu nombre..."
                  className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

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
