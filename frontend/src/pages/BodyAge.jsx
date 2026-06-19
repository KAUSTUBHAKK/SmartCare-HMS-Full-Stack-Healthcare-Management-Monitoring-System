import React, { useState } from 'react';

const ORGANS = [
  { ic:'❤️', nm:'Heart',      f:{hr:.3,bp:.35,bmi:.2,ex:.4,smoke:.5,stress:.25,alcohol:.2} },
  { ic:'🫁', nm:'Lungs',      f:{smoke:1.2,ex:-.3,bmi:.15,stress:.1,diet:.1} },
  { ic:'🧠', nm:'Brain',      f:{sleep:.6,stress:.5,diet:.2,ex:-.35,alcohol:.35,smoke:.2} },
  { ic:'🫘', nm:'Kidneys',    f:{bp:.4,bmi:.25,diet:.3,alcohol:.25,stress:.15} },
  { ic:'🩸', nm:'Liver',      f:{alcohol:.9,diet:.45,bmi:.35,smoke:.2,ex:-.2} },
  { ic:'🦴', nm:'Bones',      f:{diet:.3,ex:-.4,bmi:-.1,smoke:.25,sleep:.2} },
  { ic:'💪', nm:'Muscles',    f:{ex:-.65,bmi:.2,diet:.25,sleep:.2,stress:.15} },
  { ic:'🛡️', nm:'Immune',    f:{sleep:.5,stress:.45,diet:.35,ex:-.3,smoke:.3,alcohol:.2} },
  { ic:'🔬', nm:'Metabolism', f:{bmi:.55,diet:.4,ex:-.4,sleep:.3,stress:.2,alcohol:.15} },
];

function calcOrganAge(organ, inp) {
  const { f } = organ;
  let delta = 0;
  if(f.hr&&inp.hr){ const hd=Math.abs(inp.hr-65)/10; delta+=hd*f.hr*2; }
  if(f.bp&&inp.bp){ delta+=Math.max(0,inp.bp-115)/10*f.bp*2; }
  if(f.bmi!=null&&inp.bmi){ const bd=inp.bmi-22; delta+=bd*f.bmi*(bd>0?1.2:.7); }
  const exIdx=['Daily (6-7 days)','Regular (4-5 days)','Moderate (2-3 days)','Rarely (1 day)','Never'].indexOf(inp.ex);
  if(f.ex!=null) delta+=exIdx*f.ex*(-1.4);
  const slIdx=['Excellent (7-9 hrs, restful)','Good (6-7 hrs)','Poor (under 6 hrs)','Very poor (insomnia)'].indexOf(inp.sleep);
  if(f.sleep!=null) delta+=slIdx*f.sleep*1.6;
  const stIdx=['Low (calm, managed)','Moderate (occasional)','High (frequent stress)','Chronic (overwhelming)'].indexOf(inp.stress);
  if(f.stress!=null) delta+=stIdx*f.stress*1.8;
  const dtIdx=['Excellent (whole foods)','Good (mostly healthy)','Average (mixed)','Poor (processed heavy)'].indexOf(inp.diet);
  if(f.diet!=null) delta+=dtIdx*f.diet*1.3;
  const smIdx=['Never','Ex-smoker (>5 yrs)','Ex-smoker (<5 yrs)','Current smoker'].indexOf(inp.smoke);
  if(f.smoke!=null) delta+=smIdx*f.smoke*2.5;
  const alIdx=['None','Occasional','Moderate','Heavy daily'].indexOf(inp.alcohol);
  if(f.alcohol!=null) delta+=alIdx*f.alcohol*1.7;
  if(inp.glucose>0){ delta+=Math.max(0,inp.glucose-95)/10*1.5; }
  return Math.max(15,Math.min(inp.age+25, Math.round(inp.age+delta)));
}

