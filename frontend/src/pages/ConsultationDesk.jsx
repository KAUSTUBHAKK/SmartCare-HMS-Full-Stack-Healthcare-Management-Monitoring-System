import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ClipboardList, UserRound, LockKeyhole, CheckCircle2 } from 'lucide-react';

const emptyForm = {
  chiefComplaint:'', history:'', examination:'', diagnosis:'', medicines:'', advice:'', followUpDate:'',
};

function parseMedicines(text) {
  return text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [name, dosage='', frequency='', duration=''] = line.split('|').map(value => value.trim());
    return { name, dosage, frequency, duration };
  });
}

export default function ConsultationDesk() {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const up = key => event => setForm(current => ({ ...current, [key]:event.target.value }));

  useEffect(() => {
    axios.get('/api/patients').then(({ data }) => {
      setPatients(data);
      if (data[0]) setPatientId(String(data[0]._id));
    }).catch(() => toast.error('Could not load patient queue'));
  }, []);

  useEffect(() => {
    if (!patientId) return;
    axios.get(`/api/consultations?patientId=${patientId}`)
      .then(({ data }) => setHistory(data))
      .catch(error => {
        setHistory([]);
        toast.error(error.response?.data?.error || 'Patient history is unavailable');
      });
  }, [patientId]);

  const save = async status => {
    if (!form.chiefComplaint.trim()) return toast.error('Chief complaint is required');
    setSaving(true);
    try {
      await axios.post('/api/consultations', {
        patientId,
        chiefComplaint:form.chiefComplaint,
        history:form.history,
        examination:form.examination,
        diagnosis:form.diagnosis.split(',').map(value=>value.trim()).filter(Boolean),
        medicines:parseMedicines(form.medicines),
        advice:form.advice,
        followUpDate:form.followUpDate || undefined,
        status,
        signedAt:status === 'Signed' ? new Date() : undefined,
      });
      toast.success(status === 'Signed' ? 'Consultation signed and shared with patient' : 'Draft consultation saved');
      setForm(emptyForm);
      const { data } = await axios.get(`/api/consultations?patientId=${patientId}`);
      setHistory(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not save consultation');
    } finally {
      setSaving(false);
    }
  };

  const patient = patients.find(item => String(item._id) === patientId);

  return (
    <div>
      <div className="eyebrow">// Clinician Workspace</div>
      <div className="dashboard-heading">
        <div><h1>Consultation Desk</h1><p>Review patient context, document the visit, prescribe, and sign a permanent clinical note</p></div>
        <select className="form-select" style={{ maxWidth:300 }} value={patientId} onChange={event=>setPatientId(event.target.value)}>
          {patients.map(item=><option key={item._id} value={item._id}>{item.name} · {item.age || '—'} yrs · {item.gender || '—'}</option>)}
        </select>
      </div>

      {patient && <div className="care-note" style={{ marginBottom:'1rem' }}><UserRound size={22}/><div><strong>{patient.name}</strong><p>{patient.email} · {patient.phone || 'No phone'} · Patient controls clinical sharing from Privacy & Access.</p></div></div>}

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div className="card-h"><h3><ClipboardList size={14}/> Consultation Note</h3><span className="badge badge-yellow">UNSIGNED</span></div>
          <div className="card-b">
            {[
              ['chiefComplaint','Chief complaint'],
              ['history','History of present illness'],
              ['examination','Examination and vitals'],
              ['diagnosis','Assessment / diagnoses (comma separated)'],
              ['medicines','Medicines: Name | Dose | Frequency | Duration'],
              ['advice','Advice and safety-net instructions'],
            ].map(([key,label])=>(
              <div className="form-group" key={key}><label className="form-label">{label}</label><textarea className="form-input" rows={key==='medicines'?4:3} value={form[key]} onChange={up(key)} placeholder={`// ${label.toLowerCase()}`}/></div>
            ))}
            <div className="form-group"><label className="form-label">Follow-up date</label><input type="date" className="form-input" value={form.followUpDate} onChange={up('followUpDate')}/></div>
            <div style={{ display:'flex', gap:'.55rem' }}>
              <button className="btn btn-ghost" style={{ flex:1 }} disabled={saving} onClick={()=>save('Draft')}>SAVE DRAFT</button>
              <button className="btn btn-primary" style={{ flex:1 }} disabled={saving} onClick={()=>save('Signed')}>SIGN & SHARE</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Clinical History</h3><span className="badge badge-cyan">{history.length} NOTES</span></div>
          <div className="card-b">
            {!history.length && <p className="mono text-dim">// No accessible consultation history</p>}
            {history.map(item=>(
              <div className="review-row" key={item._id} style={{ alignItems:'flex-start' }}>
                <div className="comfort-icon">{item.status === 'Signed' ? <CheckCircle2 size={17}/> : <LockKeyhole size={16}/>}</div>
                <div style={{ flex:1 }}><strong>{item.chiefComplaint}</strong><div className="mono text-dim">{new Date(item.createdAt).toLocaleString()} · {item.status}</div><p style={{ color:'var(--t2)', fontSize:11, lineHeight:1.5, marginTop:'.35rem' }}>{item.diagnosis?.join(', ') || 'Assessment not entered'}{item.advice ? ` · ${item.advice}` : ''}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
