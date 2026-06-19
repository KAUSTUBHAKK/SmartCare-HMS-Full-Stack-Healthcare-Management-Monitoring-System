import React, { useState } from 'react';

const SYMPTOMS = [
  { id:'fever',    ic:'🌡️', label:'Fever / High Temp' },
  { id:'headache', ic:'🤕', label:'Headache' },
  { id:'cough',    ic:'😮‍💨',label:'Cough / Cold' },
  { id:'fatigue',  ic:'😴', label:'Fatigue / Weakness' },
  { id:'chest',    ic:'💔', label:'Chest Pain' },
  { id:'breath',   ic:'😮', label:'Shortness of Breath' },
  { id:'nausea',   ic:'🤢', label:'Nausea / Vomiting' },
  { id:'stomach',  ic:'🫁', label:'Stomach Pain' },
  { id:'throat',   ic:'🗣️', label:'Sore Throat' },
  { id:'rash',     ic:'🔴', label:'Skin Rash' },
  { id:'joints',   ic:'🦴', label:'Joint Pain' },
  { id:'dizzy',    ic:'💫', label:'Dizziness' },
  { id:'back',     ic:'🔙', label:'Back Pain' },
  { id:'urinary',  ic:'💧', label:'Painful Urination' },
  { id:'anxiety',  ic:'😰', label:'Anxiety / Stress' },
  { id:'vision',   ic:'👁️', label:'Vision Problems' },
];

const DIAGNOSES = {
  'chest+breath':   { level:'severe',   title:'⚠ Possible Cardiac/Respiratory Emergency', body:'Chest pain + shortness of breath may indicate a heart attack, pulmonary embolism, or severe asthma. CALL 108 IMMEDIATELY. Do not drive. Chew aspirin 325mg if available and not allergic.' },
  'fever+headache+rash': { level:'severe', title:'⚠ Possible Meningitis', body:'Fever + severe headache + rash can indicate bacterial meningitis — life-threatening. Other signs: stiff neck, light sensitivity. CALL 108 IMMEDIATELY. Needs emergency IV antibiotics within hours.' },
  'chest+dizzy':    { level:'severe',   title:'⚠ Possible Cardiac Emergency', body:'Chest pain + dizziness may indicate a heart attack or dangerous arrhythmia. CALL 108 NOW. Sit or lie down while waiting for help.' },
  'fever+cough+breath': { level:'moderate', title:'⚡ Possible Respiratory Infection', body:'Fever + cough + breathlessness suggests pneumonia, COVID-19, or severe bronchitis. Medical evaluation needed within 24 hours. Check SpO₂ (should be >95%). Seek emergency care if SpO₂ drops below 94%.' },
  'fever+stomach+nausea': { level:'moderate', title:'⚡ Possible GI Infection or Appendicitis', body:'If pain is severe in the right lower abdomen — seek emergency care (possible appendicitis). Otherwise rest, hydrate with ORS, and see a doctor within 24 hours if not improving.' },
  'headache+dizzy+vision': { level:'moderate', title:'⚡ Possible Neurological Issue', body:'Headache + dizziness + vision changes can indicate migraine with aura, hypertension crisis, or stroke. EMERGENCY if: sudden onset worst-ever headache, sudden vision loss, facial/arm/speech change.' },
  'fever+cough+throat': { level:'mild', title:'✓ Likely Viral Upper Respiratory Infection', body:'Pattern strongly suggests cold or flu. Treatment: rest, 3L+ fluids, paracetamol for fever and pain, throat lozenges, steam inhalation. See doctor if not improving in 7 days or breathing difficulty develops.' },
  'fatigue+headache': { level:'mild', title:'✓ Likely Dehydration or Tension', body:'Very commonly caused by dehydration, poor sleep, stress, or skipped meals. Try: 2 large glasses of water, paracetamol, rest, small meal. Get blood tests (CBC, thyroid, B12, iron) if persistent >2 weeks.' },
  'stomach+nausea': { level:'mild', title:'✓ Likely Digestive Issue', body:'Suggests indigestion, mild food poisoning, or gastritis. Try BRAT diet, ORS, avoid dairy and fatty foods. Antacids for acid-related pain. See doctor if blood in stool, severe pain, or symptoms >72 hours.' },
  'back+joints':    { level:'mild', title:'✓ Possible Musculoskeletal Condition', body:'Could be rheumatoid arthritis, osteoarthritis, ankylosing spondylitis, or postural issues. Get blood tests (ESR, CRP, RF, uric acid) and imaging. Physiotherapy is highly effective.' },
};

