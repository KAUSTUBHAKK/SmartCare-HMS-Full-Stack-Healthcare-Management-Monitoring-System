import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LanguageSwitcher } from '../context/LanguageContext';

const patientNav = [
  { path:'/dashboard',    icon:'⬡', label:'Dashboard' },
  { path:'/chat',         icon:'◈', label:'AI Health Chat' },
  { path:'/appointments', icon:'⊕', label:'Book Appointment' },
  { path:'/my-appointments', icon:'≡', label:'My Records' },
  { path:'/health-records', icon:'▧', label:'Health Records' },
  { path:'/symptoms',     icon:'◉', label:'Symptom Checker' },
  { path:'/image-disease', icon:'▣', label:'Image Disease AI' },
  { path:'/medicine-ocr', icon:'▥', label:'Medicine OCR' },
  { path:'/doctor-report', icon:'▤', label:'AI Report PDF' },
  { path:'/timeline', icon:'⟲', label:'Medical Timeline' },
  { path:'/reminders',    icon:'⊡', label:'Med Reminders' },
  { path:'/body-age',     icon:'⏳', label:'Body Age AI' },
  { path:'/bmi',          icon:'◎', label:'BMI Calculator' },
  { path:'/privacy',      icon:'◫', label:'Privacy & Access' },
];

const doctorNav = [
  { path:'/dashboard',    icon:'⬡', label:'Command Center' },
  { path:'/icu-monitor',  icon:'⬤', label:'ICU Live Monitor', badge:'LIVE' },
  { path:'/war-room',     icon:'🏥', label:'War Room', badge:'LIVE' },
  { path:'/epidemic-radar',icon:'🗺', label:'Epidemic Radar', badge:'LIVE' },
  { path:'/appointments', icon:'⊕', label:'Appointments' },
  { path:'/consultation-desk', icon:'✚', label:'Consultation Desk' },
  { path:'/my-appointments', icon:'≡', label:'All Records' },
  { path:'/health-records', icon:'▧', label:'Patient Records' },
  { path:'/chat',         icon:'◈', label:'AI Assistant' },
  { path:'/image-disease', icon:'▣', label:'Image Disease AI' },
  { path:'/doctor-report', icon:'▤', label:'AI Report PDF' },
  { path:'/timeline', icon:'⟲', label:'Patient Timeline' },
  { path:'/risk-scanner', icon:'🧬', label:'Risk Scanner' },
];

const adminNav = [
  { path:'/admin', icon:'⚙', label:'Admin Command' },
  { path:'/dashboard', icon:'⬡', label:'Operations Dashboard' },
  { path:'/my-appointments', icon:'≡', label:'Appointment Ledger' },
  { path:'/image-disease', icon:'▣', label:'Scan Review' },
  { path:'/doctor-report', icon:'▤', label:'Reports Vault' },
  { path:'/timeline', icon:'⟲', label:'Patient Timelines' },
  { path:'/chat', icon:'◈', label:'AI Assistant' },
];

