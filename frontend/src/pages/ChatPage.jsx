import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const SESSION_ID = uuidv4();
const QUICK = [
  'I have fever and body pain',
  'What should I do for a deep cut?',
  'How do I know if a bone is broken?',
  'My blood pressure is high',
  'What are heart attack warning signs?',
  'Explain the stroke FAST method',
  'I feel dizzy when I stand up',
  'What should I do for vomiting?',
  'How do I treat loose motions safely?',
  'I have burning while urinating',
  'My eye is red and painful',
  'What should I do for an ankle sprain?',
  'How can I manage a migraine?',
  'What are dengue warning signs?',
  'My oxygen level is below 94',
  'I missed my medicine dose',
  'What are diabetes symptoms?',
  'How can I sleep better?',
  'What causes vitamin D deficiency?',
  'How do I manage anxiety right now?',
  'When should I call an ambulance?',
  'Which doctor should I consult?',
  'How much water should I drink?',
  'What should a home first-aid kit contain?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    // Load chat history from MongoDB
    axios.get(`/api/chat/history/${SESSION_ID}`)
      .then(r => {
        if (r.data.length > 0) setMessages(r.data.map(m => ({ role: m.role, content: m.content })));
        else setMessages([{ role:'assistant', content:"Hello! I'm MediCare AI, your health guidance assistant. Tell me what you are feeling, how long it has been happening, and whether it is getting worse. I can explain common causes, first-aid steps, warning signs, and which doctor to consult." }]);
      })
      .catch(() => setMessages([{ role:'assistant', content:"Hello! I'm MediCare AI. Ask me anything about your health!" }]))
      .finally(() => setHistLoading(false));
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role:'user', content:msg }]);
    setLoading(true);
    try {
      const { data } = await axios.post('/api/chat/message', { message:msg, sessionId:SESSION_ID });
      setMessages(prev => [...prev, { role:'assistant', content:data.reply }]);
    } catch(e) {
      toast.error('AI service error — check if API key is configured');
      setMessages(prev => [...prev, { role:'assistant', content:'Sorry, I could not process that. Please try again.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="eyebrow">// AI Health Guidance</div>
      <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Health AI Chat</h1>
      <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic', marginBottom:'1.25rem' }}>Private health guidance with saved conversation history and emergency-aware answers</p>

      <div className="card" style={{ marginBottom:'1rem', display:'flex', flexDirection:'column', minHeight:'62vh' }}>
        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:'.6rem', background:'var(--s2)' }}>
          {histLoading && <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// Loading chat history from MongoDB...</p>}
          {messages.map((m, i) => (
            <div key={i} style={{
              maxWidth:'80%', padding:'.65rem 1rem', borderRadius:12, fontSize:13, lineHeight:1.55,
              alignSelf: m.role==='user' ? 'flex-end' : 'flex-start',
              background: m.role==='user' ? 'linear-gradient(135deg,var(--p2),var(--p))' : 'var(--s3)',
              color: m.role==='user' ? '#000' : 'var(--t)',
              border: m.role==='assistant' ? '1px solid var(--bd)' : 'none',
              borderRadius: m.role==='user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              fontWeight: m.role==='user' ? 500 : 400,
            }}>
              {m.role==='assistant' && <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'.28rem' }}>// MediCare AI · Health Guidance</div>}
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf:'flex-start', background:'var(--s3)', border:'1px solid var(--bd)', borderRadius:'14px 14px 14px 4px', padding:'.65rem 1rem', fontSize:12 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--p)', marginBottom:'.2rem' }}>// MediCare AI · Thinking...</div>
              <div style={{ display:'flex', gap:4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--p)', animation:`liveBlink 1s ${i*.2}s infinite` }}/>)}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Input */}
        <div style={{ display:'flex', padding:'.65rem', gap:'.5rem', background:'var(--s1)', borderTop:'1px solid var(--bd)' }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
            placeholder="// ask your health question..."
            style={{ flex:1, padding:'.58rem .85rem', border:'1.5px solid var(--bd)', borderRadius:7, outline:'none', color:'var(--t)', background:'var(--s2)', fontSize:12, fontFamily:'var(--mono)' }}
            onFocus={e=>e.target.style.borderColor='var(--p)'} onBlur={e=>e.target.style.borderColor='var(--bd)'}/>
          <button className="btn btn-primary" onClick={()=>send()} disabled={loading} style={{ padding:'.58rem 1.1rem' }}>SEND →</button>
        </div>

        <div className="quick-question-panel">
          <div className="quick-question-title">
            <strong>Common questions</strong>
            <span>Tap one to ask instantly</span>
          </div>
          <div className="quick-question-grid">
          {QUICK.map(q => (
            <button key={q} onClick={()=>send(q)} disabled={loading}>
              {q}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="care-note">
        <div className="comfort-icon">!</div>
        <div><strong>This chat cannot diagnose you.</strong><p>For chest pain, stroke signs, severe breathing difficulty, major bleeding, unconsciousness, or rapidly worsening symptoms, call 108 immediately.</p></div>
      </div>
    </div>
  );
}
