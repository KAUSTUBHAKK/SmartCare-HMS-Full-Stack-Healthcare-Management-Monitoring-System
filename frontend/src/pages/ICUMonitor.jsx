import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';

const CRIT = { hr: v=>v>130||v<50, bp_s: v=>v>185||v<90, spo2: v=>v<88, temp: v=>parseFloat(v)>39.5, rr: v=>v>32||v<8, glucose: v=>v>400||v<60 };
const WARN = { hr: v=>v>110||v<55, bp_s: v=>v>160||v<100, spo2: v=>v<92, temp: v=>parseFloat(v)>38.5, rr: v=>v>25||v<12, glucose: v=>v>250||v<80 };

function vStatus(key, val) {
  if (CRIT[key]?.(val)) return 'crit';
  if (WARN[key]?.(val)) return 'warn';
  return 'ok';
}

function ECGCanvas({ hr, status }) {
  const canvasRef = useRef(null);
  const phaseRef  = useRef(Math.random() * Math.PI * 2);
  const rafRef    = useRef(null);

  useEffect(() => {
    const draw = () => {
      const c = canvasRef.current; if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      c.width  = c.offsetWidth  * dpr;
      c.height = c.offsetHeight * dpr;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      const speed = (hr || 80) / 70;
      phaseRef.current = (phaseRef.current + 0.055 * speed) % (Math.PI * 2);
      const col = status === 'crit' ? '#ff3355' : status === 'warn' ? '#ffcc00' : '#00ff88';
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < 100; i++) {
        const x = (i/100)*c.width, t = (i/100)*Math.PI*6 + phaseRef.current;
        let y = Math.sin(t)*1.5;
        const ph = t % (Math.PI*2);
        if (ph>1.8&&ph<2.0) y+=9; if (ph>2.3&&ph<2.35) y-=6;
        if (ph>2.35&&ph<2.45) y+=18; if (ph>2.45&&ph<2.55) y-=8;
        if (ph>2.8&&ph<3.3) y+=4.5;
        const yp = c.height/2 - y*(c.height/50);
        i===0 ? ctx.moveTo(x,yp) : ctx.lineTo(x,yp);
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hr, status]);

  return <canvas ref={canvasRef} style={{ width:'100%', height:32, display:'block' }}/>;
}

function VitalBox({ label, value, unit, status, history = [] }) {
  const colors = { ok:'#00ff88', warn:'#ffcc00', crit:'#ff3355' };
  const bgs    = { ok:'rgba(0,255,136,.04)', warn:'rgba(255,204,0,.05)', crit:'rgba(255,51,85,.07)' };
  const borders= { ok:'rgba(0,255,136,.2)', warn:'rgba(255,204,0,.28)', crit:'rgba(255,51,85,.38)' };
  const col = colors[status]; const max = Math.max(...history,1), mn = Math.min(...history,0);

  return (
    <div style={{ borderRadius:9, padding:'.65rem .75rem', border:`1.5px solid ${borders[status]}`,
      background: status==='crit' ? undefined : bgs[status],
      animation: status==='crit' ? 'critFlash 0.9s infinite' : 'none' }}>
      <div style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'.09em', color:col, fontFamily:'var(--mono)', marginBottom:'.25rem' }}>{label}</div>
      <div style={{ fontSize:'1.4rem', fontWeight:600, fontFamily:'var(--mono)', color:col, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)', marginTop:'.13rem' }}>{unit}</div>
      {status !== 'ok' && <div style={{ fontSize:9, fontWeight:800, color:col, fontFamily:'var(--mono)', marginTop:'.28rem' }}>⚠ {status==='crit' ? 'CRITICAL' : 'WARNING'}</div>}
      <div style={{ display:'flex', alignItems:'flex-end', gap:1.5, height:22, marginTop:'.4rem' }}>
        {history.slice(-10).map((v,i) => {
          const h = max===mn ? 10 : Math.max(2, Math.round(((v-mn)/(max-mn))*18));
          return <div key={i} style={{ width:4, height:h, borderRadius:1, background:`${col}${i===9?'ff':'66'}` }}/>;
        })}
      </div>
    </div>
  );
}

