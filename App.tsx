
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
      <div className="min-h-screen bg-[#F9FAF9] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-12">
            <div className="w-10 h-10 bg-emerald-600 rounded-full shadow-lg" />
            <span className="text-3xl font-serif font-bold tracking-tight text-neutral-800">Biology Mirror</span>
          </div>
          <Auth />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F9FAF9]">
      {/* Navigation / Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setCurrentView('HOME')}
          >
            <div className="w-8 h-8 bg-emerald-600 rounded-full" />
            <span className="text-xl font-serif font-bold tracking-tight text-neutral-800">Biology Mirror</span>
          </div>

          <nav className="flex items-center space-x-8 text-sm font-medium text-neutral-500">
            <button
              onClick={() => setCurrentView('HOME')}
              className={`hover:text-emerald-600 transition-colors ${currentView === 'HOME' ? 'text-emerald-600' : ''}`}
            >
              Inicio
            </button>
            <button
              className="bg-neutral-900 text-white px-5 py-2 rounded-full hover:bg-neutral-800 transition-all text-xs"
              onClick={() => supabase.auth.signOut()}
            >
              Cerrar Sesión
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-12 px-6">
        {currentView === 'HOME' && (
          <div className="max-w-5xl mx-auto space-y-24">
            <div className="text-center space-y-8 py-12">
              <div className="inline-flex items-center space-x-2 bg-emerald-600/5 text-emerald-700 px-6 py-2 rounded-full border border-emerald-600/10 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                Biology Mirror Core 2.0
              </div>
              <h1 className="text-6xl md:text-8xl font-serif font-bold text-neutral-900 leading-none tracking-tighter">
                Haz visible tu <br />
                <span className="text-emerald-600 italic">sanación.</span>
              </h1>
              <p className="text-2xl text-neutral-500 max-w-3xl mx-auto leading-relaxed font-light italic">
                La ciencia de la transformación invisible, ahora decodificada en tiempo real mediante biomarcadores digitales.
              </p>
              <div className="pt-8 flex justify-center space-x-6">
                <button
                  onClick={() => setCurrentView('PRE_CHECKIN')}
                  className="bg-emerald-600 text-white px-12 py-5 rounded-full font-bold shadow-2xl hover:bg-emerald-700 transition-all transform hover:-translate-y-1 text-lg"
                >
                  Comenzar Evaluación
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-12 pt-12">
              <FeatureCard
                title="FACS Pro"
                desc="Nuestro motor MediaPipe analiza micro-expresiones de tensión y relajación en milisegundos."
                icon="👁️"
              />
              <FeatureCard
                title="rPPG Biomarkers"
                desc="Extraemos tu HRV y pulso directamente desde el color de tu piel, sin dispositivos externos."
                icon="❤️"
              />
              <FeatureCard
                title="Clínica Digital"
                desc="IA Dr. Alara sintetiza tus cambios biológicos en una narrativa de sanación profunda."
                icon="🧠"
              />
            </div>
          </div>
        )}

        {currentView === 'PRE_CHECKIN' && (
          <CheckInFlow stage="PRE" onComplete={handlePreComplete} />
        )}

        {currentView === 'PROGRESS' && (
          <div className="max-w-2xl mx-auto text-center space-y-12 py-20 bg-white rounded-[3rem] p-12 shadow-xl border border-neutral-100">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25" />
              <div className="relative w-full h-full bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-serif font-bold text-neutral-800">Mapeo inicial completado.</h2>
              <p className="text-xl text-neutral-500 leading-relaxed font-light px-8">
                Tus biomarcadores base han sido registrados. Es momento de vivir tu proceso. Al regresar, volveremos a medirte.
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
          &copy; 2026 Biology Mirror &bull; Advanced Bio-Phenotyping Lab
        </p>
      </footer>
    </div>
  );
}

const FeatureCard: React.FC<{ title: string, desc: string, icon: string }> = ({ title, desc, icon }) => (
  <div className="bg-white p-10 rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-2xl transition-all group hover:-translate-y-2">
    <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">{icon}</div>
    <h3 className="text-xl font-serif font-bold text-neutral-800 mb-4">{title}</h3>
    <p className="text-neutral-500 leading-relaxed font-light">{desc}</p>
  </div>
);

export default App;
