
import React, { useState, useEffect } from 'react';
import { analyzeTransformation } from '../services/geminiService';
import { SessionData, AssessmentResult, TrendData } from '../types';
import { VagalGarden } from './VagalGarden';
import { FacsRadarChart } from './charts/RadarChart';
import { HRVTimeline } from './charts/HRVTimeline';
import { HeartBeatIndicator } from './HeartBeatIndicator';
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
          <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#2d4a3e] rounded-full border-t-transparent animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif text-neutral-800">Sintetizando tu Transformación</h2>
          <p className="text-neutral-500 max-w-md mx-auto">El Dr. Alara está analizando tus cambios biológicos y la coherencia de tu sistema nervioso...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-neutral-900 rounded-[3rem] p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2d4a3e]/30 blur-[120px] rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4a6b8a]/10 blur-[100px] rounded-full -ml-10 -mb-10" />

        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[#2d4a3e]/10 text-[#4ade80] px-4 py-1.5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest">
              <span>Bio-Análisis Portal</span>
              <div className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight">
              Tu Espejo <br />
              <span className="text-[#a7f3d0] italic">de la Montaña</span>
            </h1>
            <p className="text-xl text-neutral-400 leading-relaxed font-light">
              "{report.keyShift}"
            </p>
            <div className="pt-4 flex space-x-6 items-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-white">{report.neuroScore}</div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">NeuroScore</div>
              </div>
              <div className="h-12 w-px bg-neutral-800" />
              <HeartBeatIndicator bpm={post.bio.heartRate} />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <HRVTimeline data={trendData} />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="glass rounded-[2.5rem] p-10 shadow-xl border border-white/20">
            <h3 className="text-2xl font-serif font-bold text-neutral-800 mb-8 border-b border-stone-200 pb-6">Análisis del Dr. Alara: Medicina de Montaña</h3>
            <div className="space-y-6 text-neutral-600 leading-relaxed text-lg italic">
              {report.detailedAnalysis.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Metrics Comparison */}
          <div className="grid md:grid-cols-2 gap-8">
            <MetricCard label="Estado Pre-Retiro" data={pre} theme="amber" />
            <MetricCard label="Estado Post-Retiro" data={post} theme="forest" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass rounded-[2.5rem] p-8 shadow-xl border border-white/20">
            <FacsRadarChart pre={pre.facs} post={post.facs} />
          </div>

          <div className="bg-neutral-900 border border-neutral-800 text-white rounded-[2.5rem] p-8 shadow-xl">
            <h3 className="font-serif text-xl mb-6">Biomarcadores Visuales</h3>
            <ul className="space-y-5">
              {report.visualCues.map((cue, i) => (
                <li key={i} className="flex items-start text-sm group">
                  <span className="w-1.5 h-1.5 bg-[#c5a059] rounded-full mt-1.5 mr-4 flex-shrink-0 group-hover:scale-150 transition-transform" />
                  <span className="text-neutral-300 group-hover:text-white transition-colors">{cue}</span>
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
          className="bg-[#2d4a3e] text-white px-10 py-4 rounded-full font-bold shadow-2xl hover:bg-[#1e332a] transition-all transform hover:-translate-y-1 disabled:opacity-50"
        >
          {downloading ? 'Generando PDF...' : 'Descargar Reporte Completo (PDF)'}
        </button>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string, data: SessionData, theme: 'amber' | 'forest' }> = ({ label, data, theme }) => {
  const isPre = theme === 'amber';
  return (
    <div className={`glass rounded-3xl p-8 shadow-lg border-t-8 ${isPre ? 'border-[#c5a059]' : 'border-[#2d4a3e]'} transition-transform hover:scale-[1.02]`}>
      <h3 className={`text-lg font-bold mb-8 uppercase tracking-widest ${isPre ? 'text-[#c5a059]' : 'text-[#2d4a3e]'}`}>{label}</h3>
      <div className="grid grid-cols-2 gap-8">
        <MetricItem label="HRV (VFC)" value={`${data.bio.hrv}ms`} sub="Resiliencia" />
        <MetricItem label="Ritmo Cardíaco" value={`${data.bio.heartRate} BPM`} sub="Carga" />
        <MetricItem label="Homogeneidad" value={`${data.skin.homogeneity}%`} sub="Micro-perfusión" />
        <MetricItem label="Enfoque" value={`${data.gaze.stability}%`} sub="Atención" />
      </div>
    </div>
  );
};

const MetricItem: React.FC<{ label: string, value: string, sub: string }> = ({ label, value, sub }) => (
  <div className="space-y-1">
    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">{label}</div>
    <div className="text-3xl font-serif text-neutral-800">{value}</div>
    <div className="text-[10px] text-[#2d4a3e]/60 font-medium">{sub}</div>
  </div>
);