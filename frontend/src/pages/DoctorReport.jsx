import React, { useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function DoctorReport() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title:'AI Doctor Summary Report',
    riskLevel:'Low',
    symptoms:'',
    imageFinding:'',
    vitals:'',
    medicines:'',
    plan:'',
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisNote, setAnalysisNote] = useState('');
  const up = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const analyzeWithPython = async () => {
    if (!form.symptoms.trim() && !form.vitals.trim() && !form.imageFinding.trim()) {
      toast.error('Add symptoms, vitals, or an image observation first');
      return;
    }
    setAnalyzing(true);
    try {
      const { data } = await axios.post('/api/ai/reports/analyze', {
        symptoms: form.symptoms,
        vitals: form.vitals,
        medicines: form.medicines,
        image_finding: form.imageFinding,
        lab_text: form.vitals,
      });
      const plan = [
        data.summary,
        ...data.recommendations,
        data.red_flags?.length ? `Red flags: ${data.red_flags.join(' ')}` : '',
      ].filter(Boolean).join('\n');
      setForm(current => ({ ...current, riskLevel:data.risk_level, plan }));
      setAnalysisNote(`${data.lab_results?.length || 0} lab values extracted · clinician verification required`);
      toast.success('Python analysis added to the report');
    } catch {
      setAnalysisNote('Python analysis is offline. You can still complete and export the report manually.');
      toast.error('Analysis service unavailable; manual report remains available');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveAndDownload = async () => {
    const summary = [form.symptoms, form.imageFinding, form.vitals, form.plan].filter(Boolean).join(' | ').slice(0, 280);
    try {
      await axios.post('/api/reports', {
        title: form.title,
        riskLevel: form.riskLevel,
        summary,
        sections: form,
      });
    } catch {
      toast.error('PDF generated, but report save failed');
    }

    const pdf = new jsPDF();
    const now = new Date().toLocaleString();
    pdf.setFillColor(5, 8, 15);
    pdf.rect(0, 0, 210, 28, 'F');
    pdf.setTextColor(0, 212, 255);
    pdf.setFontSize(18);
    pdf.text('MediCare AI Doctor Report', 14, 18);
    pdf.setTextColor(50, 60, 75);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${now}`, 14, 36);
    pdf.text(`Patient: ${user?.name || 'Patient'} (${user?.email || ''})`, 14, 43);
    pdf.text(`Risk Level: ${form.riskLevel}`, 14, 50);
    let y = 62;
    [
      ['Symptoms / Complaint', form.symptoms],
      ['Image AI Finding', form.imageFinding],
      ['Vitals / Measurements', form.vitals],
      ['Medicine Notes', form.medicines],
      ['AI Suggested Plan', form.plan],
    ].forEach(([h, body]) => {
      pdf.setTextColor(0, 90, 130);
      pdf.setFontSize(12);
      pdf.text(h, 14, y);
      y += 7;
      pdf.setTextColor(35, 35, 35);
      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(body || 'Not provided', 180);
      pdf.text(lines, 14, y);
      y += lines.length * 5 + 8;
    });
    pdf.setTextColor(160, 40, 40);
    pdf.setFontSize(9);
    pdf.text('Disclaimer: Educational AI report only. Not a substitute for diagnosis by a licensed doctor.', 14, 285);
    pdf.save(`medicare-ai-report-${Date.now()}.pdf`);
    toast.success('Report saved and PDF downloaded');
  };

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Clinical PDF Generator</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>AI Doctor Report PDF</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.5rem' }}>Generate a professional report from symptoms, image scans, vitals, medicine notes, and care plan</p>

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div className="card-h"><h3>REPORT INPUTS</h3></div>
          <div className="card-b">
            <div className="form-group"><label className="form-label">Report Title</label><input className="form-input" value={form.title} onChange={up('title')}/></div>
            <div className="form-group"><label className="form-label">Risk Level</label><select className="form-select" value={form.riskLevel} onChange={up('riskLevel')}><option>Low</option><option>Moderate</option><option>High</option><option>Emergency</option></select></div>
            {[
              ['symptoms','Symptoms / Complaint'],
              ['imageFinding','Image AI Finding'],
              ['vitals','Vitals / Measurements'],
              ['medicines','Medicine Notes'],
              ['plan','AI Suggested Plan'],
            ].map(([k,l]) => (
              <div className="form-group" key={k}>
                <label className="form-label">{l}</label>
                <textarea className="form-input" rows="3" value={form[k]} onChange={up(k)} placeholder={`// ${l.toLowerCase()}`}/>
              </div>
            ))}
            <button className="btn" style={{ width:'100%', marginBottom:'.55rem' }} onClick={analyzeWithPython} disabled={analyzing}>
              {analyzing ? 'ANALYZING...' : 'ANALYZE WITH PYTHON'}
            </button>
            {analysisNote && <div className="mono" style={{ fontSize:9, color:'var(--t3)', marginBottom:'.7rem' }}>{analysisNote}</div>}
            <button className="btn btn-primary" style={{ width:'100%' }} onClick={saveAndDownload}>SAVE + DOWNLOAD PDF</button>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3>LIVE REPORT PREVIEW</h3><span className="badge badge-yellow">{form.riskLevel}</span></div>
          <div className="card-b" style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--t2)', lineHeight:1.8 }}>
            <strong style={{ color:'var(--t)', fontSize:14 }}>{form.title}</strong><br/>
            Patient: {user?.name}<br/>
            Risk: {form.riskLevel}<br/><br/>
            Symptoms: {form.symptoms || 'Not provided'}<br/>
            Image AI: {form.imageFinding || 'Not provided'}<br/>
            Vitals: {form.vitals || 'Not provided'}<br/>
            Medicines: {form.medicines || 'Not provided'}<br/>
            Plan: {form.plan || 'Not provided'}
          </div>
        </div>
      </div>
    </div>
  );
}