export default function ICUMonitor() {
  const { on, joinDoctors } = useSocket();
  const [patients, setPatients]   = useState([]);
  const [histories, setHistories] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected, setConnected]   = useState(false);

  useEffect(() => {
    joinDoctors();
    setConnected(true);

    const unsnap = on('vitals:snapshot', data => {
      setPatients(data);
      const h = {};
      data.forEach(p => {
        h[p.id] = {};
        ['hr','bp_s','spo2','temp','rr','glucose'].forEach(k => {
          h[p.id][k] = (p.history || []).map(v => v[k] ? parseFloat(v[k]) : 0);
        });
      });
      setHistories(h);
    });

    const unsub = on('vitals:update', data => {
      setPatients(data);
      setLastUpdate(new Date());
      setHistories(prev => {
        const next = { ...prev };
        data.forEach(p => {
          if (!next[p.id]) next[p.id] = { hr:[], bp_s:[], spo2:[], temp:[], rr:[], glucose:[] };
          ['hr','bp_s','spo2','temp','rr','glucose'].forEach(k => {
            next[p.id][k] = [...(next[p.id][k] || []), parseFloat(p.vitals?.[k] || 0)].slice(-30);
          });
        });
        return next;
      });
    });

    return () => { unsnap(); unsub(); };
  }, [on, joinDoctors]);

  const critCount = patients.filter(p => {
    const v = p.vitals;
    return v && (CRIT.hr(v.hr)||CRIT.bp_s(v.bp_s)||CRIT.spo2(v.spo2)||CRIT.temp(parseFloat(v.temp))||CRIT.rr(v.rr)||CRIT.glucose(v.glucose));
  }).length;
  const warnCount = patients.filter(p => {
    const v = p.vitals;
    if (!v) return false;
    const isCrit = CRIT.hr(v.hr)||CRIT.bp_s(v.bp_s)||CRIT.spo2(v.spo2)||CRIT.temp(parseFloat(v.temp));
    const isWarn = WARN.hr(v.hr)||WARN.bp_s(v.bp_s)||WARN.spo2(v.spo2)||WARN.temp(parseFloat(v.temp));
    return isWarn && !isCrit;
  }).length;

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Live ICU Feed</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Patient Monitor</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.25rem' }}>Real-time vitals · WebSocket feed · updates every 2 seconds</p>

      {/* Summary bar */}
      <div style={{ display:'flex', alignItems:'center', gap:'.85rem', marginBottom:'1.1rem', flexWrap:'wrap' }}>
        <div className="live-dot">LIVE</div>
        {connected && <span style={{ fontSize:10, color:'var(--g)', fontFamily:'var(--mono)' }}>WebSocket connected</span>}
        <span className="badge badge-green">✓ {patients.length - critCount - warnCount} Stable</span>
        {warnCount > 0 && <span className="badge badge-yellow">⚠ {warnCount} Watch</span>}
        {critCount > 0 && <span className="badge badge-red" style={{ animation:'critFlash 1s infinite' }}>🚨 {critCount} Critical</span>}
        <span style={{ marginLeft:'auto', fontSize:10, color:'var(--t3)', fontFamily:'var(--mono)' }}>
          {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Waiting for data...'}
        </span>
      </div>

      {patients.length === 0 && (
        <div className="card" style={{ padding:'3rem', textAlign:'center' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem', opacity:.3 }}>📡</div>
          <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:12 }}>// Connecting to ICU feed via WebSocket...</p>
        </div>
      )}

      {patients.map(p => {
        const v = p.vitals; if (!v) return null;
        const hist = histories[p.id] || {};
        const hrS  = vStatus('hr',   v.hr);
        const bpS  = vStatus('bp_s', v.bp_s);
        const spS  = vStatus('spo2', v.spo2);
        const tpS  = vStatus('temp', parseFloat(v.temp));
        const rrS  = vStatus('rr',   v.rr);
        const glS  = vStatus('glucose', v.glucose);
        const statuses = [hrS,bpS,spS,tpS,rrS,glS];
        const cardStatus = statuses.includes('crit') ? 'crit' : statuses.includes('warn') ? 'warn' : 'ok';

        return (
          <div key={p.id} className="card" style={{
            marginBottom:'.9rem',
            borderColor: cardStatus==='crit' ? 'var(--r)' : cardStatus==='warn' ? 'var(--y)' : 'var(--bd)',
            animation: cardStatus==='crit' ? 'critFlash 1.5s infinite' : 'none'
          }}>
            {/* Patient header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.65rem 1rem', background:'var(--s2)', borderBottom:'1px solid var(--bd)', flexWrap:'wrap', gap:'.4rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'.65rem' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:p.avatar, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#000', flexShrink:0, fontFamily:'var(--mono)' }}>
                  {p.name.split(' ').map(w=>w[0]).join('').substring(0,2)}
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:13, color:'var(--t)' }}>{p.name}</div>
                  <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)' }}>Age {p.age} · {p.ward} Bed {p.bed} · {p.condition}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                <span className={`badge ${cardStatus==='crit' ? 'badge-red' : cardStatus==='warn' ? 'badge-yellow' : 'badge-green'}`}
                  style={{ animation: cardStatus==='crit' ? 'critFlash .85s infinite' : 'none' }}>
                  {cardStatus==='crit' ? '🚨 CRITICAL' : cardStatus==='warn' ? '⚠ MONITOR' : '✓ STABLE'}
                </span>
                <span style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)' }}>{v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : ''}</span>
              </div>
            </div>

            {/* Vitals grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'.5rem', padding:'.75rem 1rem' }}>
              <VitalBox label="Heart Rate"     value={v.hr}       unit="bpm"        status={hrS} history={hist.hr||[]}      />
              <VitalBox label="Blood Pressure" value={v.bp}       unit="mmHg"       status={bpS} history={hist.bp_s||[]}    />
              <VitalBox label="SpO₂"           value={`${v.spo2}%`} unit="Oxygen Sat." status={spS} history={hist.spo2||[]}/>
              <VitalBox label="Temperature"    value={`${v.temp}°C`} unit="Body Temp" status={tpS} history={hist.temp||[]} />
              <VitalBox label="Resp. Rate"     value={v.rr}       unit="br/min"     status={rrS} history={hist.rr||[]}      />
              <VitalBox label="Blood Glucose"  value={v.glucose}  unit="mg/dL"      status={glS} history={hist.glucose||[]} />
            </div>

            {/* ECG Strip */}
            <div style={{ padding:'.35rem 1rem .6rem', borderTop:'1px solid var(--bd)' }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--t3)', fontFamily:'var(--mono)', marginBottom:'.2rem' }}>// ECG — Continuous</div>
              <ECGCanvas hr={v.hr} status={hrS}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}
