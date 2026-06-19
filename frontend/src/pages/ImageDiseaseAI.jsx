import React, { useMemo, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import axios from 'axios';
import toast from 'react-hot-toast';

const CONDITIONS = [
  {
    id: 'acne',
    name: 'Acne / Pimples',
    icon: '🔴',
    hint: 'red raised spots, oily texture, clustered facial lesions',
    advice: 'Use gentle cleanser, avoid squeezing, non-comedogenic products. See a dermatologist for painful cysts or scarring.',
    weights: { red: 2.1, texture: 1.5, dark: .4, yellow: .2 },
    contexts: ['skin', 'face'],
  },
  {
    id: 'eczema',
    name: 'Eczema / Dermatitis',
    icon: '🟤',
    hint: 'dry red-brown patches, rough texture, irritation',
    advice: 'Moisturize often, avoid triggers/fragrance, and seek care if there is pus, fever, or spreading redness.',
    weights: { red: 1.1, texture: 2.2, dark: .7, yellow: .1 },
    contexts: ['skin'],
  },
  {
    id: 'psoriasis',
    name: 'Psoriasis-like Plaque',
    icon: '⚪',
    hint: 'thick patchy areas with strong texture/scale',
    advice: 'Needs dermatologist confirmation. Avoid harsh scrubbing; document triggers and location.',
    weights: { red: .8, texture: 2.8, bright: .9, dark: .2 },
    contexts: ['skin'],
  },
  {
    id: 'ringworm',
    name: 'Ringworm / Fungal Rash',
    icon: '⭕',
    hint: 'ring-shaped red border, scaly patch, central clearing',
    advice: 'Keep dry, do not share towels, use antifungal treatment after clinician/pharmacist advice.',
    weights: { red: 1.2, texture: 1.1, circular: .9, dark: .1 },
    contexts: ['skin'],
  },
  {
    id: 'nail-fungus',
    name: 'Nail Fungus',
    icon: '🦶',
    hint: 'yellow-white nail discoloration, thick or brittle nail',
    advice: 'Keep nails dry and trimmed. Oral treatment needs medical supervision because liver monitoring may be needed.',
    weights: { yellow: 2.8, bright: .8, texture: 1.2, red: -.3 },
    contexts: ['nail'],
  },
  {
    id: 'conjunctivitis',
    name: 'Conjunctivitis / Red Eye',
    icon: '👁️',
    hint: 'redness around eye, watery/discharge appearance',
    advice: 'Avoid touching eyes, wash hands, do not share towels. Urgent care for pain, vision loss, or contact lens use.',
    weights: { red: 2.6, bright: 1.2, texture: .3, yellow: .4 },
    contexts: ['eye'],
  },
  {
    id: 'jaundice',
    name: 'Jaundice Clue',
    icon: '🟡',
    hint: 'yellowing of eyes or skin',
    advice: 'Possible liver/bile issue. Seek medical evaluation and bilirubin/liver-function tests.',
    weights: { yellow: 3.0, bright: .5, red: -.4, dark: .2 },
    contexts: ['eye', 'skin'],
  },
  {
    id: 'foot-ulcer',
    name: 'Diabetic Foot Ulcer Risk',
    icon: '🩹',
    hint: 'dark wound area, redness around sore, tissue breakdown',
    advice: 'Foot wounds in diabetes can worsen fast. Keep clean/covered and see a doctor urgently.',
    weights: { dark: 2.4, red: 1.2, texture: 1.5, yellow: .6 },
    contexts: ['wound', 'foot'],
  },
  {
    id: 'oral-thrush',
    name: 'Oral Thrush-like Patch',
    icon: '👄',
    hint: 'white/yellow patch in mouth or tongue region',
    advice: 'Needs confirmation. Common after antibiotics, diabetes, or low immunity. Do not scrape aggressively.',
    weights: { bright: 2.1, yellow: 1.4, texture: .9, red: .2 },
    contexts: ['mouth'],
  },
  {
    id: 'minor-burn',
    name: 'Minor Burn / Scald',
    icon: '🔥',
    hint: 'red inflamed region, shiny tissue, possible blister',
    advice: 'Cool under running water 20 minutes. Do not apply oil/butter. Urgent care for large/deep burns or face/hands/genitals.',
    weights: { red: 2.4, bright: 1.1, texture: .7, dark: .4 },
    contexts: ['burn', 'wound', 'skin'],
  },
];

const BODY_CONTEXTS = [
  { id:'auto', label:'Auto detect' },
  { id:'skin', label:'Skin rash/patch' },
  { id:'eye', label:'Eye photo' },
  { id:'nail', label:'Nail photo' },
  { id:'mouth', label:'Mouth/tongue' },
  { id:'wound', label:'Wound/burn' },
  { id:'foot', label:'Foot wound' },
  { id:'face', label:'Face/acne' },
];

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function confidenceColor(v) {
  if (v >= 72) return 'var(--r)';
  if (v >= 52) return 'var(--o)';
  if (v >= 35) return 'var(--y)';
  return 'var(--g)';
}

function normalizeScores(scores) {
  const max = Math.max(...scores.map(s => s.raw), 1);
  return scores
    .map(s => ({ ...s, confidence: Math.round(clamp((s.raw / max) * 82 + 8, 6, 94)) }))
    .sort((a, b) => b.confidence - a.confidence);
}

async function extractTensorFeatures(imageEl) {
  const tensor = tf.tidy(() => {
    return tf.browser.fromPixels(imageEl)
      .resizeBilinear([96, 96])
      .toFloat()
      .div(255);
  });
  const [meanR, meanG, meanB] = Array.from(await tensor.mean([0, 1]).data());
  const gray = tf.tidy(() => tensor.mean(2));
  const texture = (await gray.sub(gray.mean()).abs().mean().data())[0];
  const data = await tensor.data();
  tensor.dispose();
  gray.dispose();

  let redPixels = 0;
  let yellowPixels = 0;
  let darkPixels = 0;
  let brightPixels = 0;
  let edgeLike = 0;

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = (r + g + b) / 3;
    if (r > g * 1.18 && r > b * 1.22 && r > 0.28) redPixels++;
    if (r > 0.45 && g > 0.36 && b < 0.34) yellowPixels++;
    if (lum < 0.22) darkPixels++;
    if (lum > 0.72) brightPixels++;
    if (Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b) > 0.38) edgeLike++;
  }

  const total = data.length / 3;
  return {
    red: redPixels / total,
    yellow: yellowPixels / total,
    dark: darkPixels / total,
    bright: brightPixels / total,
    texture,
    circular: edgeLike / total,
    meanR,
    meanG,
    meanB,
  };
}

