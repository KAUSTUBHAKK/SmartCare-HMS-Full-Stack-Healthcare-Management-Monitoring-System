import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm] = useState({ name:'', dosage:'', time:'', frequency:'Once daily', notes:'' });
  const up = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    axios.get('/api/reminders')
      .then(r => setReminders(r.data))
      .catch(() => toast.error('Failed to load reminders'))
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!form.name || !form.time) { toast.error('Enter medicine name and time'); return; }
    try {
      const { data } = await axios.post('/api/reminders', form);
      setReminders(prev => [...prev, data]);
      setForm({ name:'', dosage:'', time:'', frequency:'Once daily', notes:'' });
      toast.success('Reminder saved to database!');
    } catch { toast.error('Failed to save'); }
  };

  const toggleTaken = async (r) => {
    try {
      const { data } = await axios.patch(`/api/reminders/${r._id}/taken`, { takenToday: r.takenToday });
      setReminders(prev => prev.map(x => x._id === data._id ? data : x));
    } catch { toast.error('Update failed'); }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`/api/reminders/${id}`);
      setReminders(prev => prev.filter(r => r._id !== id));
      toast.success('Reminder removed');
    } catch { toast.error('Failed to remove'); }
  };

  const getStatus = (r) => {
    const now = new Date();
    const [h, m] = r.time.split(':').map(Number);
    const med = new Date(); med.setHours(h, m, 0);
    if (r.takenToday) return 'taken';
    const diff = med - now;
    if (diff < 0 && diff > -3600000) return 'due';
    if (diff < -3600000) return 'overdue';
    return 'upcoming';
  };

  const statusColors = { taken:'var(--g)', due:'var(--r)', overdue:'var(--o)', upcoming:'var(--y)' };
  const statusBgs    = { taken:'var(--gd)', due:'var(--rd)', overdue:'var(--od)', upcoming:'var(--yd)' };

  const dueCount = reminders.filter(r => getStatus(r) === 'due').length;
  const overdueCount = reminders.filter(r => getStatus(r) === 'overdue').length;

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Medication Tracker</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Medicine Reminders</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.25rem' }}>
        Saved to MongoDB · {reminders.length} medications tracked
        {dueCount > 0 && <span style={{ color:'var(--r)', fontStyle:'normal', fontWeight:700 }}> · {dueCount} DUE NOW</span>}
        {overdueCount > 0 && <span style={{ color:'var(--o)', fontStyle:'normal', fontWeight:700 }}> · {overdueCount} OVERDUE</span>}
      </p>

      <div className="grid-2" style={{ alignItems:'start' }}>
        {/* Add form */}
        <div className="card">
          <div className="card-h"><h3>➕ ADD MEDICATION</h3></div>
          <div className="card-b">
            <div className="form-group">
              <label className="form-label">Medicine Name *</label>
              <input className="form-input" placeholder="// e.g. Metformin 500mg" value={form.name} onChange={up('name')}/>
            </div>
            <div className="form-group">
              <label className="form-label">Dosage</label>
              <input className="form-input" placeholder="// e.g. 1 tablet" value={form.dosage} onChange={up('dosage')}/>
            </div>
            <div className="grid-2" style={{ gap:'.55rem' }}>
              <div className="form-group">
                <label className="form-label">Time *</label>
                <input type="time" className="form-input" value={form.time} onChange={up('time')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select className="form-select" value={form.frequency} onChange={up('frequency')}>
                  {['Once daily','Twice daily','Three times daily','Every 8 hours','As needed','Weekly'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" placeholder="// e.g. take with food, before bed" value={form.notes} onChange={up('notes')}/>
            </div>
            <button className="btn btn-primary" style={{ width:'100%' }} onClick={add}>SAVE REMINDER →</button>
          </div>
        </div>

        {/* List */}
        <div className="card">
          <div className="card-h">
            <h3>TODAY'S SCHEDULE</h3>
            <span style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--t3)' }}>{reminders.length} medications</span>
          </div>
          <div className="card-b">
            {loading && <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// Loading from MongoDB...</p>}
            {!loading && reminders.length === 0 && (
              <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// No reminders yet. Add your first medication.</p>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
              {reminders.map(r => {
                const st = getStatus(r);
                const col = statusColors[st];
                const bg  = statusBgs[st];
                return (
                  <div key={r._id} style={{ display:'flex', alignItems:'center', gap:'.7rem', padding:'.7rem .9rem', borderRadius:9, border:`1px solid ${col}33`, background:`${col}08`, transition:'all .2s' }}>
                    <div style={{ width:9, height:9, borderRadius:'50%', background:col, flexShrink:0, boxShadow:`0 0 6px ${col}` }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{r.name}</div>
                      <div style={{ fontSize:10, color:'var(--t3)', fontFamily:'var(--mono)' }}>
                        {r.time}{r.dosage ? ` · ${r.dosage}` : ''} · {r.frequency}{r.notes ? ` · ${r.notes}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize:9, fontWeight:800, padding:'.16rem .5rem', borderRadius:20, background:bg, color:col, border:`1px solid ${col}`, fontFamily:'var(--mono)' }}>
                      {st.toUpperCase()}
                    </span>
                    <button onClick={() => toggleTaken(r)} style={{ padding:'.22rem .5rem', borderRadius:5, border:'1px solid var(--bd)', background:'var(--s3)', color:'var(--t2)', fontSize:9, cursor:'pointer', fontFamily:'var(--mono)', fontWeight:700 }}>
                      {r.takenToday ? '↩' : '✓'}
                    </button>
                    <button onClick={() => remove(r._id)} style={{ padding:'.22rem .48rem', borderRadius:5, border:'none', background:'none', color:'var(--t3)', fontSize:10, cursor:'pointer' }}>✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
