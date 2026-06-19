import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DISEASES = [
  { id:'dengue',  nm:'Dengue',       col:'#ff3355', base:450 },
  { id:'covid',   nm:'COVID-19',     col:'#00d4ff', base:1200 },
  { id:'malaria', nm:'Malaria',      col:'#ffcc00', base:320 },
  { id:'cholera', nm:'Cholera',      col:'#00ff88', base:85 },
  { id:'tb',      nm:'Tuberculosis', col:'#ff7700', base:380 },
  { id:'flu',     nm:'Influenza',    col:'#8b5cf6', base:620 },
];

const HOTSPOTS = [
  { state:'Maharashtra',  cx:168, cy:338, disease:'dengue',  severity:'high'    },
  { state:'Karnataka',    cx:168, cy:415, disease:'covid',   severity:'medium'  },
  { state:'Tamil Nadu',   cx:190, cy:478, disease:'malaria', severity:'high'    },
  { state:'Uttar Pradesh',cx:210, cy:182, disease:'tb',      severity:'high'    },
  { state:'West Bengal',  cx:314, cy:230, disease:'cholera', severity:'critical'},
  { state:'Rajasthan',    cx:136, cy:197, disease:'flu',     severity:'medium'  },
  { state:'Gujarat',      cx:112, cy:258, disease:'dengue',  severity:'medium'  },
  { state:'Assam',        cx:360, cy:168, disease:'malaria', severity:'high'    },
  { state:'MP',           cx:190, cy:248, disease:'tb',      severity:'medium'  },
  { state:'Bihar',        cx:264, cy:195, disease:'cholera', severity:'high'    },
  { state:'Kerala',       cx:155, cy:470, disease:'dengue',  severity:'medium'  },
  { state:'Telangana',    cx:215, cy:347, disease:'covid',   severity:'medium'  },
];

const INDIA_STATES = [
  { nm:'J&K',          path:'M140,42 L205,38 L218,62 L205,88 L170,92 L140,75 Z' },
  { nm:'Punjab',       path:'M142,100 L182,96 L190,120 L180,140 L155,143 L138,128 Z' },
  { nm:'HP',           path:'M175,90 L215,85 L225,108 L210,128 L185,130 L170,112 Z' },
  { nm:'Haryana',      path:'M155,130 L195,125 L205,148 L195,165 L168,168 L152,152 Z' },
  { nm:'Uttarakhand',  path:'M200,118 L240,112 L248,135 L235,155 L208,157 L196,140 Z' },
  { nm:'Rajasthan',    path:'M85,145 L175,138 L185,175 L175,215 L145,235 L115,235 L85,220 L70,195 Z' },
  { nm:'Uttar Pradesh',path:'M155,148 L265,142 L275,168 L268,205 L240,218 L190,220 L158,208 Z' },
  { nm:'Bihar',        path:'M240,175 L295,170 L300,195 L290,218 L258,222 L238,208 Z' },
  { nm:'Sikkim',       path:'M310,155 L328,152 L332,168 L315,172 Z' },
  { nm:'Assam',        path:'M330,155 L395,148 L400,170 L390,188 L345,192 L325,175 Z' },
  { nm:'NE States',    path:'M395,155 L440,152 L450,175 L445,205 L408,210 L390,192 Z' },
  { nm:'Gujarat',      path:'M75,225 L130,220 L145,240 L148,270 L130,292 L100,295 L75,278 L65,255 Z' },
  { nm:'MP',           path:'M145,220 L235,215 L250,240 L245,275 L215,290 L175,292 L150,278 L140,255 Z' },
  { nm:'Jharkhand',    path:'M248,222 L298,218 L308,242 L298,268 L268,272 L245,255 Z' },
  { nm:'West Bengal',  path:'M298,195 L335,192 L345,220 L340,258 L315,268 L296,250 L294,225 Z' },
  { nm:'Maharashtra',  path:'M140,290 L175,282 L210,295 L220,325 L205,360 L185,380 L155,375 L135,355 L125,325 Z' },
  { nm:'Chhattisgarh', path:'M218,258 L258,252 L268,275 L262,318 L232,325 L210,308 L205,280 Z' },
  { nm:'Odisha',       path:'M258,268 L310,265 L325,290 L318,325 L285,335 L258,318 L248,295 Z' },
  { nm:'Telangana',    path:'M205,325 L240,320 L255,340 L250,365 L225,372 L203,360 Z' },
  { nm:'AP',           path:'M205,360 L245,355 L260,375 L255,405 L230,418 L205,412 L195,390 Z' },
  { nm:'Karnataka',    path:'M135,385 L180,378 L210,388 L215,420 L195,450 L165,460 L140,445 L128,418 Z' },
  { nm:'Goa',          path:'M140,368 L160,365 L165,382 L153,392 L138,388 Z' },
  { nm:'Tamil Nadu',   path:'M155,455 L200,448 L220,465 L215,505 L190,520 L165,510 L148,490 Z' },
  { nm:'Kerala',       path:'M140,455 L165,450 L170,480 L160,510 L140,505 L130,480 Z' },
];