const SINGLE_MAP = {
  fever:   'Monitor temperature. Paracetamol 15mg/kg (children) or 500-1000mg (adults) every 6 hours. Hydrate well. See doctor if >39.5°C, persists >3 days, or rash/stiff neck develops.',
  headache:'Drink 2 large glasses of water first. Take paracetamol. Rest in dark quiet room. See doctor if severe, sudden, or recurring >twice/week.',
  cough:   'Steam inhalation, honey + warm water, lozenges, stay hydrated. See doctor if lasting >3 weeks, with blood, or with fever — do not ignore a chronic cough (TB risk in India).',
  fatigue: 'Get blood tests: CBC, thyroid (TSH), Vitamin D, B12, iron studies, fasting glucose. Common treatable causes include anaemia, hypothyroidism, and nutritional deficiencies.',
  rash:    'Keep the area clean and moisturised. Avoid scratching. Note if rash is spreading, raised, or accompanied by fever. See a dermatologist — photos help with diagnosis.',
  urinary: 'Likely UTI. Drink 3L water daily, urinate frequently. Requires antibiotic treatment — see a doctor. Emergency if fever + back pain + chills (upper UTI / pyelonephritis).',
  anxiety: 'Try 4-7-8 breathing (inhale 4s, hold 7s, exhale 8s). Limit caffeine. Regular exercise is the most powerful natural anxiolytic. Consider CBT therapy if affecting daily life.',
  joints:  'RICE for acute pain. NSAIDs (ibuprofen with food). Gentle low-impact exercise. Maintain healthy weight. See a rheumatologist if multiple joints affected or >6 weeks.',
};

export default function SymptomChecker() {
  const [selected, setSelected] = useState(new Set());
  const [result, setResult]     = useState(null);

  const toggle = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
    setResult(null);
  };

  const analyze = () => {
    if (selected.size === 0) return;
    const arr = [...selected].sort();
    let res = null;
    for (let i=0;i<arr.length&&!res;i++) for (let j=i+1;j<arr.length&&!res;j++) {
      res = DIAGNOSES[arr[i]+'+'+arr[j]] || DIAGNOSES[arr[j]+'+'+arr[i]] || null;
    }
    if (!res) for (let i=0;i<arr.length&&!res;i++) for (let j=i+1;j<arr.length&&!res;j++) for (let k=j+1;k<arr.length&&!res;k++) {
      res = DIAGNOSES[arr[i]+'+'+arr[j]+'+'+arr[k]] || null;
    }
    if (!res) {
      const body = SINGLE_MAP[arr[0]] || `No specific pattern found for: ${arr.join(', ')}. Please consult a doctor for proper evaluation.`;
      res = { level:'mild', title:'General Assessment', body };
    }
    setResult(res);
  };

  const lvlColors = { severe:'var(--r)', moderate:'var(--y)', mild:'var(--g)' };
  const lvlBgs    = { severe:'rgba(255,51,85,.06)', moderate:'rgba(255,204,0,.05)', mild:'rgba(0,255,136,.04)' };

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// AI Diagnostics</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Symptom Checker</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.5rem' }}>Select your symptoms for an AI-powered preliminary assessment</p>

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div className="card-h"><h3>SELECT SYMPTOMS</h3><span style={{ fontSize:10, color:'var(--p)', fontFamily:'var(--mono)' }}>{selected.size} selected</span></div>
          <div className="card-b">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(135px,1fr))', gap:'.5rem', marginBottom:'1rem' }}>
              {SYMPTOMS.map(s=>{
                const sel = selected.has(s.id);
                return (
                  <button key={s.id} onClick={()=>toggle(s.id)} style={{
                    padding:'.55rem .7rem', borderRadius:8, border:`1.5px solid ${sel?'var(--p)':'var(--bd)'}`,
                    background: sel?'var(--pd)':'var(--s2)', cursor:'pointer', textAlign:'left',
                    color: sel?'var(--p)':'var(--t2)', transition:'all .2s',
                  }}>
                    <div style={{ fontSize:'1.1rem', marginBottom:'.22rem' }}>{s.ic}</div>
                    <div style={{ fontSize:10, fontWeight:600 }}>{s.label}</div>
                  </button>
                );
              })}
            </div>
            <button className="btn btn-primary" style={{ width:'100%' }} onClick={analyze} disabled={selected.size===0}>
              ANALYZE SYMPTOMS →
            </button>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom:'.9rem' }}>
            <div className="card-h"><h3>AI ASSESSMENT</h3></div>
            <div className="card-b">
              {!result && <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// Select symptoms and click Analyze</p>}
              {result && (
                <>
                  <div style={{ borderRadius:11, border:`1.5px solid ${lvlColors[result.level]}`, padding:'1.1rem', background:lvlBgs[result.level], marginBottom:'.75rem' }}>
                    <div style={{ fontSize:'.95rem', fontWeight:800, color:lvlColors[result.level], marginBottom:'.45rem' }}>{result.title}</div>
                    <p style={{ fontSize:12, lineHeight:1.7, fontFamily:'var(--mono)', color:'var(--t2)' }}>{result.body}</p>
                    {result.level==='severe' && (
                      <button className="btn btn-danger" style={{ width:'100%', marginTop:'.75rem' }}>🚨 CALL 108 NOW</button>
                    )}
                  </div>
                  <div style={{ padding:'.6rem .8rem', background:'var(--s3)', borderRadius:7, border:'1px solid var(--bd)', fontSize:10, color:'var(--t3)', fontFamily:'var(--mono)' }}>
                    // Analyzed: {[...selected].join(', ')} · NOT a medical diagnosis · Always consult a qualified doctor
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-h"><h3>⚠ DISCLAIMER</h3></div>
            <div className="card-b" style={{ fontSize:11, color:'var(--t2)', lineHeight:1.65, fontFamily:'var(--mono)' }}>
              // This tool provides general health information only. It is NOT a substitute for professional medical diagnosis or treatment. Always consult a qualified doctor. If symptoms are severe or you are unsure — call 108 immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
