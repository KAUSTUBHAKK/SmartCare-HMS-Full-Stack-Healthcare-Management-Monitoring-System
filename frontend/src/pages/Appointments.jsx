import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format, addDays, isBefore, startOfDay } from 'date-fns';

const SPECIALISTS = [
  { id:'general',       name:'General Physician',   icon:'🩺' },
  { id:'pediatrician',  name:'Pediatrician',         icon:'👶' },
  { id:'dermatologist', name:'Dermatologist',        icon:'🧴' },
  { id:'radiologist',   name:'Radiologist',          icon:'🔬' },
  { id:'cardiologist',  name:'Cardiologist',         icon:'❤️' },
  { id:'orthopedic',    name:'Orthopedic',           icon:'🦴' },
  { id:'neurologist',   name:'Neurologist',          icon:'🧠' },
  { id:'ophthalmologist',name:'Ophthalmologist',     icon:'👁️' },
];
const TIME_SLOTS = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM'];

export default function Appointments() {
  const [step, setStep]         = useState(1);
  const [selSpec, setSelSpec]   = useState(null);
  const [selDate, setSelDate]   = useState(new Date());
  const [selSlot, setSelSlot]   = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [form, setForm]         = useState({ patientName:'', age:'', phone:'', problem:'' });
  const [loading, setLoading]   = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const up = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Fetch booked slots whenever spec or date changes
  useEffect(() => {
    if (!selSpec || !selDate) return;
    setSlotsLoading(true);
    const dateStr = format(selDate, 'yyyy-MM-dd');
    axios.get('/api/appointments/slots', { params: { date: dateStr, specialistId: selSpec.id } })
      .then(r => setBookedSlots(r.data))
      .catch(() => setBookedSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selSpec, selDate]);

  const book = async () => {
    if (!form.patientName || !form.age || !form.phone || !form.problem) {
      toast.error('Please fill in all details'); return;
    }
    setLoading(true);
    try {
      const apt = await axios.post('/api/appointments', {
        patientName: form.patientName,
        age: parseInt(form.age),
        phone: form.phone,
        problem: form.problem,
        specialist: `${selSpec.icon} ${selSpec.name}`,
        specialistId: selSpec.id,
        date: selDate.toISOString(),
        slot: selSlot,
        status: 'Scheduled',
      });
      setConfirmed(apt.data);
      toast.success('Appointment booked and saved to database!');
    } catch(e) {
      toast.error(e.response?.data?.error || 'Booking failed');
    } finally { setLoading(false); }
  };

  const changeDate = (dir) => {
    const nd = addDays(selDate, dir);
    if (isBefore(startOfDay(nd), startOfDay(new Date()))) return;
    setSelDate(nd); setSelSlot(null);
  };

  if (confirmed) return (
    <div style={{ maxWidth:500, margin:'2rem auto' }}>
      <div className="card" style={{ padding:'2rem', textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'.75rem' }}>✅</div>
        <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--g)', letterSpacing:'.14em', marginBottom:'.35rem', textTransform:'uppercase' }}>// Booking Confirmed · Saved to DB</div>
        <h2 style={{ fontSize:'1.4rem', fontWeight:800, marginBottom:'.35rem' }}>Appointment Booked!</h2>
        <p style={{ color:'var(--t2)', fontSize:12, fontFamily:'var(--mono)', marginBottom:'1.2rem' }}>Your appointment has been saved to the database</p>
        <div style={{ background:'var(--s2)', borderRadius:10, padding:'1rem', textAlign:'left', fontSize:12, display:'grid', gap:'.5rem', border:'1px solid var(--bd)', marginBottom:'1.2rem' }}>
          {[['Patient', confirmed.patientName],['Specialist', confirmed.specialist],['Date', format(new Date(confirmed.date),'EEE, MMM d yyyy')],['Time', confirmed.slot],['Phone', confirmed.phone],['Status', confirmed.status]].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:10 }}>{k}</span>
              <strong style={{ fontFamily:'var(--mono)' }}>{v}</strong>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:'.65rem' }}>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => { setConfirmed(null); setStep(1); setSelSpec(null); setSelSlot(null); setForm({ patientName:'', age:'', phone:'', problem:'' }); }}>Book Another</button>
          <a href="/my-appointments" className="btn btn-primary" style={{ flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center' }}>View All Records →</a>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Appointment System</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Book a Consultation</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.5rem' }}>Slots are fetched live from the database — no double-bookings possible</p>

      {/* Step 1: Specialist */}
      <div className="card" style={{ marginBottom:'1rem' }}>
        <div className="card-h">
          <h3>01 · SELECT SPECIALIST</h3>
          {selSpec && <span style={{ fontSize:10, color:'var(--g)', fontFamily:'var(--mono)', fontWeight:700 }}>// {selSpec.icon} {selSpec.name}</span>}
        </div>
        <div className="card-b">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:'.6rem' }}>
            {SPECIALISTS.map(s => (
              <div key={s.id} onClick={() => { setSelSpec(s); setStep(Math.max(step,2)); setSelSlot(null); }} style={{
                border:`1.5px solid ${selSpec?.id===s.id ? 'var(--p)' : 'var(--bd)'}`,
                borderRadius:11, padding:'.8rem .55rem', textAlign:'center', cursor:'pointer',
                background: selSpec?.id===s.id ? 'var(--pd)' : 'var(--s1)',
                boxShadow: selSpec?.id===s.id ? '0 0 0 3px rgba(0,212,255,.12)' : 'none',
                transition:'all .22s'
              }}>
                <div style={{ fontSize:'1.5rem', marginBottom:'.3rem' }}>{s.icon}</div>
                <div style={{ fontSize:10, fontWeight:700, color: selSpec?.id===s.id ? 'var(--p)' : 'var(--t2)' }}>{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selSpec && (
        <div className="grid-2" style={{ alignItems:'start' }}>
          {/* Step 2: Date + Slot */}
          <div className="card">
            <div className="card-h">
              <h3>02 · DATE & SLOT{selSlot && <span style={{ marginLeft:'.5rem', fontSize:10, color:'var(--g)', fontFamily:'var(--mono)', fontWeight:700 }}>// {selSlot} ✓</span>}</h3>
              <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                <button onClick={() => changeDate(-1)} style={{ padding:'.25rem .52rem', border:'1px solid var(--bd)', borderRadius:5, background:'var(--s2)', color:'var(--t)', cursor:'pointer' }}>‹</button>
                <span style={{ fontSize:10, fontWeight:700, fontFamily:'var(--mono)', minWidth:110, textAlign:'center' }}>{format(selDate, 'EEE, MMM d')}</span>
                <button onClick={() => changeDate(1)}  style={{ padding:'.25rem .52px', border:'1px solid var(--bd)', borderRadius:5, background:'var(--s2)', color:'var(--t)', cursor:'pointer' }}>›</button>
              </div>
            </div>
            <div className="card-b">
              <div style={{ display:'flex', gap:'.45rem', marginBottom:'.6rem', flexWrap:'wrap' }}>
                {[['var(--p)','Selected'],['var(--s3)','Booked (DB)'],['var(--s2)','Available']].map(([col,lbl])=>(
                  <span key={lbl} style={{ display:'flex', alignItems:'center', gap:'.3rem', fontSize:9, fontFamily:'var(--mono)', color:'var(--t3)' }}>
                    <span style={{ width:10, height:10, borderRadius:2, background:col, border:`1px solid var(--bd)`, display:'inline-block' }}/>
                    {lbl}
                  </span>
                ))}
              </div>
              {slotsLoading ? (
                <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// Loading slots from database...</p>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))', gap:'.38rem', maxHeight:210, overflowY:'auto' }}>
                  {TIME_SLOTS.map(slot => {
                    const booked = bookedSlots.includes(slot);
                    const sel    = selSlot === slot;
                    return (
                      <button key={slot} disabled={booked} onClick={() => { setSelSlot(slot); setStep(Math.max(step,3)); }} style={{
                        padding:'.45rem .2rem', borderRadius:6,
                        border:`1.5px solid ${sel ? 'var(--p)' : booked ? 'var(--bd)' : 'var(--bd2)'}`,
                        background: sel ? 'var(--p)' : booked ? 'var(--s3)' : 'var(--s2)',
                        color: sel ? '#000' : booked ? 'var(--t3)' : 'var(--t2)',
                        fontSize:10, fontWeight:700, fontFamily:'var(--mono)',
                        cursor: booked ? 'not-allowed' : 'pointer',
                        textDecoration: booked ? 'line-through' : 'none', opacity: booked ? .6 : 1,
                      }}>{slot}</button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Details */}
          <div className="card">
            <div className="card-h"><h3>03 · PATIENT DETAILS</h3></div>
            <div className="card-b">
              {[['patientName','text','Full Name *','// full name'],['age','number','Age *','// years'],['phone','text','Phone *','// +91 XXXXX XXXXX']].map(([k,t,l,ph]) => (
                <div className="form-group" key={k}>
                  <label className="form-label">{l}</label>
                  <input type={t} className="form-input" placeholder={ph} value={form[k]} onChange={up(k)}/>
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Problem / Symptoms *</label>
                <textarea className="form-input" rows={3} placeholder="// describe symptoms..." value={form.problem} onChange={up('problem')} style={{ resize:'vertical' }}/>
              </div>
              <button className="btn btn-primary" style={{ width:'100%' }} disabled={!selSlot || loading} onClick={book}>
                {loading ? 'Saving to database...' : !selSlot ? 'Select a slot first' : 'CONFIRM BOOKING →'}
              </button>
              {!selSlot && <p style={{ fontSize:10, color:'var(--t3)', fontFamily:'var(--mono)', textAlign:'center', marginTop:'.4rem' }}>// Select date & slot first</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