const ALERT_POOL = [
  { t:'critical', msg:'🦟 Dengue surge in Mumbai — 847 new cases this week · 3 fatalities · Fogging operations ordered' },
  { t:'critical', msg:'💧 Cholera outbreak near Kolkata — contaminated water supply · 45 hospitalised · ORS distribution underway' },
  { t:'warning',  msg:'⚠ COVID uptick in Bangalore — 12% week-on-week rise · New variant detected · Monitoring intensified' },
  { t:'warning',  msg:'🦟 Malaria cases rising in Assam flood zones · 125 cases this week · Vector control teams deployed' },
  { t:'info',     msg:'ℹ TB screening camp in UP — 2,400 screened · 38 new cases detected · Treatment initiated' },
  { t:'critical', msg:'🚨 Dengue hemorrhagic fever in Pune — ICU admissions rising · High-alert districts notified' },
  { t:'warning',  msg:'⚠ Influenza season peaking in Rajasthan · Elderly at high risk · Vaccine stocks requested' },
  { t:'success',  msg:'✓ Chennai COVID containment successful · Positivity rate down to 0.8% · Restrictions eased' },
  { t:'critical', msg:'🚨 Cholera spreading along Bihar river basin · 5 districts affected · Emergency response activated' },
  { t:'info',     msg:'ℹ Kerala malaria-free milestone for 2nd consecutive month · WHO monitoring visit scheduled' },
  { t:'warning',  msg:'⚠ MDR-TB cluster in Dharavi — 180 contact tracing initiated · Drug-resistant strain confirmed' },
];

function getSevColor(sev) {
  return { critical:'#ff3355', high:'#ff7700', medium:'#ffcc00', low:'#00ff88' }[sev] || '#00d4ff';
}