function scoreCondition(condition, features) {
  const w = condition.weights;
  const context = features.context || 'auto';
  const contextMatch = context === 'auto' || condition.contexts?.includes(context);
  let gate = contextMatch ? 1.22 : 0.28;

  if (condition.id === 'ringworm') {
    const ringSignal = features.red > 0.055 && features.texture > 0.055 && features.circular > 0.18;
    gate *= ringSignal ? 1.12 : 0.35;
  }
  if (condition.id === 'nail-fungus' && context === 'nail') gate *= 1.9;
  if (condition.id === 'conjunctivitis' && context === 'eye') gate *= 1.9;
  if (condition.id === 'oral-thrush' && context === 'mouth') gate *= 1.9;
  if (condition.id === 'foot-ulcer' && ['foot', 'wound'].includes(context)) gate *= 1.65;
  if (condition.id === 'jaundice' && context === 'eye') gate *= 1.35;
  if (condition.id === 'acne' && context === 'face') gate *= 1.55;

  const raw =
    (features.red * 100 * (w.red || 0)) +
    (features.yellow * 100 * (w.yellow || 0)) +
    (features.dark * 100 * (w.dark || 0)) +
    (features.bright * 100 * (w.bright || 0)) +
    (features.texture * 160 * (w.texture || 0)) +
    (features.circular * 80 * (w.circular || 0)) +
    8;
  return Math.max(1, raw * gate);
}