const PLANS = [
  { k:'smoke',   check:inp=>inp.smoke==='Current smoker',   ic:'🚭', t:'Quit Smoking Now',         p:'pc', b:'Smoking is the #1 accelerator of biological aging, adding 7-12 years. It damages every organ simultaneously. NRT + varenicline + counselling achieves 35-40% quit rates.', impact:'↓ 5-8 YEARS potential' },
  { k:'bp',      check:inp=>inp.bp>140,                     ic:'💊', t:'Control Blood Pressure',   p:'pc', b:'Elevated BP damages heart, kidneys, brain, and eyes silently. Target <130/80 mmHg. Low-sodium diet, exercise, and antihypertensives are highly effective.', impact:'↓ 3-5 YEARS potential' },
  { k:'glucose', check:inp=>inp.glucose>125,                ic:'🩸', t:'Blood Sugar Control',      p:'pc', b:'Elevated fasting glucose accelerates aging in every organ. Low-GI diet, 150 min/week exercise, and metformin if prescribed can reverse pre-diabetes entirely.', impact:'↓ 4-6 YEARS potential' },
  { k:'ex',      check:inp=>['Rarely (1 day)','Never'].includes(inp.ex), ic:'🏃', t:'Daily Exercise Protocol', p:'ph', b:'Physical inactivity is the fastest route to accelerated aging. Even 30 min brisk walking 5 days/week reduces biological age by 3-5 years. Combine cardio with 2x/week strength training.', impact:'↓ 3-5 YEARS potential' },
  { k:'sleep',   check:inp=>['Poor (under 6 hrs)','Very poor (insomnia)'].includes(inp.sleep), ic:'😴', t:'Optimize Sleep',  p:'ph', b:'Poor sleep accelerates brain aging, immune decline, and metabolic dysfunction. Target 7-9 hours. CBT-I therapy is more effective than sleeping pills long-term.', impact:'↓ 2-4 YEARS potential' },
  { k:'stress',  check:inp=>['High (frequent stress)','Chronic (overwhelming)'].includes(inp.stress), ic:'🧘', t:'Stress Management', p:'pm', b:'Chronic stress floods your body with cortisol, shrinking the hippocampus and inflaming blood vessels. Daily 10-min meditation shows measurable brain changes in 8 weeks.', impact:'↓ 2-3 YEARS potential' },
  { k:'alcohol', check:inp=>inp.alcohol==='Heavy daily',    ic:'🍷', t:'Reduce Alcohol',            p:'pm', b:'Heavy alcohol accelerates liver aging dramatically and increases cancer risk for 7 types. Reducing to under 7 drinks/week can reverse early liver aging within months.', impact:'↓ 2-4 YEARS potential' },
  { k:'bmi',     check:inp=>inp.bmi>27,                     ic:'⚖️', t:'Weight Optimisation',      p:'pm', b:'Each BMI unit above 22 adds approximately 0.5-1 year of biological age. 10% weight loss dramatically improves all biomarkers. Aim for 0.5-1 kg/week loss.', impact:'↓ 2-4 YEARS potential' },
];

const planColors = { pc:'var(--r)', ph:'var(--o)', pm:'var(--p)', pl:'var(--g)' };

