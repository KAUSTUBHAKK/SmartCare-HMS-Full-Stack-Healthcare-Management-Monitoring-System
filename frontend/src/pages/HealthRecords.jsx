import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { createWorker } from 'tesseract.js';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Upload, FileText, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const flagColor = flag => flag === 'High' ? 'var(--r)' : flag === 'Low' ? 'var(--y)' : 'var(--g)';

export default function HealthRecords() {
  const { user, isClinician } = useAuth();
  const fileRef = useRef(null);
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(user?.id || user?._id || '');
  const [reports, setReports] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [working, setWorking] = useState(false);
  const [form, setForm] = useState({ title:'Routine Laboratory Report', laboratory:'', collectedAt:new Date().toISOString().slice(0,10) });

  const loadRecords = async (id = patientId) => {
    if (!id) return;
    try {
      const suffix = isClinician ? `?patientId=${id}` : '';
      const [labRes, consultationRes] = await Promise.all([
        axios.get(`/api/labs${suffix}`),
        axios.get(`/api/consultations${suffix}`),
      ]);
      setReports(labRes.data);
      setConsultations(consultationRes.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not load clinical records');
    }
  };

  useEffect(() => {
    if (isClinician) {
      axios.get('/api/patients').then(({ data }) => {
        setPatients(data);
        if (data[0]) setPatientId(String(data[0]._id));
      }).catch(() => toast.error('Could not load patients'));
    }
  }, [isClinician]);

  useEffect(() => { loadRecords(); }, [patientId]);

  const parseText = async text => {
    const { data } = await axios.post('/api/ai/labs/parse', { text });
    setParsed(data.results || []);
    if (!data.results?.length) toast('No supported values detected. Try clearer text or enter values manually.');
  };

  const readImage = async file => {
    if (!file) return;
    setWorking(true);
    try {
      const worker = await createWorker('eng');
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setRawText(data.text);
      await parseText(data.text);
      toast.success('Report text extracted and structured');
    } catch {
      toast.error('Could not read this image. Try a sharper, well-lit photo.');
    } finally {
      setWorking(false);
    }
  };

  const saveReport = async () => {
    if (!parsed.length) return toast.error('Parse at least one lab value before saving');
    try {
      await axios.post('/api/labs', {
        ...form,
        patientId: isClinician ? patientId : undefined,
        rawText,
        results: parsed,
        source: rawText ? 'image-ocr' : 'manual',
        warnings: ['General reference ranges require clinician verification.'],
      });
      toast.success('Lab report saved to the medical record');
      setRawText('');
      setParsed([]);
      await loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not save report');
    }
  };

  const trends = useMemo(() => {
    const map = {};
    [...reports].reverse().forEach(report => report.results?.forEach(result => {
      map[result.test] ||= [];
      map[result.test].push({
        date: new Date(report.collectedAt).toLocaleDateString(undefined, { month:'short', day:'numeric' }),
        value: result.value,
      });
    }));
    return Object.entries(map).filter(([, values]) => values.length > 1).slice(0, 4);
  }, [reports]);

  return (
    <div>
      <div className="eyebrow">// Longitudinal Clinical Record</div>
      <div className="dashboard-heading">
        <div>
          <h1>Health Records</h1>
          <p>Laboratory intelligence, clinician notes, and historical trends in one patient-owned record</p>
        </div>
        {isClinician && (
          <select className="form-select" style={{ maxWidth:280 }} value={patientId} onChange={event => setPatientId(event.target.value)}>
            {patients.map(patient => <option key={patient._id} value={patient._id}>{patient.name} · {patient.age || '—'} yrs</option>)}
          </select>
        )}
      </div>

      <div className="grid-2" style={{ alignItems:'start', marginBottom:'1rem' }}>
        <div className="card">
          <div className="card-h"><h3><Upload size={14}/> Add Lab Report</h3><span className="badge badge-cyan">OCR + PYTHON</span></div>
          <div className="card-b">
            <div className="grid-2" style={{ gap:'.6rem' }}>
              <div className="form-group"><label className="form-label">Report title</label><input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
              <div className="form-group"><label className="form-label">Laboratory</label><input className="form-input" placeholder="Hospital / diagnostic centre" value={form.laboratory} onChange={e=>setForm({...form,laboratory:e.target.value})}/></div>
            </div>
            <div className="form-group"><label className="form-label">Collection date</label><input type="date" className="form-input" value={form.collectedAt} onChange={e=>setForm({...form,collectedAt:e.target.value})}/></div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={e=>readImage(e.target.files?.[0])}/>
            <button className="btn btn-primary" style={{ width:'100%', marginBottom:'.65rem' }} onClick={()=>fileRef.current?.click()} disabled={working}>
              {working ? 'READING REPORT...' : 'UPLOAD OR TAKE PHOTO'}
            </button>
            <textarea className="form-input" rows="7" value={rawText} onChange={e=>setRawText(e.target.value)} placeholder="Or paste lab text here, for example: Hb 12.4, HbA1c 6.1, Creatinine 0.9"/>
            <div style={{ display:'flex', gap:'.55rem', marginTop:'.65rem' }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>parseText(rawText)} disabled={!rawText.trim()}>PARSE VALUES</button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={saveReport} disabled={!parsed.length}>SAVE RECORD</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3><Activity size={14}/> Parsed Results</h3><span className="badge badge-green">{parsed.length} VALUES</span></div>
          <div className="card-b">
            {!parsed.length && <p className="mono text-dim">// Supported values will appear here for verification before saving</p>}
            {parsed.map((result, index) => (
              <div className="data-row" key={`${result.test}-${index}`}>
                <div><strong>{result.test}</strong><small>{result.reference}</small></div>
                <div style={{ textAlign:'right' }}><strong style={{ color:flagColor(result.flag) }}>{result.value} {result.unit}</strong><small>{result.flag}</small></div>
              </div>
            ))}
            {!!parsed.length && <div className="care-note" style={{ marginTop:'.8rem' }}><ShieldCheck size={20}/><div><strong>Human verification required</strong><p>Compare every extracted value with the original report before saving.</p></div></div>}
          </div>
        </div>
      </div>

      {!!trends.length && <div className="grid-2" style={{ marginBottom:'1rem' }}>
        {trends.map(([test, values]) => (
          <div className="card" key={test}>
            <div className="card-h"><h3>{test} Trend</h3><span className="badge badge-cyan">{values.length} TESTS</span></div>
            <div className="card-b">
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={values}><CartesianGrid stroke="var(--bd)" strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fill:'var(--t3)',fontSize:9}}/><YAxis tick={{fill:'var(--t3)',fontSize:9}}/><Tooltip/><Line type="monotone" dataKey="value" stroke="var(--p)" strokeWidth={2}/></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>}

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div className="card-h"><h3><FileText size={14}/> Saved Lab Reports</h3><span className="badge badge-cyan">{reports.length}</span></div>
          <div className="card-b">
            {!reports.length && <p className="mono text-dim">// No lab reports saved yet</p>}
            {reports.map(report => (
              <div className="review-row" key={report._id}>
                <div style={{ flex:1 }}><strong>{report.title}</strong><div className="mono text-dim">{new Date(report.collectedAt).toLocaleDateString()} · {report.laboratory || 'Laboratory not specified'} · {report.results?.length || 0} values</div></div>
                <span className={`badge ${report.status === 'Reviewed' ? 'badge-green' : 'badge-yellow'}`}>{report.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3>Signed Consultations</h3><span className="badge badge-green">{consultations.filter(item=>item.status==='Signed').length}</span></div>
          <div className="card-b">
            {!consultations.length && <p className="mono text-dim">// Signed doctor notes will appear here</p>}
            {consultations.map(item => (
              <div className="review-row" key={item._id}>
                <div style={{ flex:1 }}><strong>{item.chiefComplaint}</strong><div className="mono text-dim">{item.doctorId?.name || 'Doctor'} · {item.diagnosis?.join(', ') || 'Assessment pending'} · {new Date(item.createdAt).toLocaleDateString()}</div></div>
                <span className={`badge ${item.status === 'Signed' ? 'badge-green' : 'badge-yellow'}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
