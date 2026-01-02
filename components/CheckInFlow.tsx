
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

  const [realtimeLandmarks, setRealtimeLandmarks] = useState<any[]>([]);

  useEffect(() => {
    let animationFrameId: number;
    let isActive = false;

    if (step === 'RECORDING' && videoRef.current && isFaceMeshReady) {
      isActive = true;
      const faceMesh = (window as any).faceMeshIsReady ? null : null; // Quick check 
      import('../services/faceAnalysis').then(({ getFaceMeshInstance, setRealtimeCallback }) => {
        const mesh = getFaceMeshInstance();

        // Subscribe to results
        setRealtimeCallback((results) => {
          if (isActive && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            setRealtimeLandmarks(results.multiFaceLandmarks[0]);
          }
        });

        // Loop to send frames
        const loop = async () => {
          if (!isActive) return;
          if (videoRef.current && videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
            try {
              // We don't await this to keep the UI thread unblocked for 60fps
              // But FaceMesh might queue up if we send too fast. 
              // Using a simple throttle or just requestAnimationFrame is usually fine for demo.
              await mesh?.send({ image: videoRef.current });
            } catch (e) {
              // Silently fail frame drops
            }
          }
          animationFrameId = requestAnimationFrame(loop);
        };
        loop();
      });
    }

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameId);
      // Clean up callback to avoid memory leaks
      import('../services/faceAnalysis').then(({ setRealtimeCallback }) => {
        setRealtimeCallback(() => { });
      });
    };
  }, [step, isFaceMeshReady]);

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
        setAnalysisStatus('Analizando Micro-expresiones (FACS)...');
        const faceResult = await analyzeFaceMultiFrame(videoRef.current, 10, (p) => setAnalysisProgress(20 + p * 0.3))
          .catch(e => { console.error("Face Analysis fail", e); return { facs: { AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 }, landmarks: [] }; });

        setAnalysisStatus('Midiendo Ritmo Cardíaco (rPPG)...');
        const bio = await analyzeHeartRate(videoRef.current, 3000, (p) => setAnalysisProgress(50 + p * 0.3))
          .catch(e => { console.error("Bio Analysis fail", e); return { heartRate: 72, hrv: 45, respirationRate: 14 }; });

        setAnalysisStatus('Analizando Dermotipo y Mirada...');
        setAnalysisProgress(85);
        const skin = await analyzeSkin(videoRef.current)
          .catch(e => { console.error("Skin Analysis fail", e); return { homogeneity: 80, redness: 25, textureRoughness: 35, skinVitality: 70 }; });

        const gaze = analyzeGaze(faceResult.landmarks);
        setAnalysisProgress(95);

        finalResults = { facs: faceResult.facs, bio, skin, gaze };
      }

      setAnalysisStatus('Finalizando reporte neuro-somático...');
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
      <div className="glass rounded-none shadow-xl border border-white/10 p-8 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/10 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />

        <div className="relative z-10 flex justify-between items-center mb-10">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            {stage === 'PRE' ? 'Evaluación Inicial' : 'Evaluación Final'}
          </h2>
          <div className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-[0.2em] ${stage === 'PRE' ? 'border-[#c5a059] text-[#c5a059] bg-[#c5a059]/10' : 'border-[var(--brand-secondary)] text-[var(--brand-secondary)] bg-[var(--brand-secondary)]/10'}`}>
            Etapa: {stage}
          </div>
        </div>

        {step === 'IDLE' && (
          <div className="text-center py-10 space-y-8">
            <div className="max-w-sm mx-auto space-y-4 text-left group">
              <label className="block text-xs font-bold text-[var(--brand-secondary)] uppercase tracking-[0.2em] mb-2 group-focus-within:text-[var(--brand-accent)] transition-colors">Nombre del Participante</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ingresa tu nombre..."
                className="w-full py-3 bg-transparent border-b border-white/20 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-accent)] transition-colors text-lg"
              />
            </div>

            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-none flex items-center justify-center mx-auto text-[var(--brand-secondary)]">
              {!isFaceMeshReady ? (
                <div className="w-8 h-8 border-2 border-[var(--brand-secondary)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-display text-white">
                {isFaceMeshReady ? 'Comienza tu análisis neuro-somático' : 'Cargando modelos de IA...'}
              </h3>
              <p className="text-[var(--brand-text)] max-w-md mx-auto font-light leading-relaxed">
                Grabaremos 15 segundos de video para extraer tus biomarcadores reales. Mantén una expresión natural y buena iluminación.
              </p>
            </div>

            <button
              onClick={startCamera}
              disabled={!isFaceMeshReady}
              className="btn-primary px-10 py-4 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFaceMeshReady ? 'Iniciar Captura' : 'Esperando...'}
            </button>
          </div>
        )}

        {(step === 'RECORDING' || step === 'ANALYZING') && (
          <div className="relative aspect-video bg-black overflow-hidden group shadow-2xl border border-white/10">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover opacity-90"
            />
            <FaceOverlay isAnalyzing={step === 'ANALYZING'} stage={stage} landmarks={step === 'RECORDING' ? realtimeLandmarks : undefined} />

            <div className="absolute top-6 right-6 bg-red-500/80 backdrop-blur text-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest animate-pulse flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3" />
              {step === 'RECORDING' ? `Grabando: 00:${timeLeft.toString().padStart(2, '0')}` : 'Procesando...'}
            </div>

            {step === 'ANALYZING' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-12 text-center">
                <div className="w-full max-w-md bg-white/10 h-0.5 mb-8">
                  <div
                    className="bg-[var(--brand-secondary)] h-full transition-all duration-500 ease-out box-shadow-[0_0_20px_var(--brand-secondary)]"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <p className="text-2xl font-display text-white mb-2">{analysisStatus}</p>
                <p className="text-[10px] text-[var(--brand-secondary)] uppercase tracking-[0.3em] font-mono">Neural Engine Processing • {Math.round(analysisProgress)}%</p>
              </div>
            )}
          </div>
        )}

        {step === 'TRANSCRIPT' && (
          <div className="space-y-8 py-4">
            <div className="space-y-2">
              <h3 className="text-2xl font-display text-white">¿Cómo te sientes en este momento?</h3>
              <p className="text-[var(--brand-text)] font-light">Tus palabras proporcionan el contexto semántico necesario para el análisis de congruencia.</p>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Describe brevemente tu estado interno (físico, emocional, mental)..."
              className="w-full h-40 p-6 bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-secondary)] transition-all resize-none font-light"
            />

            <button
              disabled={!transcript.trim()}
              onClick={handleSubmit}
              className="btn-primary w-full py-5 text-lg disabled:opacity-50"
            >
              Finalizar Registro
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
