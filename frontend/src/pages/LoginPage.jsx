import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LanguageSwitcher } from '../context/LanguageContext';

export default function LoginPage() {
  const [mode, setMode]       = useState('login');
  const [role, setRole]       = useState('patient');
  const [form, setForm]       = useState({ name:'', email:'', password:'', age:'', gender:'Male', phone:'', specialization:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { login, register }   = useAuth();
  const navigate              = useNavigate();
  const up = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const fillDemo = (type) => {
    setMode('login');
    setForm(f => ({ ...f,
      email: type === 'doctor' ? 'doctor@demo.com' : type === 'admin' ? 'admin@demo.com' : 'patient@demo.com',
      password: 'demo1234'
    }));
    setRole(type);
    setError('');
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const loggedIn = await login(form.email, form.password);
        toast.success('Welcome to MediCare AI!');
        navigate(loggedIn.role === 'admin' ? '/admin' : '/dashboard');
        return;
      } else {
        if (!form.name) { setError('Name is required'); setLoading(false); return; }
        await register({ ...form, role });
      }
      toast.success('Welcome to MediCare AI!');
      navigate('/dashboard');
    } catch(err) {
      const msg = err.message || 'Something went wrong';
      setError(msg);
      toast.error(msg.split('\n')[0], { duration: 5001 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0099bb 100%)', padding:'1rem' }}>
      <div className="bg-grid"/>
      <LanguageSwitcher variant="login" />
      <div style={{ width:480, maxWidth:'100%', position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'.5rem',
            background:'rgba(0,212,255,.12)', border:'1px solid rgba(0,212,255,.3)',
            borderRadius:20, padding:'.3rem .9rem', fontSize:10, fontWeight:700,
            color:'#00d4ff', letterSpacing:'.08em', textTransform:'uppercase',
            fontFamily:'var(--mono)', marginBottom:'1rem' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#00d4ff',
              animation:'liveBlink 1s infinite', display:'inline-block' }}/>
            MediCare AI · Full Stack
          </div>
          <div style={{ fontSize:'2.8rem', fontWeight:800, lineHeight:1, marginBottom:'.4rem',
            background:'linear-gradient(135deg,#f0f6ff 0%,#00d4ff 55%,#00ff88 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Next-Gen<br/>Healthcare
          </div>
          <div style={{ fontFamily:'Georgia,serif', fontStyle:'italic', color:'rgba(255,255,255,.45)', fontSize:'.88rem' }}>
            Node.js · Express · MongoDB Atlas · React · Socket.IO
          </div>
        </div>

        {/* Quick Demo Buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.65rem', marginBottom:'1.1rem' }}>
          <button onClick={() => fillDemo('patient')} style={{
            padding:'.75rem', borderRadius:10,
            border:'1.5px solid rgba(0,255,136,.3)', background:'rgba(0,255,136,.08)',
            color:'rgba(0,255,136,.9)', cursor:'pointer', fontWeight:700, fontSize:12,
            textAlign:'left', transition:'all .2s'
          }}>
            <div style={{ fontSize:'1.4rem', marginBottom:'.25rem' }}>👤</div>
            <div>Patient Demo</div>
            <div style={{ fontSize:10, opacity:.6, fontFamily:'var(--mono)', marginTop:'.15rem' }}>patient@demo.com</div>
          </button>
          <button onClick={() => fillDemo('doctor')} style={{
            padding:'.75rem', borderRadius:10,
            border:'1.5px solid rgba(0,212,255,.3)', background:'rgba(0,212,255,.08)',
            color:'rgba(0,212,255,.9)', cursor:'pointer', fontWeight:700, fontSize:12,
            textAlign:'left', transition:'all .2s'
          }}>
            <div style={{ fontSize:'1.4rem', marginBottom:'.25rem' }}>👨‍⚕️</div>
            <div>Doctor Demo</div>
            <div style={{ fontSize:10, opacity:.6, fontFamily:'var(--mono)', marginTop:'.15rem' }}>doctor@demo.com</div>
          </button>
          <button onClick={() => fillDemo('admin')} style={{
            padding:'.75rem', borderRadius:10,
            border:'1.5px solid rgba(255,204,0,.35)', background:'rgba(255,204,0,.08)',
            color:'rgba(255,220,80,.95)', cursor:'pointer', fontWeight:700, fontSize:12,
            textAlign:'left', transition:'all .2s'
          }}>
            <div style={{ fontSize:'1.4rem', marginBottom:'.25rem' }}>⚙️</div>
            <div>Admin Demo</div>
            <div style={{ fontSize:10, opacity:.65, fontFamily:'var(--mono)', marginTop:'.15rem' }}>admin@demo.com</div>
          </button>
        </div>

        {/* Mode Toggle */}
        <div style={{ display:'flex', gap:'.4rem', marginBottom:'1rem' }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex:1, padding:'.55rem', borderRadius:8,
              border:`1.5px solid ${mode===m ? '#00d4ff' : 'rgba(255,255,255,.15)'}`,
              background: mode===m ? 'rgba(0,212,255,.12)' : 'rgba(255,255,255,.05)',
              color: mode===m ? '#00d4ff' : 'rgba(255,255,255,.5)',
              fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase',
              letterSpacing:'.05em', transition:'all .2s'
            }}>{m === 'login' ? '🔑 Sign In' : '✏️ Register'}</button>
          ))}
        </div>

        {/* Public registration is patient-only; staff accounts are provisioned by admins. */}
        {mode === 'register' && (
          <div style={{ padding:'.7rem .85rem', borderRadius:9, border:'1px solid rgba(0,255,136,.3)', background:'rgba(0,255,136,.07)', color:'rgba(220,255,240,.85)', fontSize:11, marginBottom:'.9rem', lineHeight:1.5 }}>
            Patient registration · Doctor and administrator accounts are created securely by hospital administration.
          </div>
        )}

        {/* Error box */}
        {error && (
          <div style={{ background:'rgba(255,51,85,.12)', border:'1px solid rgba(255,51,85,.4)',
            borderRadius:9, padding:'.75rem 1rem', marginBottom:'.85rem',
            fontSize:12, color:'#ff8899', fontFamily:'var(--mono)', lineHeight:1.6,
            whiteSpace:'pre-wrap' }}>
            ❌ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
          {mode === 'register' && (
            <input className="form-input" placeholder="Full Name *" value={form.name} onChange={up('name')} required
              style={{ background:'rgba(255,255,255,.07)', borderColor:'rgba(255,255,255,.15)', color:'#fff' }}/>
          )}
          <input className="form-input" type="email" placeholder="Email address *" value={form.email} onChange={up('email')} required
            style={{ background:'rgba(255,255,255,.07)', borderColor:'rgba(255,255,255,.15)', color:'#fff' }}/>
          <input className="form-input" type="password" placeholder="Password *" value={form.password} onChange={up('password')} required
            style={{ background:'rgba(255,255,255,.07)', borderColor:'rgba(255,255,255,.15)', color:'#fff' }}/>
          {mode === 'register' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.55rem' }}>
                <input className="form-input" type="number" placeholder="Age" value={form.age} onChange={up('age')}
                  style={{ background:'rgba(255,255,255,.07)', borderColor:'rgba(255,255,255,.15)', color:'#fff' }}/>
                <input className="form-input" placeholder="Phone" value={form.phone} onChange={up('phone')}
                  style={{ background:'rgba(255,255,255,.07)', borderColor:'rgba(255,255,255,.15)', color:'#fff' }}/>
              </div>
              {role === 'doctor' && (
                <input className="form-input" placeholder="Specialization (e.g. Cardiologist)" value={form.specialization} onChange={up('specialization')}
                  style={{ background:'rgba(255,255,255,.07)', borderColor:'rgba(255,255,255,.15)', color:'#fff' }}/>
              )}
            </>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ padding:'.85rem', fontSize:13, marginTop:'.2rem', opacity: loading ? .7 : 1 }}>
            {loading ? '⏳ Please wait...' : mode === 'login' ? 'SIGN IN →' : 'CREATE ACCOUNT →'}
          </button>
        </form>

        {/* Demo credentials box */}
        <div style={{ marginTop:'.9rem', background:'rgba(0,0,0,.3)', border:'1px solid rgba(255,255,255,.1)',
          borderRadius:10, padding:'.85rem 1rem', fontFamily:'var(--mono)', fontSize:11 }}>
          <div style={{ color:'rgba(255,255,255,.5)', marginBottom:'.4rem', fontWeight:700 }}>
            // DEMO CREDENTIALS (after running: node seed.js)
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.4rem' }}>
            <div style={{ color:'rgba(0,255,136,.7)' }}>
              👤 patient@demo.com<br/>
              <span style={{ color:'rgba(255,255,255,.3)' }}>password: demo1234</span>
            </div>
            <div style={{ color:'rgba(0,212,255,.7)' }}>
              👨‍⚕️ doctor@demo.com<br/>
              <span style={{ color:'rgba(255,255,255,.3)' }}>password: demo1234</span>
            </div>
            <div style={{ color:'rgba(255,204,0,.75)', gridColumn:'1 / -1' }}>
              ⚙ admin@demo.com<br/>
              <span style={{ color:'rgba(255,255,255,.3)' }}>password: demo1234</span>
            </div>
          </div>
          <div style={{ color:'rgba(255,255,255,.25)', fontSize:10, marginTop:'.5rem', lineHeight:1.6 }}>
            Or just click a demo button above to auto-fill credentials, then Sign In.
          </div>
        </div>

      </div>
    </div>
  );
}
