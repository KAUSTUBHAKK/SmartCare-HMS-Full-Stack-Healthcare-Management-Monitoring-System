import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TYPE = {
  appointment: { ic:'⊕', c:'var(--p)', label:'APPOINTMENT' },
  medicine: { ic:'⊡', c:'var(--g)', label:'MEDICINE' },
  chat: { ic:'◈', c:'var(--y)', label:'AI CHAT' },
  'image-scan': { ic:'▣', c:'var(--r)', label:'IMAGE AI' },
  report: { ic:'▤', c:'var(--o)', label:'REPORT' },
};

export default function PatientTimeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTimeline = () => {
    setLoading(true);
    setError('');
    axios.get('/api/timeline')
      .then(r => setEvents(Array.isArray(r.data) ? r.data : []))
      .catch(() => {
        setEvents([]);
        setError('Timeline could not load. Start the backend and check MongoDB Atlas connection, then retry.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  const formatDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Date pending';
    return d.toLocaleString();
  };

  const counts = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Longitudinal Patient Record</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Patient Medical Timeline</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.5rem' }}>Appointments, AI chats, image scans, reports, and medicine history in one clinical view</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'.75rem', marginBottom:'1rem' }}>
        {Object.entries(TYPE).map(([key, value]) => (
          <div key={key} style={{ border:'1px solid var(--bd)', background:'var(--s)', borderRadius:10, padding:'.75rem' }}>
            <div style={{ fontSize:9, fontFamily:'var(--mono)', color:value.c, letterSpacing:'.12em' }}>{value.label}</div>
            <div style={{ fontSize:22, fontWeight:900, color:'var(--t)', marginTop:'.25rem' }}>{counts[key] || 0}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-h"><h3>MEDICAL EVENTS</h3><span className="badge badge-cyan">{events.length} RECORDS</span></div>
        <div className="card-b">
          {loading && <p className="mono text-dim">// Loading timeline...</p>}
          {!loading && error && (
            <div style={{ border:'1px solid var(--r)', background:'rgba(255,90,90,.08)', borderRadius:10, padding:'.85rem', marginBottom:'1rem' }}>
              <div className="mono" style={{ color:'var(--r)', fontSize:11, marginBottom:'.65rem' }}>{error}</div>
              <button className="btn" onClick={loadTimeline}>Retry timeline</button>
            </div>
          )}
          {!loading && events.length === 0 && <p className="mono text-dim">// No medical timeline events yet</p>}
          <div style={{ display:'grid', gap:'.75rem' }}>
            {events.map((e, idx) => {
              const t = TYPE[e.type] || { ic:'•', c:'var(--t3)', label:e.type };
              return (
                <div key={idx} style={{ display:'grid', gridTemplateColumns:'42px 1fr', gap:'.75rem', alignItems:'start' }}>
                  <div style={{ width:42, height:42, borderRadius:12, border:`1px solid ${t.c}`, background:'var(--s2)', color:t.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800 }}>{t.ic}</div>
                  <div style={{ border:'1px solid var(--bd)', borderRadius:10, background:'var(--s2)', padding:'.85rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:'.8rem', flexWrap:'wrap', marginBottom:'.35rem' }}>
                      <div style={{ fontSize:12, fontWeight:800, color:'var(--t)' }}>{e.title}</div>
                      <div style={{ fontSize:9, fontFamily:'var(--mono)', color:t.c }}>{t.label} · {formatDate(e.date)}</div>
                    </div>
                    <div style={{ fontSize:11, color:'var(--t2)', lineHeight:1.6, fontFamily:'var(--mono)' }}>{e.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
