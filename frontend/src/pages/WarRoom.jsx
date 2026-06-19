import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DOCTORS = [
  { id:1, nm:'Dr. Meera Pillai',   sp:'Cardiology',       av:'#0ea5e9', in:'MP' },
  { id:2, nm:'Dr. Suresh Iyer',    sp:'Neurology',        av:'#8b5cf6', in:'SI' },
  { id:3, nm:'Dr. Priya Nair',     sp:'Pediatrics',       av:'#ec4899', in:'PN' },
  { id:4, nm:'Dr. Arjun Gupta',    sp:'Orthopedics',      av:'#10b981', in:'AG' },
  { id:5, nm:'Dr. Kavitha Rao',    sp:'General Surgery',  av:'#f59e0b', in:'KR' },
  { id:6, nm:'Dr. Rahul Mehta',    sp:'ICU Critical',     av:'#ef4444', in:'RM' },
  { id:7, nm:'Dr. Sunita Desai',   sp:'Dermatology',      av:'#6366f1', in:'SD' },
  { id:8, nm:'Dr. Vikram Singh',   sp:'Radiology',        av:'#06b6d4', in:'VS' },
];
const OTS = [
  { id:'OT-1', proc:'Cardiac Bypass',    doc:'Dr. K. Rao',   status:'active',   sec:8073 },
  { id:'OT-2', proc:'Laparoscopy',       doc:'Dr. A. Gupta', status:'active',   sec:2710 },
  { id:'OT-3', proc:'Ready — Standby',   doc:'—',            status:'ready',    sec:0 },
  { id:'OT-4', proc:'Deep Cleaning',     doc:'—',            status:'cleaning', sec:0 },
  { id:'OT-5', proc:'Knee Replacement',  doc:'Dr. V. Singh', status:'active',   sec:4135 },
  { id:'OT-6', proc:'Ready — Standby',   doc:'—',            status:'ready',    sec:0 },
];
const BT = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const AMBS = [
  { id:'AMB-01', drv:'Ravi K.',    loc:'Hospital Bay',          status:'available' },
  { id:'AMB-02', drv:'Suresh M.', loc:'Baner Rd → Hospital',   status:'dispatched' },
  { id:'AMB-03', drv:'Deepak T.', loc:'Kothrud → Hospital',    status:'returning' },
  { id:'AMB-04', drv:'Ankit P.',  loc:'Hospital Bay',          status:'available' },
  { id:'AMB-05', drv:'Sanjay R.', loc:'Hinjewadi → Hospital',  status:'dispatched' },
  { id:'AMB-06', drv:'Manoj B.',  loc:'Depot B',               status:'available' },
];
const WARDS = [
  { nm:'General Ward A', tot:40, occ:34 }, { nm:'General Ward B', tot:35, occ:22 },
  { nm:'ICU',            tot:20, occ:12 }, { nm:'Pediatrics',     tot:25, occ:18 },
  { nm:'Maternity',      tot:20, occ:15 }, { nm:'Cardiac Care',   tot:15, occ:13 },
  { nm:'Oncology',       tot:18, occ:10 }, { nm:'Emergency',      tot:12, occ:8  },
];

function fmtTime(s) {
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sc=s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
}

