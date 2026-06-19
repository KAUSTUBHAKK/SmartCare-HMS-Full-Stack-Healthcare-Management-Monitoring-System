import React, { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';

const CONDITIONS = [
  { nm:'Type 2 Diabetes',    base:8,  f:{bmi:3.5,age:.15,smoke:2,act:3,diet:3,alc:1.5,fam:'diabetes'   }},
  { nm:'Heart Disease',      base:6,  f:{bmi:2.5,age:.25,smoke:5,act:3.5,diet:2.5,alc:2,bp:3,fam:'heart'}},
  { nm:'Hypertension',       base:10, f:{bmi:2,  age:.2, smoke:2.5,act:2,diet:2,alc:2.5,bp:4,fam:'hypertension'}},
  { nm:'Stroke',             base:3,  f:{bmi:1.5,age:.2, smoke:4,act:2,diet:1.5,alc:2,bp:4,fam:'stroke' }},
  { nm:'Lung Cancer',        base:2,  f:{bmi:.5, age:.1, smoke:12,act:.5,diet:1,alc:.5,fam:'cancer'     }},
  { nm:'Colorectal Cancer',  base:3,  f:{bmi:1.5,age:.12,smoke:2,act:1.5,diet:3,alc:2,fam:'cancer'     }},
  { nm:'Breast Cancer',      base:4,  f:{bmi:1,  age:.15,smoke:.5,act:1,diet:.5,alc:1.5,fam:'cancer'   }, female:true },
  { nm:'Osteoporosis',       base:5,  f:{bmi:-1.5,age:.2,smoke:2,act:-.5,diet:2,alc:1,fam:'osteoporosis'}},
  { nm:'Depression',         base:8,  f:{bmi:.5, age:.05,smoke:1.5,act:2.5,diet:1.5,alc:3,sl:4,fam:'depression'}},
  { nm:'Anxiety Disorder',   base:9,  f:{bmi:.5, age:.03,smoke:1,act:2,diet:1,alc:2,sl:3.5             }},
  { nm:'Kidney Disease',     base:4,  f:{bmi:1.5,age:.15,smoke:1,act:1,diet:2,bp:3.5,alc:1,fam:'kidney'}},
  { nm:'COPD',               base:3,  f:{bmi:.5, age:.12,smoke:10,act:1,diet:.5,alc:.5,fam:'lung'      }},
  { nm:'Sleep Apnea',        base:5,  f:{bmi:4.5,age:.15,smoke:1.5,act:1.5,diet:1.5,alc:2,sl:3         }},
  { nm:'Fatty Liver',        base:7,  f:{bmi:4,  age:.1, smoke:.5,act:2,diet:3.5,alc:5,fam:'liver'     }},
  { nm:'Metabolic Syndrome', base:6,  f:{bmi:3.5,age:.12,smoke:1.5,act:2.5,diet:3,alc:2,bp:2           }},
  { nm:'Thyroid Disorder',   base:5,  f:{bmi:1,  age:.1, smoke:.5,act:.5,diet:.5,alc:.5,fam:'thyroid'  }},
  { nm:'Arthritis',          base:7,  f:{bmi:2,  age:.25,smoke:1.5,act:-1,diet:1.5,alc:.5,fam:'arthritis'}},
  { nm:'Dementia',           base:3,  f:{bmi:.5, age:.3, smoke:2.5,act:2,diet:1.5,alc:2,sl:2.5,fam:'dementia'}},
  { nm:'Erectile Dysfunction',base:4, f:{bmi:2,  age:.2, smoke:3,act:2,diet:1.5,alc:2,bp:2             }, male:true },
  { nm:'AMD (Vision Loss)',  base:3,  f:{bmi:.5, age:.22,smoke:3,act:.5,diet:1,alc:.5,fam:'eye'        }},
];

const FAM_OPTIONS = ['Heart Disease','Diabetes','Cancer','Hypertension','Stroke','Kidney Disease','Osteoporosis','Depression','Thyroid','Dementia','Liver Disease','Arthritis'];

function calcRisk(cond, inp, selFam) {
  if (cond.female && inp.gender==='Male') return null;
  if (cond.male   && inp.gender==='Female') return null;
  let s = cond.base; const f = cond.f;
  if (f.bmi!=null && inp.bmi)  { const d=inp.bmi-22; s+=d*(f.bmi/10)*(d>0?1.2:.8); }
  if (f.age!=null)              { s+=Math.max(0,inp.age-30)*f.age; }
  if (f.bp!=null  && inp.bp)   { s+=Math.max(0,inp.bp-120)*(f.bp/50); }
  const smI=['Never smoked','Ex-smoker','Light smoker','Heavy smoker'].indexOf(inp.smoke); s+=smI*f.smoke*.8;
  const acI=['Very active','Moderately active','Lightly active','Sedentary'].indexOf(inp.act); if(f.act) s+=acI*(f.act/3);
  const dtI=['Excellent','Good','Average','Poor'].indexOf(inp.diet); if(f.diet) s+=dtI*(f.diet/3);
  const alI=['None','Occasional','Moderate','Heavy daily'].indexOf(inp.alc); if(f.alc) s+=alI*(f.alc/3);
  if (f.sl!=null) { const slI=['Excellent','Good','Poor','Very poor'].indexOf(inp.sleep); s+=slI*(f.sl/3); }
  if (f.fam) { const hit=[...selFam].some(x=>x.toLowerCase().includes(f.fam)||f.fam.includes(x.split(' ')[0].toLowerCase())); if(hit) s*=1.55; }
  return Math.min(95,Math.max(1,Math.round(s)));
}

export default function RiskScanner() {
  const [form, setForm] = useState({ age:'', gender:'Male', bmi:'', bp:'', smoke:'Never smoked', act:'Moderately active', diet:'Good', alc:'None', sleep:'Good' });
  const [selFam, setSelFam] = useState(new Set());
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [engine, setEngine] = useState('');
  const up = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const toggleFam = (f) => setSelFam(prev => { const n=new Set(prev); n.has(f)?n.delete(f):n.add(f); return n; });

  const localResults = (inp) => {
    const res = CONDITIONS.map(c=>({nm:c.nm,score:calcRisk(c,inp,selFam),reasons:[]})).filter(r=>r.score!==null).sort((a,b)=>b.score-a.score);
    const avg = Math.round(res.reduce((s,r)=>s+r.score,0)/res.length);
    const hi  = res.filter(r=>r.score>=70).length;
    const radar = res.slice(0,8).map(r=>({subject:r.nm.split(' ')[0], score:r.score}));
    return { res, avg, hi, radar };
  };

  const run = async () => {
    const age=parseInt(form.age), bmi=parseFloat(form.bmi)||22, bp=parseInt(form.bp)||120;
    if (!age) { alert('Please enter your age'); return; }
    const inp={...form,age,bmi,bp};
    setScanning(true);
    try {
      const smoking = form.smoke === 'Never smoked' ? 'never' : form.smoke === 'Ex-smoker' ? 'former' : 'current';
      const activity = form.act === 'Very active' ? 'high' : form.act === 'Sedentary' ? 'low' : 'moderate';
      const diet = ['Excellent','Good'].includes(form.diet) ? 'good' : form.diet === 'Poor' ? 'poor' : 'average';
      const alcohol = form.alc === 'None' ? 'none' : form.alc === 'Heavy daily' ? 'high' : 'moderate';
      const sleep = form.sleep === 'Excellent' ? 8 : form.sleep === 'Good' ? 7 : form.sleep === 'Poor' ? 5.5 : 4.5;
      const { data } = await axios.post('/api/ai/risk/score', {
        age, gender: form.gender, bmi, systolic_bp: bp, smoking, activity, diet, alcohol, sleep,
        family_history: [...selFam],
      });
      const res = data.conditions.map(item => ({ nm:item.name, score:item.score, reasons:item.reasons }));
      setResults({
        res,
        avg:data.overall_score,
        hi:data.high_risk_count,
        radar:res.slice(0,8).map(item => ({ subject:item.nm.split(' ')[0], score:item.score })),
      });
      setEngine('PYTHON EXPLAINABLE SCREENING');
    } catch {
      setResults(localResults(inp));
      setEngine('LOCAL SCREENING FALLBACK');
      toast('Python screening is offline. Local risk rules were used.');
    } finally {
      setScanning(false);
    }
  };

  const riskColor = (p) => p>=70?'var(--r)':p>=40?'var(--o)':'var(--g)';
  const riskLabel = (p) => p>=70?'HIGH':p>=40?'MODERATE':'LOW';

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Explainable Health Screening</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Health Risk Scanner</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.5rem' }}>Review relative risk indicators across 20 conditions using transparent lifestyle rules, not a medical diagnosis</p>

      <div className="grid-2" style={{ alignItems:'start' }}>
        {/* Inputs */}
        <div className="card">
          <div className="card-h"><h3>🧬 SCAN PARAMETERS</h3></div>
          <div className="card-b">
            <div className="grid-2" style={{ gap:'.55rem' }}>
              <div className="form-group"><label className="form-label">Age *</label><input type="number" className="form-input" placeholder="// years" value={form.age} onChange={up('age')}/></div>
              <div className="form-group"><label className="form-label">Gender</label><select className="form-select" value={form.gender} onChange={up('gender')}><option>Male</option><option>Female</option></select></div>
            </div>
            <div className="grid-2" style={{ gap:'.55rem' }}>
              <div className="form-group"><label className="form-label">BMI</label><input type="number" className="form-input" placeholder="// e.g. 24.5" value={form.bmi} onChange={up('bmi')}/></div>
              <div className="form-group"><label className="form-label">Systolic BP</label><input type="number" className="form-input" placeholder="// mmHg" value={form.bp} onChange={up('bp')}/></div>
            </div>
            {[['Smoking','smoke',['Never smoked','Ex-smoker','Light smoker','Heavy smoker']],['Physical Activity','act',['Very active','Moderately active','Lightly active','Sedentary']],['Diet Quality','diet',['Excellent','Good','Average','Poor']],['Alcohol','alc',['None','Occasional','Moderate','Heavy daily']],['Sleep Quality','sleep',['Excellent','Good','Poor','Very poor']]].map(([l,k,opts])=>(
              <div className="form-group" key={k}>
                <label className="form-label">{l}</label>
                <select className="form-select" value={form[k]} onChange={up(k)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Family History</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.35rem', marginTop:'.35rem' }}>
                {FAM_OPTIONS.map(f=>(
                  <button key={f} onClick={()=>toggleFam(f)} style={{ padding:'.22rem .55rem', borderRadius:20, border:`1px solid ${selFam.has(f)?'var(--p)':'var(--bd)'}`, background:selFam.has(f)?'var(--pd)':'var(--s3)', color:selFam.has(f)?'var(--p)':'var(--t3)', fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'var(--mono)', transition:'all .2s' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ width:'100%' }} onClick={run} disabled={scanning}>
              {scanning ? '🧬 SCANNING RISK FACTORS...' : '🧬 INITIATE SCAN →'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          {!results && !scanning && (
            <div className="card" style={{ padding:'3rem', textAlign:'center' }}>
              <div style={{ fontSize:'3rem', opacity:.2, marginBottom:'.75rem' }}>🧬</div>
              <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// Fill in scan parameters and initiate<br/>// AI will analyze {CONDITIONS.length} disease risk pathways</p>
            </div>
          )}
          {scanning && (
            <div className="card" style={{ padding:'3rem', textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', animation:'liveBlink 0.8s infinite', marginBottom:'.75rem' }}>🧬</div>
              <p style={{ color:'var(--p)', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.06em' }}>SCANNING {CONDITIONS.length} DISEASE PATHWAYS...</p>
            </div>
          )}
          {results && (
            <>
              <div className="card" style={{ marginBottom:'1rem' }}>
                <div className="card-h">
                  <h3>RISK HEATMAP</h3>
                  <span style={{ fontSize:10, fontFamily:'var(--mono)', color:results.avg>50?'var(--r)':results.avg>30?'var(--y)':'var(--g)', fontWeight:700 }}>AVG {results.avg}% · {results.hi} HIGH RISK</span>
                </div>
                <div className="card-b" style={{ padding:'1rem' }}>
                  <div className="mono" style={{ fontSize:9, color:'var(--p)', marginBottom:'.6rem' }}>{engine}</div>
                  <div style={{ marginBottom:'.55rem', padding:'.45rem .7rem', background:'var(--s3)', borderRadius:7, border:'1px solid var(--bd)', display:'flex', gap:'1rem', flexWrap:'wrap', fontSize:10, fontFamily:'var(--mono)', color:'var(--t2)' }}>
                    <span>Age: <strong>{form.age}</strong></span>
                    <span>BMI: <strong>{form.bmi||'—'}</strong></span>
                    <span style={{ color:'var(--r)' }}>High risk: <strong>{results.hi}</strong></span>
                  </div>
                  {results.res.map(r=>{
                    const col=riskColor(r.score);
                    return (
                      <div key={r.nm} style={{ display:'flex', alignItems:'center', gap:'.6rem', padding:'.38rem 0', borderBottom:'1px solid var(--bd)', animation:r.score>=70?'critFlash 1.5s infinite':'none' }}>
                        <div style={{ fontSize:11, fontWeight:600, color:'var(--t2)', width:145, flexShrink:0, fontFamily:'var(--mono)' }}>{r.nm}</div>
                        <div style={{ flex:1, height:7, borderRadius:4, background:'var(--s3)', overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:4, width:`${r.score}%`, background:`linear-gradient(90deg,${col}88,${col})`, transition:'width 1.2s ease' }}/>
                        </div>
                        <div style={{ fontSize:10, fontWeight:800, fontFamily:'var(--mono)', color:col, width:34, textAlign:'right' }}>{r.score}%</div>
                        <span style={{ fontSize:9, fontWeight:800, padding:'.14rem .45rem', borderRadius:20, background:`${col}22`, color:col, border:`1px solid ${col}66`, fontFamily:'var(--mono)', width:60, textAlign:'center' }}>{riskLabel(r.score)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Radar chart */}
              <div className="card">
                <div className="card-h"><h3>📡 RISK RADAR</h3></div>
                <div className="card-b">
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={results.radar}>
                      <PolarGrid stroke="var(--bd)"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fill:'var(--t3)', fontSize:9, fontFamily:'var(--mono)' }}/>
                      <Radar name="Risk %" dataKey="score" stroke="#ff3355" fill="#ff3355" fillOpacity={0.25} strokeWidth={2}/>
                      <Tooltip contentStyle={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8, fontFamily:'var(--mono)', fontSize:11 }} formatter={v=>[`${v}%`,'Risk']}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
