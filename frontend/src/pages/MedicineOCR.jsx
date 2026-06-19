import React, { useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import axios from 'axios';
import toast from 'react-hot-toast';

function guessMedicines(text) {
  const stop = new Set(['tablet','tab','capsule','cap','syrup','take','after','before','food','daily','days','morning','night','evening']);
  return text
    .split(/\n|,/)
    .map(line => line.trim())
    .filter(line => line.length > 3)
    .map(line => {
      const dose = line.match(/\b(\d+(\.\d+)?\s?(mg|ml|mcg|g|iu))\b/i)?.[1] || '';
      const time = /night|bed/i.test(line) ? '21:00' : /evening/i.test(line) ? '18:00' : /afternoon/i.test(line) ? '14:00' : '09:00';
      const name = line
        .replace(/\b(\d+(\.\d+)?\s?(mg|ml|mcg|g|iu))\b/ig, '')
        .split(/\s+/)
        .filter(w => !stop.has(w.toLowerCase()))
        .slice(0, 3)
        .join(' ');
      return { name: name || line.slice(0, 28), dosage: dose, time, frequency: /twice|bd|2x/i.test(line) ? 'Twice daily' : 'Once daily', notes: line };
    })
    .slice(0, 8);
}

export default function MedicineOCR() {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState('');
  const [rawText, setRawText] = useState('');
  const [meds, setMeds] = useState([]);
  const [working, setWorking] = useState(false);
  const [engine, setEngine] = useState('');

  const load = file => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setRawText('');
    setMeds([]);
    setEngine('');
  };

  const runOCR = async () => {
    if (!preview) return alert('Upload prescription or medicine photo first.');
    setWorking(true);
    try {
      const worker = await createWorker('eng');
      const { data } = await worker.recognize(preview);
      await worker.terminate();
      setRawText(data.text);
      try {
        const response = await axios.post('/api/ai/prescriptions/parse', { text: data.text });
        const parsed = response.data.medicines.map(medicine => ({
          ...medicine,
          time: String(medicine.time || '09:00').split(',')[0],
        }));
        setMeds(parsed.length ? parsed : guessMedicines(data.text));
        setEngine(parsed.length ? 'PYTHON VERIFIED PARSER' : 'LOCAL OCR FALLBACK');
        if (response.data.warnings?.length) toast(response.data.warnings[0]);
      } catch {
        setMeds(guessMedicines(data.text));
        setEngine('LOCAL OCR FALLBACK');
        toast('Text extracted. Python parser is offline, so local parsing was used.');
      }
    } catch {
      toast.error('OCR failed. Try a clearer image.');
    } finally {
      setWorking(false);
    }
  };

  const updateMed = (i, k, v) => setMeds(ms => ms.map((m, idx) => idx === i ? { ...m, [k]: v } : m));

  const saveReminders = async () => {
    try {
      for (const m of meds.filter(x => x.name)) {
        await axios.post('/api/reminders', m);
      }
      toast.success(`${meds.length} medicine reminders added`);
    } catch {
      toast.error('Could not save reminders');
    }
  };

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Prescription Vision OCR</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Medicine OCR</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.5rem' }}>Extract medicine names and dosage from prescription or strip photos, then convert them into reminders</p>

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div className="card-h"><h3>UPLOAD PRESCRIPTION</h3><span className="badge badge-cyan">OCR</span></div>
          <div className="card-b">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => load(e.target.files?.[0])}/>
            <button className="btn btn-primary" style={{ width:'100%', marginBottom:'.75rem' }} onClick={() => fileRef.current?.click()}>SELECT IMAGE</button>
            <div style={{ minHeight:260, border:'1px solid var(--bd)', borderRadius:12, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              {preview ? <img src={preview} alt="Prescription preview" style={{ maxWidth:'100%', maxHeight:420 }}/> : <p className="mono text-dim">// No image selected</p>}
            </div>
            <button className="btn btn-primary" style={{ width:'100%', marginTop:'.75rem' }} onClick={runOCR} disabled={!preview || working}>{working ? 'READING TEXT...' : 'RUN OCR →'}</button>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom:'1rem' }}>
            <div className="card-h"><h3>DETECTED MEDICINES</h3><span className="badge badge-green">{meds.length} ITEMS</span></div>
            <div className="card-b">
              {engine && <div className="mono" style={{ fontSize:9, color:'var(--p)', marginBottom:'.65rem' }}>{engine} · CHECK EVERY NAME AND DOSE BEFORE SAVING</div>}
              {meds.length === 0 && <p className="mono text-dim">// OCR output will appear here</p>}
              {meds.map((m, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 90px 100px', gap:'.45rem', marginBottom:'.5rem' }}>
                  <input className="form-input" value={m.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Medicine"/>
                  <input className="form-input" value={m.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="Dose"/>
                  <input className="form-input" type="time" value={m.time} onChange={e => updateMed(i, 'time', e.target.value)}/>
                </div>
              ))}
              {meds.length > 0 && <button className="btn btn-primary" style={{ width:'100%', marginTop:'.4rem' }} onClick={saveReminders}>ADD TO REMINDERS</button>}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>RAW OCR TEXT</h3></div>
            <div className="card-b" style={{ whiteSpace:'pre-wrap', fontFamily:'var(--mono)', fontSize:11, color:'var(--t2)', minHeight:160 }}>
              {rawText || '// Text extracted from image will appear here'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