export default function ImageDiseaseAI() {
  const fileRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [preview, setPreview] = useState('');
  const [mode, setMode] = useState('upload');
  const [cameraOn, setCameraOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [features, setFeatures] = useState(null);
  const [context, setContext] = useState('auto');

  const topResult = results?.[0];
  const featureCards = useMemo(() => {
    if (!features) return [];
    return [
      ['Redness', features.red],
      ['Yellowing', features.yellow],
      ['Dark tissue', features.dark],
      ['Bright patch', features.bright],
      ['Texture', features.texture],
      ['Edge pattern', features.circular],
      ['Context', BODY_CONTEXTS.find(c => c.id === features.context)?.label || 'Auto'],
    ];
  }, [features]);

  const loadFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResults(null);
    setFeatures(null);
    const name = file.name.toLowerCase();
    if (/eye|conjunct|jaundice/.test(name)) setContext('eye');
    else if (/nail|toe|finger/.test(name)) setContext('nail');
    else if (/mouth|tongue|oral/.test(name)) setContext('mouth');
    else if (/burn|wound|cut|ulcer/.test(name)) setContext('wound');
    else if (/foot/.test(name)) setContext('foot');
    else if (/face|acne|pimple/.test(name)) setContext('face');
  };

  const startCamera = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      setStream(media);
      setCameraOn(true);
      setMode('camera');
      if (videoRef.current) videoRef.current.srcObject = media;
    } catch (err) {
      alert('Camera permission was blocked or unavailable.');
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setCameraOn(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL('image/png'));
    setResults(null);
    setFeatures(null);
  };

  const analyze = async () => {
    const img = imgRef.current;
    if (!img || !preview) {
      alert('Upload or capture an image first.');
      return;
    }
    setAnalyzing(true);
    await tf.ready();
    await new Promise(resolve => setTimeout(resolve, 350));
    try {
      const f = { ...(await extractTensorFeatures(img)), context };
      const scored = normalizeScores(CONDITIONS.map(c => ({ ...c, raw: scoreCondition(c, f) })));
      if (scored[0].confidence < 38) {
        scored.unshift({
          id: 'uncertain',
          name: 'Unclear / Needs Better Photo',
          icon: '❔',
          hint: 'image does not strongly match the supported visual patterns',
          advice: 'Try a close, focused, well-lit photo of only the affected area, or consult a doctor for direct examination.',
          confidence: 100 - scored[0].confidence,
        });
      }
      setFeatures(f);
      setResults(scored);
      try {
        await axios.post('/api/scans', {
          topCondition: scored[0].name,
          confidence: scored[0].confidence,
          results: scored.slice(0, 10).map(r => ({ id: r.id, name: r.name, confidence: r.confidence, advice: r.advice })),
          features: f,
          imageMeta: { source: mode },
        });
        toast.success('Image scan saved to patient timeline');
      } catch {
        toast.error('Scan analyzed, but timeline save failed');
      }
    } catch (err) {
      alert('Could not analyze this image. Try a clearer photo.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.35rem' }}>// TensorFlow Image Diagnostics</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Image Disease AI</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.5rem' }}>
        Upload or capture a photo for a TensorFlow.js visual screening across 10 common visible conditions
      </p>

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div className="card-h">
            <h3>IMAGE INPUT</h3>
            <span className="badge badge-cyan">TFJS READY</span>
          </div>
          <div className="card-b">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem', marginBottom:'.8rem' }}>
              <button className={mode === 'upload' ? 'btn btn-primary' : 'btn btn-ghost'} onClick={() => setMode('upload')}>UPLOAD</button>
              <button className={mode === 'camera' ? 'btn btn-primary' : 'btn btn-ghost'} onClick={startCamera}>CAMERA</button>
            </div>

            <div className="form-group">
              <label className="form-label">Photo Type / Body Area</label>
              <select className="form-select" value={context} onChange={e => { setContext(e.target.value); setResults(null); }}>
                {BODY_CONTEXTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            {mode === 'upload' && (
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border:'1.5px dashed var(--bd2)', borderRadius:12, padding:'1.2rem', cursor:'pointer',
                  background:'var(--s2)', textAlign:'center', marginBottom:'.8rem',
                }}
              >
                <div style={{ fontSize:'2.2rem', marginBottom:'.45rem' }}>📷</div>
                <div style={{ fontSize:11, fontWeight:800, color:'var(--t)', letterSpacing:'.04em' }}>DROP OR SELECT PHOTO</div>
                <div style={{ fontSize:10, color:'var(--t3)', fontFamily:'var(--mono)', marginTop:'.22rem' }}>// skin, eye, nail, mouth, wound photos</div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => loadFile(e.target.files?.[0])}/>
              </div>
            )}

            {mode === 'camera' && (
              <div style={{ marginBottom:'.8rem' }}>
                <div style={{ border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden', background:'#000', minHeight:220 }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', display:cameraOn ? 'block' : 'none' }}/>
                  {!cameraOn && <div style={{ padding:'3rem', textAlign:'center', color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// Camera not active</div>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem', marginTop:'.55rem' }}>
                  <button className="btn btn-primary" onClick={capture} disabled={!cameraOn}>CAPTURE</button>
                  <button className="btn btn-ghost" onClick={stopCamera}>STOP</button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display:'none' }}/>

            <div style={{ border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden', background:'var(--s3)', minHeight:260, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {preview ? (
                <img ref={imgRef} src={preview} alt="Selected clinical preview" crossOrigin="anonymous" style={{ maxWidth:'100%', maxHeight:380, objectFit:'contain' }}/>
              ) : (
                <div style={{ textAlign:'center', color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>
                  <div style={{ fontSize:'2rem', opacity:.35, marginBottom:'.4rem' }}>🧠</div>
                  // No image loaded
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ width:'100%', marginTop:'.8rem' }} onClick={analyze} disabled={!preview || analyzing}>
              {analyzing ? 'ANALYZING IMAGE TENSOR...' : 'RUN IMAGE DISEASE AI →'}
            </button>
          </div>
        </div>

        <div>
          {!results && !analyzing && (
            <div className="card" style={{ padding:'3rem', textAlign:'center' }}>
              <div style={{ fontSize:'3rem', opacity:.25, marginBottom:'.75rem' }}>🧬</div>
              <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>
                // Load an image to scan 10 visual disease patterns<br/>// Results are screening signals, not diagnosis
              </p>
            </div>
          )}

          {analyzing && (
            <div className="card" style={{ padding:'3rem', textAlign:'center' }}>
              <div style={{ fontSize:'2.6rem', animation:'liveBlink .75s infinite', marginBottom:'.75rem' }}>🧠</div>
              <p style={{ color:'var(--p)', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.06em' }}>TENSORFLOW.JS PREPROCESSING 96x96 IMAGE...</p>
            </div>
          )}

          {results && (
            <>
              <div className="card" style={{ marginBottom:'1rem' }}>
                <div className="card-h">
                  <h3>TOP VISUAL MATCH</h3>
                  <span className="badge badge-yellow">SCREENING ONLY</span>
                </div>
                <div className="card-b">
                  <div style={{ display:'flex', alignItems:'center', gap:'.85rem', marginBottom:'.9rem' }}>
                    <div style={{ width:58, height:58, borderRadius:14, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', border:'1px solid var(--bd)' }}>{topResult.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'1.15rem', fontWeight:800, color:'var(--t)' }}>{topResult.name}</div>
                      <div style={{ fontSize:10, color:'var(--t3)', fontFamily:'var(--mono)', marginTop:'.18rem' }}>{topResult.hint}</div>
                    </div>
                    <div style={{ fontSize:'2rem', fontWeight:800, fontFamily:'var(--mono)', color:confidenceColor(topResult.confidence) }}>{topResult.confidence}%</div>
                  </div>
                  <p style={{ fontSize:11, color:'var(--t2)', lineHeight:1.65, fontFamily:'var(--mono)', background:'var(--s3)', border:'1px solid var(--bd)', borderRadius:8, padding:'.75rem' }}>
                    {topResult.advice}
                  </p>
                </div>
              </div>

              <div className="card" style={{ marginBottom:'1rem' }}>
                <div className="card-h"><h3>10 CONDITION PROBABILITY MAP</h3></div>
                <div className="card-b">
                  {results.map(r => {
                    const col = confidenceColor(r.confidence);
                    return (
                      <div key={r.id} style={{ display:'flex', alignItems:'center', gap:'.6rem', padding:'.43rem 0', borderBottom:'1px solid var(--bd)' }}>
                        <span style={{ width:22, textAlign:'center' }}>{r.icon}</span>
                        <span style={{ width:150, flexShrink:0, fontSize:11, fontWeight:700, color:'var(--t2)' }}>{r.name}</span>
                        <div style={{ flex:1, height:7, borderRadius:4, background:'var(--s3)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${r.confidence}%`, background:`linear-gradient(90deg,${col}77,${col})`, borderRadius:4, transition:'width 1s ease' }}/>
                        </div>
                        <span style={{ width:38, textAlign:'right', fontSize:10, fontWeight:800, fontFamily:'var(--mono)', color:col }}>{r.confidence}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card">
                <div className="card-h"><h3>IMAGE FEATURE EXTRACTION</h3></div>
                <div className="card-b" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'.55rem' }}>
                  {featureCards.map(([label, value]) => (
                    <div key={label} style={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:9, padding:'.65rem' }}>
                      <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</div>
                      <div style={{ fontSize:'1.35rem', fontWeight:800, color:'var(--p)', fontFamily:'var(--mono)' }}>{typeof value === 'number' ? `${Math.round(value * 100)}%` : value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop:'1rem' }}>
        <div className="card-h"><h3>CLINICAL SAFETY NOTE</h3></div>
        <div className="card-b" style={{ fontSize:11, color:'var(--t2)', lineHeight:1.65, fontFamily:'var(--mono)' }}>
          // This is a final-year-project AI screening demo using TensorFlow.js image tensors and handcrafted scoring. It is not a trained clinical CNN and must not be used as a medical diagnosis. For rapidly spreading infection, severe pain, vision changes, burns, open wounds, fever, or diabetic foot wounds, consult a doctor urgently.
        </div>
      </div>
    </div>
  );
}