export default function WarRoom() {
  const { on, joinDoctors } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [docStatus, setDocStatus]   = useState(() => Object.fromEntries(DOCTORS.map(d=>[d.id,d.status||'available'])));
  const [ambStatus, setAmbStatus]   = useState(() => Object.fromEntries(AMBS.map(a=>[a.id,a.status])));
  const [blood, setBlood]           = useState(() => Object.fromEntries(BT.map(t=>[t, Math.floor(Math.random()*28)+3])));
  const [wards, setWards]           = useState(WARDS.map(w=>({...w})));
  const [otSecs, setOtSecs]         = useState(() => Object.fromEntries(OTS.map(o=>[o.id, o.sec])));
  const [docStates, setDocStates]   = useState(() => {
    const m = {}; DOCTORS.forEach(d=>{ m[d.id] = ['available','busy','break'][Math.floor(Math.random()*3)]; });
    m[1]='available'; m[6]='available'; return m;
  });

  useEffect(() => {
    joinDoctors();
    const unsub = on('war:alert', alert => {
      setAlerts(prev => [alert, ...prev].slice(0, 25));
    });
    // Tick OT timers
    const otTimer = setInterval(() => setOtSecs(prev => {
      const next = {...prev};
      OTS.forEach(o => { if(o.status==='active') next[o.id] = (next[o.id]||0)+1; });
      return next;
    }), 1000);
    // Mutate random state every 4s
    const mutate = setInterval(() => {
      if(Math.random()<.3){ const d=DOCTORS[Math.floor(Math.random()*DOCTORS.length)]; setDocStates(prev=>({...prev,[d.id]:['available','busy','break'][Math.floor(Math.random()*3)]})); }
      if(Math.random()<.25){ const a=AMBS[Math.floor(Math.random()*AMBS.length)]; setAmbStatus(prev=>({...prev,[a.id]:['available','dispatched','returning'][Math.floor(Math.random()*3)]})); }
      if(Math.random()<.4){ const t=BT[Math.floor(Math.random()*BT.length)]; setBlood(prev=>({...prev,[t]:Math.max(0,prev[t]+(Math.random()<.4?-1:2))})); }
      if(Math.random()<.3){ setWards(prev=>prev.map(w=>Math.random()<.2?{...w,occ:Math.max(0,Math.min(w.tot,w.occ+Math.floor(Math.random()*3)-1))}:w)); }
    }, 4000);
    return () => { unsub(); clearInterval(otTimer); clearInterval(mutate); };
  }, [on, joinDoctors]);

  const totBeds=wards.reduce((s,w)=>s+w.tot,0), occBeds=wards.reduce((s,w)=>s+w.occ,0);
  const avDocs = Object.values(docStates).filter(s=>s==='available').length;
  const actOTs = OTS.filter(o=>o.status==='active').length;
  const dispAmb= Object.values(ambStatus).filter(s=>s==='dispatched').length;
  const capPct = Math.round(occBeds/totBeds*100);
  const totBlood=BT.reduce((s,t)=>s+blood[t],0);

  const kpis = [
    { l:'Bed Occupancy', v:`${capPct}%`, col:capPct>85?'var(--r)':capPct>70?'var(--y)':'var(--g)', s:`${occBeds}/${totBeds} beds` },
    { l:'Doctors Available', v:`${avDocs}/${DOCTORS.length}`, col:'var(--g)', s:'on duty now' },
    { l:'Active Surgeries', v:actOTs, col:'var(--o)', s:`of ${OTS.length} theatres` },
    { l:'Ambulances Out', v:dispAmb, col:dispAmb>3?'var(--r)':'var(--y)', s:`of ${AMBS.length} fleet` },
    { l:'Blood Inventory', v:totBlood, col:'var(--p)', s:'total units' },
    { l:'Live Alerts', v:alerts.length, col:'var(--r)', s:'since login' },
  ];

  const wardChartData = wards.map(w=>({ name:w.nm.replace(' Ward','').replace('General ',''), occ:w.occ, free:w.tot-w.occ }));

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Hospital Operations Command</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>War Room</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.25rem' }}>Live hospital command center · Real-time WebSocket events · auto-updating every 2s</p>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'.75rem', marginBottom:'1.1rem' }}>
        {kpis.map((k,i)=>(
          <div key={i} className="card" style={{ padding:'.85rem 1rem', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.col}88,${k.col})` }}/>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.09em', color:'var(--t3)', fontFamily:'var(--mono)', marginBottom:'.28rem' }}>{k.l}</div>
            <div style={{ fontSize:'1.65rem', fontWeight:800, fontFamily:'var(--mono)', color:k.col, lineHeight:1 }}>{k.v}</div>
            <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)', marginTop:'.12rem' }}>{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', gap:'.9rem', marginBottom:'.9rem' }}>
        {/* Alerts Feed */}
        <div className="card">
          <div className="card-h"><h3>⚡ LIVE ALERTS</h3><div className="live-dot">LIVE</div></div>
          <div style={{ height:270, overflowY:'auto', padding:'.5rem', display:'flex', flexDirection:'column', gap:'.3rem', background:'var(--s2)' }}>
            {alerts.length===0 && <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// Waiting for events from server...</p>}
            {alerts.map((a,i)=>{
              const cls = { critical:'var(--r)', warning:'var(--y)', success:'var(--g)', info:'var(--p)' }[a.type]||'var(--p)';
              return (
                <div key={i} style={{ padding:'.38rem .52rem', borderRadius:5, border:`1px solid ${cls}44`, background:`${cls}0d`, fontSize:10, fontFamily:'var(--mono)', color:'var(--t2)', animation:'pageIn .3s ease' }}>
                  <div style={{ fontSize:9, color:'var(--t3)', marginBottom:'.1rem' }}>{a.time}</div>
                  {a.msg}
                </div>
              );
            })}
          </div>
        </div>

        {/* Doctor Status */}
        <div className="card">
          <div className="card-h"><h3>👨‍⚕️ DOCTOR STATUS</h3></div>
          <div style={{ padding:'.7rem', display:'grid', gap:'.32rem' }}>
            {DOCTORS.map(d=>{
              const st=docStates[d.id];
              const col={available:'var(--g)',busy:'var(--r)',break:'var(--y)'}[st];
              const lbl={available:'ON DUTY',busy:'IN SURGERY',break:'ON BREAK'}[st];
              return (
                <div key={d.id} style={{ display:'flex', alignItems:'center', gap:'.5rem', padding:'.35rem .5rem', borderRadius:7, background:'var(--s3)', border:`1px solid var(--bd)` }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:d.av, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#000', flexShrink:0, fontFamily:'var(--mono)' }}>{d.in}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:11, color:'var(--t)' }}>{d.nm}</div>
                    <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)' }}>{d.sp}</div>
                  </div>
                  <span style={{ fontSize:9, fontWeight:800, padding:'.14rem .45rem', borderRadius:20, background:`${col}22`, color:col, border:`1px solid ${col}66`, fontFamily:'var(--mono)' }}>{lbl}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* OT Status */}
        <div className="card">
          <div className="card-h"><h3>🔪 OPERATION THEATRES</h3></div>
          <div style={{ padding:'.7rem', display:'grid', gap:'.4rem' }}>
            {OTS.map(o=>{
              const statusColors={active:'var(--r)',ready:'var(--g)',cleaning:'var(--y)'};
              const col=statusColors[o.status];
              const lbl={active:'🔴 ACTIVE',ready:'🟢 READY',cleaning:'🟡 CLEANING'}[o.status];
              return (
                <div key={o.id} style={{ padding:'.5rem .6rem', borderRadius:7, border:`1.5px solid ${col}44`, background:`${col}08`, animation:o.status==='active'?'critFlash 2s infinite':'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:800, fontSize:11, fontFamily:'var(--mono)', color:'var(--t)' }}>{o.id}</span>
                    <span style={{ fontSize:9, fontWeight:700, color:col, fontFamily:'var(--mono)' }}>{lbl}</span>
                  </div>
                  <div style={{ fontSize:10, color:'var(--t2)', marginTop:'.15rem' }}>{o.proc}</div>
                  {o.status==='active' && <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)', marginTop:'.1rem' }}>⏱ {fmtTime(otSecs[o.id]||0)} · {o.doc}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.9rem', marginBottom:'.9rem' }}>
        {/* Blood Bank */}
        <div className="card">
          <div className="card-h"><h3>🩸 BLOOD BANK</h3><span style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)' }}>live inventory</span></div>
          <div style={{ padding:'.75rem', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.5rem' }}>
            {BT.map(t=>{
              const u=blood[t]; const st=u<=2?'var(--r)':u<=8?'var(--y)':'var(--g)';
              return (
                <div key={t} style={{ borderRadius:8, padding:'.55rem .5rem', textAlign:'center', border:`1.5px solid ${st}44`, background:`${st}08`, animation:u<=2?'critFlash .9s infinite':'none' }}>
                  <div style={{ fontSize:13, fontWeight:800, fontFamily:'var(--mono)', color:st }}>{t}</div>
                  <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)', marginTop:'.18rem' }}>{u}u</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ambulances */}
        <div className="card">
          <div className="card-h"><h3>🚑 AMBULANCE DISPATCH</h3></div>
          <div style={{ padding:'.7rem', display:'grid', gap:'.38rem' }}>
            {AMBS.map(a=>{
              const st=ambStatus[a.id];
              const col={available:'var(--g)',dispatched:'var(--r)',returning:'var(--y)'}[st];
              const lbl={available:'AVAILABLE',dispatched:'DISPATCHED',returning:'RETURNING'}[st];
              return (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'.5rem', padding:'.4rem .55rem', borderRadius:7, background:'var(--s3)', border:`1px solid ${col}33` }}>
                  <span style={{ fontSize:'1.1rem' }}>🚑</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, fontFamily:'var(--mono)', color:'var(--t)' }}>{a.id} · {a.drv}</div>
                    <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)' }}>{a.loc}</div>
                  </div>
                  <span style={{ fontSize:9, fontWeight:800, padding:'.14rem .45rem', borderRadius:20, background:`${col}22`, color:col, border:`1px solid ${col}66`, fontFamily:'var(--mono)' }}>{lbl}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ward Capacity Chart */}
      <div className="card">
        <div className="card-h">
          <h3>🏥 WARD CAPACITY</h3>
          <span style={{ fontSize:10, color:'var(--t2)', fontFamily:'var(--mono)' }}>{occBeds}/{totBeds} beds occupied · {totBeds-occBeds} available</span>
        </div>
        <div className="card-b">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={wardChartData} barSize={18}>
              <XAxis dataKey="name" tick={{ fill:'var(--t3)', fontSize:9, fontFamily:'var(--mono)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--t3)', fontSize:9, fontFamily:'var(--mono)' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, fontFamily:'var(--mono)', fontSize:11 }}/>
              <Bar dataKey="occ"  fill="#ff3355" name="Occupied" radius={[4,4,0,0]}/>
              <Bar dataKey="free" fill="#00ff8844" name="Available" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
