
import React, { useState, useEffect } from 'react';
import { analyzeTransformation } from '../services/geminiService';
import { SessionData, AssessmentResult, TrendData } from '../types';
import { VagalGarden } from './VagalGarden';
import { FacsRadarChart } from './charts/RadarChart';
import { HRVTimeline } from './charts/HRVTimeline';
import { HeartBeatIndicator } from './HeartBeatIndicator';
import { BioMap } from './BioMap';
import { generatePDFReport } from '../services/pdfService';

interface ComparisonViewProps {
  pre: SessionData;
  post: SessionData;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ pre, post }) => {
  const [report, setReport] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Mock trend data for visualization
  const trendData: TrendData[] = [
    { date: '1 Mar', hrv: 35, neuroScore: 45, heartRate: 82 },
    { date: '2 Mar', hrv: 38, neuroScore: 48, heartRate: 80 },
    { date: '3 Mar (Pre)', hrv: pre.bio.hrv, neuroScore: 50, heartRate: pre.bio.heartRate },
    { date: 'Final (Post)', hrv: post.bio.hrv, neuroScore: 100, heartRate: post.bio.heartRate },
  ];

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await analyzeTransformation(pre, post);
        setReport(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [pre, post]);

  const handleDownload = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      await generatePDFReport(pre, post, report);
    } catch (e) {
      console.error(e);
      alert("Error al generar el PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 space-y-8">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-[3px] border-white/10 rounded-full" />
          <div className="absolute inset-0 border-[3px] border-[var(--brand-secondary)] rounded-full border-t-transparent animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display text-white">Sintetizando tu Transformación</h2>
          <p className="text-[var(--brand-text)] max-w-md mx-auto font-light">El Dr. Alara está analizando tus cambios biológicos y la coherencia de tu sistema nervioso...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white/5 rounded-none border border-white/10 p-12 text-white shadow-2xl backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand-primary)]/20 blur-[120px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--brand-secondary)]/10 blur-[100px] rounded-full -ml-10 -mb-10 pointer-events-none" />

        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[var(--brand-secondary)]/20 text-[var(--brand-secondary)] px-4 py-1.5 border border-[var(--brand-secondary)]/30 text-xs font-bold uppercase tracking-widest">
              <span>Bio-Análisis Portal</span>
              <div className="w-1.5 h-1.5 bg-[var(--brand-secondary)] rounded-full animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight drop-shadow-lg">
              Tu Espejo <br />
              <span className="text-[var(--brand-text)] italic">de la Montaña</span>
            </h1>
            <p className="text-xl text-neutral-300 leading-relaxed font-light">
              "{report.keyShift}"
            </p>
            <div className="pt-4 flex space-x-6 items-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-white font-display">{report.neuroScore}</div>
                <div className="text-[10px] font-bold text-[var(--brand-secondary)] uppercase tracking-tighter">NeuroScore</div>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <HeartBeatIndicator bpm={post.bio.heartRate} />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-inner">
            <HRVTimeline data={trendData} />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="glass rounded-none p-10 shadow-xl border border-white/10">
            <h3 className="text-2xl font-display font-bold text-white mb-8 border-b border-white/10 pb-6 uppercase tracking-wider">Análisis del Dr. Alara</h3>
            <div className="space-y-6 text-[var(--brand-text)] leading-relaxed text-lg font-light">
              {report.detailedAnalysis.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Bio-Maps (Skin Perfusion) */}
          <div className="glass rounded-none p-10 shadow-xl border border-white/10">
            <h3 className="text-2xl font-display font-bold text-white mb-10 flex items-center">
              <span className="w-10 h-10 bg-[var(--brand-secondary)]/20 text-[var(--brand-secondary)] flex items-center justify-center mr-4 border border-[var(--brand-secondary)]/30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </span>
              Mapeo de Perfusión Neuro-Vascular
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-center">
              <div className="space-y-6">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c5a059]">Antes (Estrés)</span>
                <BioMap data={pre.skin} stage="PRE" />
                <p className="text-sm text-neutral-400 italic px-4 leading-relaxed font-light">
                  "Perfusión desigual, con manchas rojas por inflamación o palidez por vasoconstricción."
                </p>
              </div>
              <div className="space-y-6">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2d4a3e]">Después (Sanación)</span>
                <BioMap data={post.skin} stage="POST" />
                <p className="text-sm text-neutral-400 italic px-4 leading-relaxed font-light">
                  "Distribución sanguínea uniforme y rica en oxígeno, percibida como un brillo saludable."
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Comparison */}
          <div className="grid md:grid-cols-2 gap-8">
            <MetricCard label="Estado Pre-Retiro" data={pre} theme="amber" />
            <MetricCard label="Estado Post-Retiro" data={post} theme="forest" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass rounded-none p-8 shadow-xl border border-white/10">
            <FacsRadarChart pre={pre.facs} post={post.facs} />
          </div>

          <div className="bg-white/5 border border-white/10 text-white rounded-none p-8 shadow-xl">
            <h3 className="font-display text-xl mb-6 uppercase tracking-wider">Biomarcadores Visuales</h3>
            <ul className="space-y-5">
              {report.visualCues.map((cue, i) => (
                <li key={i} className="flex items-start text-sm group">
                  <span className="w-1.5 h-1.5 bg-[#c5a059] rounded-full mt-1.5 mr-4 flex-shrink-0 group-hover:scale-150 transition-transform" />
                  <span className="text-neutral-300 group-hover:text-white transition-colors font-light">{cue}</span>
                </li>
              ))}
            </ul>
          </div>

          <VagalGarden hrv={post.bio.hrv} />
        </div>
      </div>

      <div className="text-center py-12">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-primary px-10 py-4 text-base disabled:opacity-50"
        >
          {downloading ? 'Generando PDF...' : 'Descargar Reporte Completo (PDF)'}
        </button>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string, data: SessionData, theme: 'amber' | 'forest' }> = ({ label, data, theme }) => {
  const isPre = theme === 'amber';
  const borderColor = isPre ? 'border-[#c5a059]' : 'border-[var(--brand-secondary)]';
  const textColor = isPre ? 'text-[#c5a059]' : 'text-[var(--brand-secondary)]';

  return (
    <div className={`glass rounded-none p-8 shadow-lg border-t-4 ${borderColor} transition-transform hover:-translate-y-1`}>
      <h3 className={`text-xs font-bold mb-8 uppercase tracking-[0.2em] ${textColor}`}>{label}</h3>
      <div className="grid grid-cols-2 gap-8">
        <MetricItem label="HRV (VFC)" value={`${data.bio.hrv}ms`} sub="Resiliencia" />
        <MetricItem label="Vitalidad Piel" value={`${data.skin.skinVitality || 0}/100`} sub="Glow & Tono" />
        <MetricItem label="Fatiga Ocular" value={`${data.gaze.fatigueIndex || 0}/100`} sub={data.gaze.fatigueIndex > 60 ? 'ALTA' : 'NORMAL'} />
        <MetricItem label="Enfoque" value={`${data.gaze.stability}%`} sub="Atención" />
      </div>
    </div>
  );
};

const MetricItem: React.FC<{ label: string, value: string, sub: string }> = ({ label, value, sub }) => (
  <div className="space-y-1">
    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">{label}</div>
    <div className="text-2xl font-display text-white">{value}</div>
    <div className="text-[10px] text-neutral-400 font-medium">{sub}</div>
  </div>
);