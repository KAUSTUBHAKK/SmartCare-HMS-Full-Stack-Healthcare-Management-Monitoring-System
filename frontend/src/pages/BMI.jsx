import React, { useState } from 'react';

export default function BMI() {
  const [form, setForm] = useState({ height:'', weight:'', age:'', gender:'Male' });
  const [result, setResult] = useState(null);
  const up = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const calc = () => {
    const h = parseFloat(form.height), w = parseFloat(form.weight), a = parseInt(form.age);
    if (!h||!w||!a) return;
    const bmi = w/((h/100)**2), br = Math.round(bmi*10)/10;
    let cat,col,pct,adv;
    if(bmi<18.5){cat='UNDERWEIGHT';col='#3b82f6';pct=Math.max(3,(bmi/18.5)*22);adv='Increase caloric intake with nutrient-dense whole foods. Consult a nutritionist for a personalised weight-gain plan focusing on lean protein, healthy fats, and complex carbohydrates.';}
    else if(bmi<25){cat='NORMAL ✓';col='#00ff88';pct=22+((bmi-18.5)/6.4)*28;adv='Excellent! You are in the healthy weight range. Maintain this with a balanced diet, 150+ min of exercise per week, adequate sleep, and stress management.';}
    else if(bmi<30){cat='OVERWEIGHT';col='#ffcc00';pct=50+((bmi-25)/5)*20;adv='Consider increasing physical activity to 150-300 min/week and moderately reducing caloric intake. Aim for 0.5-1 kg/week loss with sustainable lifestyle changes.';}
    else{cat='OBESE';col='#ff3355';pct=Math.min(96,70+((bmi-30)/10)*26);adv='Consult a healthcare professional for a comprehensive weight management plan including dietary assessment, exercise prescription, and possible medical intervention.';}
    setResult({ bmi:br, cat, col, pct, adv, h, w, a, ideal:[Math.round(18.5*(h/100)**2), Math.round(24.9*(h/100)**2)] });
  };

  const table = [
    ['Underweight','< 18.5','Low','#3b82f6'],
    ['Normal weight','18.5–24.9','Healthy ✓','#00ff88'],
    ['Overweight','25–29.9','Moderate','#ffcc00'],
    ['Obese Class I','30–34.9','High','#ff7700'],
    ['Obese Class II+','≥ 35','Very High','#ff3355'],
  ];

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// Health Metrics</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>BMI Calculator</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.5rem' }}>Calculate your Body Mass Index and get personalised health guidance</p>

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div className="card-h"><h3>ENTER METRICS</h3></div>
          <div className="card-b">
            {[['height','number','Height (cm)','// e.g. 170'],['weight','number','Weight (kg)','// e.g. 65'],['age','number','Age','// e.g. 25']].map(([k,t,l,ph])=>(
              <div className="form-group" key={k}>
                <label className="form-label">{l}</label>
                <input type={t} className="form-input" placeholder={ph} value={form[k]} onChange={up(k)}/>
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={up('gender')}>
                <option>Male</option><option>Female</option>
              </select>
            </div>
            <button className="btn btn-primary" style={{ width:'100%' }} onClick={calc}>CALCULATE BMI →</button>

            {result && (
              <div style={{ marginTop:'1.1rem', padding:'1.25rem', borderRadius:11, border:`1.5px solid ${result.col}`, background:`${result.col}08`, textAlign:'center' }}>
                <div style={{ fontSize:'3.2rem', fontWeight:800, fontFamily:'var(--mono)', color:result.col, lineHeight:1 }}>{result.bmi}</div>
                <div style={{ fontSize:'.9rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:result.col, marginTop:'.2rem' }}>{result.cat}</div>
                <div style={{ height:9, borderRadius:5, background:'linear-gradient(to right,#3b82f6 0%,#00ff88 30%,#00ff88 55%,#ffcc00 72%,#ff7700 85%,#ff3355 100%)', margin:'1rem 0', position:'relative' }}>
                  <div style={{ position:'absolute', top:-6, left:`${result.pct}%`, width:21, height:21, borderRadius:'50%', background:'var(--t)', border:'3px solid var(--bg)', transform:'translateX(-50%)', boxShadow:`0 0 8px ${result.col}`, transition:'left .6s' }}/>
                </div>
                <p style={{ fontSize:11, color:'var(--t2)', lineHeight:1.65, fontFamily:'var(--mono)', marginBottom:'.75rem' }}>{result.adv}</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem', fontSize:12 }}>
                  {[['Height',`${result.h} cm`],['Weight',`${result.w} kg`],[`Ideal Range`,`${result.ideal[0]}–${result.ideal[1]} kg`],['Age',`${result.a} years`]].map(([l,v])=>(
                    <div key={l} style={{ background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:7, padding:'.5rem .65rem', textAlign:'left' }}>
                      <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--t3)', fontFamily:'var(--mono)' }}>{l}</div>
                      <div style={{ fontWeight:700, fontFamily:'var(--mono)', marginTop:'.12rem' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>REFERENCE TABLE</h3></div>
          <div className="card-b">
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>{['Category','BMI Range','Risk'].map(h=><th key={h} style={{ padding:'.6rem .9rem', textAlign:'left', background:'var(--s3)', fontWeight:700, fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--t3)', borderBottom:'1px solid var(--bd)', fontFamily:'var(--mono)' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {table.map(([cat,range,risk,col])=>(
                  <tr key={cat} onMouseOver={e=>e.currentTarget.style.background='var(--s2)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'.7rem .9rem', borderBottom:'1px solid var(--bd)' }}>{cat}</td>
                    <td style={{ padding:'.7rem .9rem', borderBottom:'1px solid var(--bd)', fontFamily:'var(--mono)' }}>{range}</td>
                    <td style={{ padding:'.7rem .9rem', borderBottom:'1px solid var(--bd)' }}>
                      <span style={{ padding:'.16rem .55rem', borderRadius:20, fontSize:9, fontWeight:700, background:`${col}22`, color:col, border:`1px solid ${col}66`, fontFamily:'var(--mono)' }}>{risk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop:'.9rem', padding:'.8rem', background:'var(--s2)', borderRadius:8, borderLeft:'3px solid var(--p)', fontSize:11, color:'var(--t2)', lineHeight:1.7, fontFamily:'var(--mono)' }}>
              // BMI is a screening tool, not diagnostic. Muscle mass, bone density, and body fat distribution are not captured. Always consult a doctor for a comprehensive assessment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