export default function BodyAge() {
  const [form, setForm] = useState({ age:'',gender:'Male',hr:'',bp:'',bmi:'',glucose:'',ex:'Regular (4-5 days)',sleep:'Good (6-7 hrs)',stress:'Moderate (occasional)',diet:'Good (mostly healthy)',smoke:'Never',alcohol:'None' });
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const up = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const calculate = () => {
    const age=parseInt(form.age), bmi=parseFloat(form.bmi)||22, bp=parseInt(form.bp)||120, hr=parseInt(form.hr)||70, glucose=parseInt(form.glucose)||90;
    if(!age||age<10||age>110){ alert('Please enter a valid age'); return; }
    const inp = { age, bmi, bp, hr, glucose, gender:form.gender, ex:form.ex, sleep:form.sleep, stress:form.stress, diet:form.diet, smoke:form.smoke, alcohol:form.alcohol };
    setScanning(true);
    setTimeout(()=>{
      const organAges = ORGANS.map(o=>({...o, bioAge:calcOrganAge(o,inp)}));
      const avg = Math.round(organAges.reduce((s,o)=>s+o.bioAge,0)/organAges.length);
      const delta = avg - age;
      const col = delta>8?'var(--r)':delta>3?'var(--o)':delta>0?'var(--y)':delta>-5?'var(--g)':'var(--p)';
      const verdict = delta>10?'Your body is aging significantly faster than your years. Immediate lifestyle intervention needed.':delta>5?'Your biological age is meaningfully ahead. Targeted improvements can help significantly.':delta>2?'Slightly accelerated aging. Minor optimisations will make a big difference.':delta>-2?'You\'re aging at a normal pace. Maintain these habits.':delta>-6?'Great news! Your body is younger than your age. Keep it up!':'Excellent! Significantly younger biological age. You\'re an aging role model!';
      const activePlans = PLANS.filter(p=>p.check(inp));
      if(activePlans.length<2) activePlans.push({ ic:'🥗', t:'Nutrition Optimisation', p:'pl', b:'Fine-tune with Mediterranean principles: 10+ fruit/veg portions weekly, omega-3 fish twice weekly, olive oil as primary fat, minimise ultra-processed foods and red meat.', impact:'↓ 1-2 YEARS potential' });
      setResult({ avg, delta, col, verdict, organs:organAges, plans:activePlans.slice(0,6), inp });
      setScanning(false);
    }, 1800);
  };

  const circ = 2*Math.PI*70;

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Biological Age Analysis</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Body Age Calculator</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.5rem' }}>Your chronological age tells little — biological age reveals everything. AI calculates organ-level aging.</p>

      <div className="grid-2" style={{ alignItems:'start', marginBottom:'1.1rem' }}>
        {/* Form */}
        <div className="card">
          <div className="card-h"><h3>📋 YOUR BIOMARKERS</h3></div>
          <div className="card-b">
            <div className="grid-2" style={{ gap:'.55rem' }}>
              <div className="form-group"><label className="form-label">Age *</label><input type="number" className="form-input" placeholder="// years" value={form.age} onChange={up('age')}/></div>
              <div className="form-group"><label className="form-label">Gender</label><select className="form-select" value={form.gender} onChange={up('gender')}><option>Male</option><option>Female</option></select></div>
            </div>
            <div className="grid-2" style={{ gap:'.55rem' }}>
              <div className="form-group"><label className="form-label">Resting HR (bpm)</label><input type="number" className="form-input" placeholder="// e.g. 68" value={form.hr} onChange={up('hr')}/></div>
              <div className="form-group"><label className="form-label">Systolic BP (mmHg)</label><input type="number" className="form-input" placeholder="// e.g. 120" value={form.bp} onChange={up('bp')}/></div>
            </div>
            <div className="grid-2" style={{ gap:'.55rem' }}>
              <div className="form-group"><label className="form-label">BMI</label><input type="number" className="form-input" placeholder="// e.g. 23.5" step="0.1" value={form.bmi} onChange={up('bmi')}/></div>
              <div className="form-group"><label className="form-label">Fasting Glucose (mg/dL)</label><input type="number" className="form-input" placeholder="// e.g. 95" value={form.glucose} onChange={up('glucose')}/></div>
            </div>
            {[['Exercise Frequency','ex',['Daily (6-7 days)','Regular (4-5 days)','Moderate (2-3 days)','Rarely (1 day)','Never']],['Sleep Quality','sleep',['Excellent (7-9 hrs, restful)','Good (6-7 hrs)','Poor (under 6 hrs)','Very poor (insomnia)']],['Stress Level','stress',['Low (calm, managed)','Moderate (occasional)','High (frequent stress)','Chronic (overwhelming)']],['Diet Quality','diet',['Excellent (whole foods)','Good (mostly healthy)','Average (mixed)','Poor (processed heavy)']],['Smoking','smoke',['Never','Ex-smoker (>5 yrs)','Ex-smoker (<5 yrs)','Current smoker']],['Alcohol','alcohol',['None','Occasional','Moderate','Heavy daily']]].map(([l,k,opts])=>(
              <div className="form-group" key={k}>
                <label className="form-label">{l}</label>
                <select className="form-select" value={form[k]} onChange={up(k)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
              </div>
            ))}
            <button className="btn btn-primary" style={{ width:'100%' }} onClick={calculate} disabled={scanning}>
              {scanning ? '🧬 ANALYZING BIOMARKERS...' : '⚡ CALCULATE BIOLOGICAL AGE →'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          {!result && !scanning && (
            <div className="card" style={{ padding:'3rem', textAlign:'center' }}>
              <div style={{ fontSize:'3rem', opacity:.2, marginBottom:'.75rem' }}>🧬</div>
              <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// Fill in biomarkers and calculate</p>
            </div>
          )}
          {scanning && (
            <div className="card" style={{ padding:'3rem', textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', animation:'liveBlink 1s infinite', marginBottom:'.75rem' }}>🧬</div>
              <p style={{ color:'var(--p)', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.06em' }}>ANALYZING BIOMARKERS...</p>
            </div>
          )}
          {result && (
            <>
              <div className="card" style={{ marginBottom:'1rem' }}>
                <div className="card-h"><h3>🧬 BIOLOGICAL AGE RESULT</h3></div>
                <div className="card-b">
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'1rem' }}>
                    <div style={{ position:'relative', width:160, height:160, marginBottom:'.75rem' }}>
                      <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform:'rotate(-90deg)' }}>
                        <circle fill="none" stroke="var(--bd)" strokeWidth="9" cx="80" cy="80" r="70"/>
                        <circle fill="none" stroke={result.col} strokeWidth="9" strokeLinecap="round" cx="80" cy="80" r="70"
                          strokeDasharray={circ} strokeDashoffset={circ*(1-Math.min(1,result.avg/100))} style={{ transition:'stroke-dashoffset 2s ease' }}/>
                      </svg>
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ fontSize:'2.8rem', fontWeight:800, fontFamily:'var(--mono)', color:result.col, lineHeight:1 }}>{result.avg}</div>
                        <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--t3)', fontFamily:'var(--mono)' }}>Bio Age</div>
                        <div style={{ fontSize:'1rem', fontWeight:800, fontFamily:'var(--mono)', color:result.col, marginTop:'.1rem' }}>{result.delta>0?'+':''}{result.delta} yrs</div>
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--mono)' }}>Chronological: <strong style={{ color:'var(--t)' }}>{result.inp.age}</strong> · Biological: <strong style={{ color:result.col }}>{result.avg}</strong></div>
                    <div style={{ marginTop:'.75rem', padding:'.5rem .85rem', borderRadius:7, background:'var(--s3)', border:'1px solid var(--bd)', fontSize:11, fontFamily:'var(--mono)', color:'var(--t2)', textAlign:'center' }}>{result.verdict}</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-h"><h3>🫀 ORGAN BIOLOGICAL AGE</h3></div>
                <div className="card-b">
                  {result.organs.map(o=>{
                    const d=o.bioAge-result.inp.age;
                    const oc=d>7?'var(--r)':d>3?'var(--o)':d>0?'var(--y)':d>-4?'var(--g)':'var(--p)';
                    const pctW=Math.min(100,Math.max(5,(o.bioAge/Math.max(result.inp.age,o.bioAge))*100));
                    return (
                      <div key={o.nm} style={{ display:'flex', alignItems:'center', gap:'.6rem', padding:'.4rem 0', borderBottom:'1px solid var(--bd)' }}>
                        <span style={{ fontSize:'1.2rem', width:24, textAlign:'center', flexShrink:0 }}>{o.ic}</span>
                        <span style={{ fontSize:11, fontWeight:600, color:'var(--t2)', width:80, flexShrink:0, fontFamily:'var(--mono)' }}>{o.nm}</span>
                        <span style={{ fontSize:'1.05rem', fontWeight:800, fontFamily:'var(--mono)', color:oc, width:36, flexShrink:0 }}>{o.bioAge}</span>
                        <div style={{ flex:1, height:5, borderRadius:3, background:'var(--s3)', overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:3, width:`${pctW}%`, background:`linear-gradient(90deg,${oc}66,${oc})`, transition:'width 1.3s ease' }}/>
                        </div>
                        <span style={{ fontSize:10, fontWeight:800, fontFamily:'var(--mono)', color:oc, width:36, textAlign:'right' }}>{d>0?'+':''}{d}y</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reversal Plan */}
      {result && (
        <div className="card">
          <div className="card-h">
            <h3>🎯 PERSONALISED AGE REVERSAL PLAN</h3>
            <span style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--g)' }}>// {result.plans.length} interventions identified</span>
          </div>
          <div className="card-b" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'.75rem' }}>
            {result.plans.map((p,i)=>(
              <div key={i} style={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:10, padding:'.85rem', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2.5, background:`linear-gradient(90deg,${planColors[p.p]}88,${planColors[p.p]})` }}/>
                <div style={{ fontSize:'1.35rem', marginBottom:'.32rem' }}>{p.ic}</div>
                <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.04em', color:'var(--t)', marginBottom:'.22rem' }}>{p.t}</div>
                <div style={{ fontSize:10.5, color:'var(--t2)', lineHeight:1.55, fontFamily:'var(--mono)' }}>{p.b}</div>
                <div style={{ fontSize:10, fontWeight:700, marginTop:'.38rem', fontFamily:'var(--mono)', color:planColors[p.p] }}>{p.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
