import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function MyAppointments() {
  const { isDoctor } = useAuth();
  const [apts, setApts]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSpec, setFilterSpec]     = useState('');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    axios.get('/api/appointments')
      .then(r => setApts(r.data))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/appointments/${id}`, { status });
      setApts(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Update failed'); }
  };

  const filtered = apts.filter(a =>
    (filterStatus ? a.status === filterStatus : true) &&
    (filterSpec   ? a.specialist?.includes(filterSpec) : true) &&
    (search ? a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
              a.problem?.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const specs = [...new Set(apts.map(a => a.specialist))].filter(Boolean);
  const statusColors = { Scheduled:'badge-cyan', Confirmed:'badge-green', Completed:'badge-yellow', Cancelled:'badge-red' };

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Records</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Appointments</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.5rem' }}>
        {filtered.length} of {apts.length} records · Live from MongoDB
      </p>

      <div className="card">
        <div className="card-h">
          <h3>ALL RECORDS</h3>
          <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
            <input className="form-input" placeholder="// search name or problem..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:200, padding:'.28rem .65rem', fontSize:11 }}/>
            <select className="form-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ width:120, padding:'.28rem .65rem', fontSize:11 }}>
              <option value="">All Status</option>
              {['Scheduled','Confirmed','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="form-select" value={filterSpec} onChange={e=>setFilterSpec(e.target.value)} style={{ width:145, padding:'.28rem .65rem', fontSize:11 }}>
              <option value="">All Specialists</option>
              {specs.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX:'auto' }}>
          {loading ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--t3)', fontFamily:'var(--mono)', fontSize:12 }}>// Loading from MongoDB...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--t3)', fontFamily:'var(--mono)', fontSize:12 }}>// No records found. Book an appointment to see it here.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['Patient','Age','Specialist','Date','Slot','Problem','Phone','Status',...(isDoctor?['Actions']:[])].map(h => (
                    <th key={h} style={{ padding:'.65rem 1rem', textAlign:'left', background:'var(--s3)', fontWeight:700, fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--t3)', borderBottom:'1px solid var(--bd)', fontFamily:'var(--mono)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a._id} style={{ transition:'background .15s' }}
                    onMouseOver={e=>e.currentTarget.style.background='var(--s2)'}
                    onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'.75rem 1rem', borderBottom:'1px solid var(--bd)', fontWeight:700 }}>{a.patientName}</td>
                    <td style={{ padding:'.75rem 1rem', borderBottom:'1px solid var(--bd)', fontFamily:'var(--mono)' }}>{a.age}</td>
                    <td style={{ padding:'.75rem 1rem', borderBottom:'1px solid var(--bd)' }}>{a.specialist}</td>
                    <td style={{ padding:'.75rem 1rem', borderBottom:'1px solid var(--bd)', fontFamily:'var(--mono)', fontSize:11 }}>
                      {a.date ? format(new Date(a.date),'MMM d, yyyy') : '—'}
                    </td>
                    <td style={{ padding:'.75rem 1rem', borderBottom:'1px solid var(--bd)', fontFamily:'var(--mono)' }}>{a.slot}</td>
                    <td style={{ padding:'.75rem 1rem', borderBottom:'1px solid var(--bd)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--mono)', fontSize:11 }} title={a.problem}>{a.problem}</td>
                    <td style={{ padding:'.75rem 1rem', borderBottom:'1px solid var(--bd)', fontFamily:'var(--mono)' }}>{a.phone}</td>
                    <td style={{ padding:'.75rem 1rem', borderBottom:'1px solid var(--bd)' }}>
                      <span className={`badge ${statusColors[a.status]||'badge-cyan'}`}>{a.status}</span>
                    </td>
                    {isDoctor && (
                      <td style={{ padding:'.75rem 1rem', borderBottom:'1px solid var(--bd)' }}>
                        <select value={a.status} onChange={e=>updateStatus(a._id, e.target.value)}
                          style={{ padding:'.2rem .5rem', borderRadius:5, border:'1px solid var(--bd)', background:'var(--s3)', color:'var(--t)', fontSize:10, fontFamily:'var(--mono)', cursor:'pointer' }}>
                          {['Scheduled','Confirmed','Completed','Cancelled'].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