export default function Layout({ children }) {
  const { user, logout, isDoctor, isAdmin } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('mc_theme') || 'dark');
  const [collapsed, setCollapsed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const nav = isAdmin ? adminNav : isDoctor ? doctorNav : patientNav;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const capture = event => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', capture);
    return () => window.removeEventListener('beforeinstallprompt', capture);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mc_theme', next);
    setTheme(next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', position:'relative' }}>
      <div className="bg-grid" />

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 220, flexShrink: 0,
        background:'var(--nav)', backdropFilter:'blur(20px)',
        borderRight:'1px solid var(--bd)', display:'flex', flexDirection:'column',
        position:'sticky', top:0, height:'100vh', zIndex:100, transition:'width .25s'
      }}>
        {/* Logo */}
        <div style={{ padding:'1rem .85rem', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', gap:'.55rem' }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,var(--p2),var(--p))',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>🏥</div>
          {!collapsed && <span style={{ fontWeight:800, fontSize:'.88rem', color:'var(--p)', letterSpacing:'.05em' }}>MEDICARE<span style={{ color:'var(--g)' }}>AI</span></span>}
          <button onClick={() => setCollapsed(c=>!c)} style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--t3)', cursor:'pointer', fontSize:14 }}>{collapsed ? '→' : '←'}</button>
        </div>

        {/* User chip */}
        {!collapsed && (
          <div style={{ padding:'.75rem .85rem', borderBottom:'1px solid var(--bd)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--p)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#000', flexShrink:0 }}>
                {user?.name?.substring(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--t)' }}>{user?.name}</div>
                <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--mono)' }}>{user?.role?.toUpperCase()}{user?.specialization ? ` · ${user.specialization}` : ''}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex:1, padding:'.5rem .4rem', overflowY:'auto', display:'flex', flexDirection:'column', gap:'.1rem' }}>
          {nav.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display:'flex', alignItems:'center', gap:'.6rem',
                padding: collapsed ? '.55rem .65rem' : '.5rem .65rem',
                borderRadius:8, textDecoration:'none', transition:'all .18s',
                background: active ? 'var(--pd)' : 'transparent',
                border:`1px solid ${active ? 'rgba(0,212,255,.2)' : 'transparent'}`,
                color: active ? 'var(--p)' : 'var(--t3)',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}>
                <span style={{ fontSize:14, flexShrink:0 }}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span style={{ fontSize:11, fontWeight:600, flex:1 }}>{item.label}</span>
                    {item.badge && <span style={{ fontSize:8, fontWeight:800, color:'var(--g)', background:'var(--gd)', border:'1px solid var(--g)', borderRadius:10, padding:'.1rem .35rem', fontFamily:'var(--mono)' }}>{item.badge}</span>}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding:'.5rem .4rem', borderTop:'1px solid var(--bd)', display:'flex', gap:'.35rem', flexDirection: collapsed ? 'column' : 'row' }}>
          {installPrompt && <button onClick={installApp} title="Install Medicare.AI" style={{ flex:1, padding:'.4rem', borderRadius:7, border:'1px solid var(--g)', background:'var(--gd)', color:'var(--g)', cursor:'pointer', fontSize:10, fontWeight:700 }}>INSTALL</button>}
          <button onClick={toggleTheme} style={{ flex:1, padding:'.4rem', borderRadius:7, border:'1px solid var(--bd)', background:'none', color:'var(--t2)', cursor:'pointer', fontSize:13 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {!collapsed && <button onClick={handleLogout} style={{ flex:1, padding:'.4rem .6rem', borderRadius:7, border:'1px solid var(--bd)', background:'none', color:'var(--t3)', cursor:'pointer', fontSize:10, fontWeight:700, fontFamily:'var(--mono)' }}>EXIT</button>}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
        {/* Emergency bar */}
        <div style={{ background:'var(--r)', padding:'.45rem 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(0,0,0,.08) 10px,rgba(0,0,0,.08) 20px)' }} />
          <span style={{ color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', fontFamily:'var(--mono)', position:'relative' }}>
            ⚡ EMERGENCY SERVICES ACTIVE
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:'.55rem', position:'relative' }}>
            <LanguageSwitcher variant="bar" />
            <button style={{ padding:'.28rem .85rem', background:'#fff', color:'var(--r)', border:'none', borderRadius:5, fontWeight:800, fontSize:10, cursor:'pointer', position:'relative' }}
              onClick={() => toast('📞 Call 108 for Ambulance | 112 for All Emergencies', { duration:5001, style:{ background:'#ff3355', color:'#fff', fontWeight:700 } })}>
              🚨 CALL 108
            </button>
          </div>
        </div>

        <div style={{ flex:1, padding:'1.5rem', maxWidth:1380, margin:'0 auto', width:'100%' }} className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