export default function EpidemicRadar() {
  const [cases, setCases]     = useState(() => Object.fromEntries(DISEASES.map(d=>[d.id,d.base])));
  const [trends, setTrends]   = useState(() => Object.fromEntries(DISEASES.map(d=>[d.id, Array.from({length:7},(_,i)=>Math.max(10,d.base+Math.floor((Math.random()-.4)*d.base*.3)-((6-i)*d.base*.02)))])));
  const [alerts, setAlerts]   = useState([]);
  const [pulsePhase, setPulsePhase] = useState(0);
  const alertIdxRef = useRef(0);
  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      // Drift case counts
      setCases(prev => {
        const next = {...prev};
        DISEASES.forEach(d => { next[d.id] = Math.max(10, prev[d.id] + Math.floor((Math.random()-.35)*d.base*.04)); });
        return next;
      });
      setTrends(prev => {
        const next = {...prev};
        DISEASES.forEach(d => {
          const newVal = Math.max(10, prev[d.id][prev[d.id].length-1] + Math.floor((Math.random()-.35)*d.base*.04));
          next[d.id] = [...prev[d.id].slice(1), newVal];
        });
        return next;
      });
      // Random alert
      if (Math.random() < 0.4) {
        const al = ALERT_POOL[alertIdxRef.current % ALERT_POOL.length];
        alertIdxRef.current++;
        setAlerts(prev => [{ ...al, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
      }
      setPulsePhase(p => p + 1);
    }, 2500);
    return () => clearInterval(tickRef.current);
  }, []);

  const stateColors = INDIA_STATES.map(s => {
    const hs = HOTSPOTS.find(h => s.nm.includes(h.state) || h.state.includes(s.nm));
    if (!hs) return { fill:'var(--s3)', stroke:'var(--bd)' };
    const col = getSevColor(hs.severity);
    return { fill:`${col}33`, stroke:col, strokeWidth:hs.severity==='critical'?2.5:1.5 };
  });

  const alertColors = { critical:'#ff3355', warning:'#ffcc00', success:'#00ff88', info:'#00d4ff' };

  const trendChartData = (id) => trends[id].map((v,i) => ({ day:`D${i+1}`, cases:v }));

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Live Disease Surveillance</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Epidemic Radar</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.25rem' }}>Real-time outbreak monitoring across India · Active hotspots · Infection trends · Risk zones</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        {/* India Map */}
        <div className="card" style={{ gridRow:'span 2' }}>
          <div className="card-h"><h3>🗺 INDIA OUTBREAK MAP</h3><div className="live-dot">LIVE</div></div>
          <div className="card-b" style={{ padding:'.75rem' }}>
            <svg viewBox="0 0 500 580" style={{ width:'100%', height:'auto', display:'block' }}>
              {/* State paths */}
              {INDIA_STATES.map((s, i) => (
                <path key={s.nm} d={s.path}
                  fill={stateColors[i].fill} stroke={stateColors[i].stroke}
                  strokeWidth={stateColors[i].strokeWidth || 1.2}
                  style={{ cursor:'pointer', transition:'fill .5s' }}>
                  <title>{s.nm}</title>
                </path>
              ))}
              {/* Hotspot animations */}
              {HOTSPOTS.map((h, i) => {
                const col = getSevColor(h.severity);
                const pulse = (pulsePhase + i) % 4;
                const ringR = 8 + pulse * 4;
                const ringOpacity = Math.max(0, 0.7 - pulse * 0.18);
                const dis = DISEASES.find(d=>d.id===h.disease);
                return (
                  <g key={i}>
                    <circle cx={h.cx} cy={h.cy} r={ringR} fill={col} opacity={ringOpacity} style={{ pointerEvents:'none' }}/>
                    <circle cx={h.cx} cy={h.cy} r={7} fill={col} opacity={0.9}/>
                    <text x={h.cx} y={h.cy+4} textAnchor="middle" fontSize={7} fontFamily="JetBrains Mono" fill="#000" fontWeight="700">
                      {h.disease.substring(0,3).toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>
            {/* Legend */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem', marginTop:'.5rem' }}>
              <span style={{ fontSize:10, color:'var(--t3)', fontFamily:'var(--mono)', fontWeight:700 }}>Severity:</span>
              {['critical','high','medium','low'].map(s => (
                <span key={s} style={{ display:'flex', alignItems:'center', gap:'.3rem', fontSize:10, fontFamily:'var(--mono)', color:'var(--t2)' }}>
                  <span style={{ width:10, height:10, borderRadius:'50%', background:getSevColor(s), display:'inline-block' }}/>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts ticker */}
        <div className="card">
          <div className="card-h"><h3>⚡ OUTBREAK ALERTS</h3><span style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)' }}>{new Date().toLocaleTimeString()}</span></div>
          <div style={{ height:200, overflowY:'auto', padding:'.5rem', display:'flex', flexDirection:'column', gap:'.3rem', background:'var(--s2)' }}>
            {alerts.length===0 && <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// Monitoring active...</p>}
            {alerts.map((a, i) => {
              const col = alertColors[a.t] || '#00d4ff';
              return (
                <div key={i} style={{ padding:'.38rem .52rem', borderRadius:5, border:`1px solid ${col}44`, background:`${col}0d`, fontSize:10, fontFamily:'var(--mono)', color:'var(--t2)', animation:'pageIn .3s ease', flexShrink:0 }}>
                  <div style={{ fontSize:9, color:'var(--t3)', marginBottom:'.1rem' }}>{a.time}</div>
                  {a.msg}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active outbreaks table */}
        <div className="card">
          <div className="card-h"><h3>📊 ACTIVE OUTBREAKS</h3></div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr>{['Disease','Region','Cases','Trend','Alert'].map(h=>(
                  <th key={h} style={{ padding:'.6rem .8rem', textAlign:'left', background:'var(--s3)', fontWeight:700, fontSize:9, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--t3)', borderBottom:'1px solid var(--bd)', fontFamily:'var(--mono)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {HOTSPOTS.slice(0,8).map((h, i) => {
                  const dis = DISEASES.find(d=>d.id===h.disease);
                  const c = cases[h.disease] || 0;
                  const t = trends[h.disease] || [];
                  const chg = t.length > 1 ? t[t.length-1] - t[t.length-2] : 0;
                  const sevCol = getSevColor(h.severity);
                  return (
                    <tr key={i} onMouseOver={e=>e.currentTarget.style.background='var(--s2)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'.65rem .8rem', borderBottom:'1px solid var(--bd)', fontWeight:700, color:dis?.col, fontFamily:'var(--mono)' }}>{dis?.nm}</td>
                      <td style={{ padding:'.65rem .8rem', borderBottom:'1px solid var(--bd)', fontSize:10 }}>{h.state}</td>
                      <td style={{ padding:'.65rem .8rem', borderBottom:'1px solid var(--bd)', fontWeight:700, fontFamily:'var(--mono)' }}>{c.toLocaleString()}</td>
                      <td style={{ padding:'.65rem .8px', borderBottom:'1px solid var(--bd)', fontFamily:'var(--mono)', color:chg>0?'var(--r)':'var(--g)', fontWeight:800 }}>{chg>0?'↑':'↓'} {Math.abs(chg)}</td>
                      <td style={{ padding:'.65rem .8rem', borderBottom:'1px solid var(--bd)' }}>
                        <span style={{ padding:'.14rem .45rem', borderRadius:20, fontSize:9, fontWeight:700, background:`${sevCol}22`, color:sevCol, border:`1px solid ${sevCol}66`, fontFamily:'var(--mono)' }}>{h.severity.toUpperCase()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7-day trend charts */}
      <div className="card">
        <div className="card-h"><h3>📈 7-DAY INFECTION TRENDS</h3><span style={{ fontSize:10, color:'var(--t3)', fontFamily:'var(--mono)' }}>Live updating every 2.5s</span></div>
        <div className="card-b" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'.75rem' }}>
          {DISEASES.map(d => {
            const data = trendChartData(d.id);
            const last = data[data.length-1]?.cases || 0;
            const prev = data[data.length-2]?.cases || last;
            const chg = last - prev;
            const chgPct = prev > 0 ? ((chg/prev)*100).toFixed(1) : 0;
            return (
              <div key={d.id} style={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:9, padding:'.7rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.45rem' }}>
                  <span style={{ fontSize:10, fontWeight:700, fontFamily:'var(--mono)', color:d.col }}>{d.nm}</span>
                  <span style={{ fontSize:10, fontWeight:800, fontFamily:'var(--mono)', color:chg>0?'var(--r)':'var(--g)' }}>{chg>0?'+':''}{chgPct}%</span>
                </div>
                <div style={{ fontSize:'1.2rem', fontWeight:800, fontFamily:'var(--mono)', color:d.col, marginBottom:'.35rem' }}>{last.toLocaleString()}</div>
                <ResponsiveContainer width="100%" height={50}>
                  <LineChart data={data}>
                    <Line type="monotone" dataKey="cases" stroke={d.col} strokeWidth={2} dot={false}/>
                    <XAxis dataKey="day" hide/>
                    <YAxis hide/>
                    <Tooltip contentStyle={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:6, fontFamily:'var(--mono)', fontSize:10 }} formatter={v=>[v.toLocaleString(),'Cases']}/>
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, color:'var(--t3)', fontFamily:'var(--mono)', marginTop:'.2rem' }}>
                  <span>7 days ago</span><span>today</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
