
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SessionData, AssessmentResult } from '../types';
import { format } from 'date-fns';

export const generatePDFReport = async (
    pre: SessionData,
    post: SessionData,
    result: AssessmentResult
) => {
    const doc = new jsPDF();
    const primaryColor = [16, 185, 129]; // Emerald 600

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('times', 'bold');
    doc.text('Espejo-Neurosomatico', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('REPORTE DE FENOTIPADO DIGITAL NEURO-SOMÁTICO', 20, 32);
    doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), 170, 32);

    // Executive Summary
    doc.setTextColor(33, 33, 33);
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('Síntesis de Transformación', 20, 55);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(result.keyShift, 20, 65);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitAnalysis = doc.splitTextToSize(result.detailedAnalysis, 170);
    doc.text(splitAnalysis, 20, 75);

    // NeuroScore Circle (simplified)
    doc.setLineWidth(1);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.circle(170, 65, 15, 'S');
    doc.setFontSize(16);
    doc.text(result.neuroScore.toString(), 170, 67, { align: 'center' });
    doc.setFontSize(8);
    doc.text('NeuroScore', 170, 78, { align: 'center' });

    // Metrics Table
    (doc as any).autoTable({
        startY: 120,
        head: [['BIOMARCADOR', 'ANTES (ESTRÉS)', 'DESPUÉS (SANACIÓN)', 'CAMBIO']],
        body: [
            ['VFC (HRV)', `${pre.bio.hrv}ms`, `${post.bio.hrv}ms`, `${(post.bio.hrv - pre.bio.hrv).toFixed(1)}ms`],
            ['Ritmo Cardiaco', `${pre.bio.heartRate} bpm`, `${post.bio.heartRate} bpm`, `${(post.bio.heartRate - pre.bio.heartRate).toFixed(1)} bpm`],
            ['Frec. Respiratoria', `${pre.bio.respirationRate.toFixed(1)}`, `${post.bio.respirationRate.toFixed(1)}`, `${(post.bio.respirationRate - pre.bio.respirationRate).toFixed(1)}`],
            ['Homogeneidad Piel', `${pre.skin.homogeneity}%`, `${post.skin.homogeneity}%`, `${(post.skin.homogeneity - pre.skin.homogeneity).toFixed(1)}%`],
            ['Estabilidad Mirada', `${pre.gaze.stability}%`, `${post.gaze.stability}%`, `${(post.gaze.stability - pre.gaze.stability).toFixed(1)}%`],
        ],
        headStyles: { fillColor: primaryColor },
        theme: 'grid'
    });

    // Visual Cues
    let currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('times', 'bold');
    doc.text('Marcadores Visuales Detectados', 20, currentY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    result.visualCues.forEach((cue, index) => {
        doc.text(`• ${cue}`, 25, currentY + 10 + (index * 7));
    });

    // Footer Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const disclaimer = 'Este reporte ha sido generado mediante inteligencia artificial clínica y análisis rPPG/FACS sin contacto. Proporciona una validación biológica de cambios en el sistema nervioso autónomo y no debe considerarse un diagnóstico médico.';
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
    doc.text(splitDisclaimer, 20, 280);

    // Save the PDF
    doc.save(`EspejoNeurosomatico_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};
