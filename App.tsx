
import React, { useState, useEffect } from 'react';
import { CheckInFlow } from './components/CheckInFlow';
import { ComparisonView } from './components/ComparisonView';
import { Auth } from './components/Auth';
import { SessionData } from './types';
import { supabase } from './services/supabaseClient';
import { saveSession } from './services/sessionService';

function App() {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'HOME' | 'PRE_CHECKIN' | 'PROGRESS' | 'POST_CHECKIN' | 'REPORT' | 'HISTORY'>('HOME');
  const [preData, setPreData] = useState<SessionData | null>(null);
  const [postData, setPostData] = useState<SessionData | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePreComplete = async (data: SessionData) => {
    try {
      if (session) {
        await saveSession(data);
      }
      setPreData(data);
      setCurrentView('PROGRESS');
    } catch (e) {
      console.error("Error saving pre-session:", e);
      setPreData(data);
      setCurrentView('PROGRESS');
    }
  };

  const handlePostComplete = async (data: SessionData) => {
    try {
      if (session) {
        await saveSession(data);
      }
      setPostData(data);
      setCurrentView('REPORT');
    } catch (e) {
      console.error("Error saving post-session:", e);
      setPostData(data);
      setCurrentView('REPORT');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen relative flex items-center justify-center py-12 px-6 overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/mountain-bg.png"
            alt="Mountain Sanctuary"
            className="w-full h-full object-cover scale-105 animate-pulse-soft"
          />
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-12 h-12 bg-[#2d4a3e] rounded-full shadow-2xl border-2 border-white/20" />
            <span className="text-4xl font-serif font-bold tracking-tight text-white drop-shadow-md">Neurosomatic-mirror</span>
          </div>
          <div className="glass p-8 rounded-[2rem] shadow-2xl max-w-md w-full">
            <Auth />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[var(--brand-bg)] text-[var(--brand-text)] selection:bg-[var(--brand-accent)] selection:text-white">
      {/* Navigation / Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--brand-bg)]/80 backdrop-blur-md border-b border-white/5 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setCurrentView('HOME')}
          >
            <div className="w-10 h-10 bg-[var(--brand-secondary)] rounded-none shadow-inner group-hover:bg-white transition-colors duration-500" />
            <span className="text-2xl font-display font-bold tracking-tight text-white uppercase group-hover:text-[var(--brand-secondary)] transition-colors">Espejo-Neurosomático</span>
          </div>

          <nav className="flex items-center space-x-8 text-sm font-bold text-neutral-400 tracking-widest uppercase">
            <button
              onClick={() => setCurrentView('HOME')}
              className={`hover:text-white transition-colors ${currentView === 'HOME' ? 'text-white border-b border-[var(--brand-accent)]' : ''}`}
            >
              Inicio
            </button>
            <button
              className="btn-ghost px-6 py-2 text-xs"
              onClick={() => supabase.auth.signOut()}
            >
              Cerrar Sesión
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-12 px-8 z-10">
        {currentView === 'HOME' && (
          <div className="relative isolate pt-14">
            <div
              className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fcfaf7]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
                <div className="text-left space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
                  <div className="inline-flex items-center space-x-2 bg-white/5 text-[var(--brand-secondary)] px-6 py-2 border border-[var(--brand-secondary)] text-xs font-bold uppercase tracking-[0.2em]">
                    Sanctuary Edition • v2.0
                  </div>
                  <h1 className="text-7xl md:text-8xl xl:text-9xl font-display text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
                    Tu esencia, <br />
                    <span className="text-[var(--brand-primary)] italic">reflejada.</span>
                  </h1>
                  <p className="text-2xl text-[var(--brand-text)] max-w-xl leading-relaxed font-light opacity-90">
                    Un viaje introspectivo donde la tecnología de montaña decodifica tu estado biológico y emocional.
                  </p>
                  <div className="pt-8 flex justify-start gap-4">
                    <button
                      onClick={() => setCurrentView('PRE_CHECKIN')}
                      className="btn-primary flex items-center space-x-3 text-xl"
                    >
                      <span>Comenzar Evaluación</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                    <button
                      className="btn-ghost flex items-center space-x-3"
                      onClick={() => window.open('/docs/index.html', '_blank')}
                    >
                      <span>Leer Manifiesto</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-1000">
                  <div className="relative w-full max-w-[450px]">
                    <div className="absolute inset-0 bg-[var(--brand-primary)] blur-[120px] rounded-full -z-10 opacity-40" />
                    <img
                      src="/hero-face.png"
                      alt="Espejo-Neurosomático Digital Reveal"
                      className="w-full h-auto drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700 grayscale hover:grayscale-0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8 pt-20 border-t border-white/10">
                <FeatureCard
                  title="FACS Pro"
                  desc="Micro-gestos decodificados mediante Teoría Polivagal."
                  icon="🏔️"
                />
                <FeatureCard
                  title="rPPG Biomarkers"
                  desc="Evaluación de resiliencia del sistema nervioso autónomo."
                  icon="🌿"
                />
                <FeatureCard
                  title="Narrativa de Paz"
                  desc="Integración de biomarcadores con semántica de sanación."
                  icon="✨"
                />
              </div>
            </div>
          </div>
        )}

        {currentView === 'PRE_CHECKIN' && (
          <CheckInFlow stage="PRE" onComplete={handlePreComplete} />
        )}

        {currentView === 'PROGRESS' && (
          <div className="max-w-2xl mx-auto text-center space-y-12 py-20 glass rounded-[3rem] p-12 shadow-2xl border border-white/40">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 bg-[#2d4a3e]/10 rounded-full animate-ping opacity-25" />
              <div className="relative w-full h-full bg-[#2d4a3e]/5 rounded-full flex items-center justify-center text-[#2d4a3e] border border-[#2d4a3e]/10">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-serif font-bold text-neutral-800">Mapeo inicial completado.</h2>
              <p className="text-xl text-stone-600 leading-relaxed font-light px-8">
                Tus biomarcadores base del retiro han sido registrados. Es momento de sumergirte en la montaña.
              </p>
            </div>
            <button
              onClick={() => setCurrentView('POST_CHECKIN')}
              className="bg-neutral-900 text-white px-12 py-5 rounded-full font-bold shadow-lg hover:bg-neutral-800 transition-all text-lg"
            >
              Simular Final del Retiro
            </button>
          </div>
        )}

        {currentView === 'POST_CHECKIN' && (
          <CheckInFlow stage="POST" onComplete={handlePostComplete} />
        )}

        {currentView === 'REPORT' && preData && postData && (
          <ComparisonView pre={preData} post={postData} />
        )}
      </main>

      <footer className="p-12 border-t border-neutral-100 text-center bg-white">
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-[0.4em]">
          &copy; 2026 Neurosomatic-mirror &bull; IA.AGUS
        </p>
      </footer>
    </div>
  );
}

const FeatureCard: React.FC<{ title: string, desc: string, icon: string }> = ({ title, desc, icon }) => (
  <div className="glass p-10 rounded-none border-l-2 border-[var(--brand-secondary)] hover:border-[var(--brand-accent)] transition-all group hover:-translate-y-2">
    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform inline-block drop-shadow-md grayscale group-hover:grayscale-0">{icon}</div>
    <h3 className="text-2xl font-display font-bold text-white mb-4 group-hover:text-[var(--brand-secondary)] transition-colors">{title}</h3>
    <p className="text-neutral-400 leading-relaxed font-light">{desc}</p>
  </div>
);

export default App;
