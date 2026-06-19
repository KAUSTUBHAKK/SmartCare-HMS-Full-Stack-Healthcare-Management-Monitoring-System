import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShieldCheck, Eye, FlaskConical, ScanLine, Siren, Database } from 'lucide-react';

const settings = [
  ['shareWithDoctors', Eye, 'Doctor access', 'Allow clinicians to review your shared medical record and signed consultations.'],
  ['shareLabReports', FlaskConical, 'Lab reports', 'Allow clinicians to view uploaded laboratory values and trends.'],
  ['shareImageScans', ScanLine, 'Image scans', 'Allow clinicians to review saved image-analysis records.'],
  ['allowEmergencyAccess', Siren, 'Emergency access', 'Permit clinical access during a documented emergency.'],
  ['researchUse', Database, 'Anonymous research use', 'Allow de-identified records to support future research.'],
];

export default function PrivacyCenter() {
  const [consent, setConsent] = useState(null);
  const [logs, setLogs] = useState([]);

  const load = async () => {
    try {
      const [consentRes, auditRes] = await Promise.all([axios.get('/api/privacy/consent'), axios.get('/api/privacy/audit')]);
      setConsent(consentRes.data);
      setLogs(auditRes.data);
    } catch {
      toast.error('Could not load privacy controls');
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async key => {
    const next = { ...consent, [key]:!consent[key] };
    setConsent(next);
    try {
      const { data } = await axios.put('/api/privacy/consent', { [key]:next[key] });
      setConsent(data);
      const audit = await axios.get('/api/privacy/audit');
      setLogs(audit.data);
      toast.success('Privacy preference updated');
    } catch {
      setConsent(consent);
      toast.error('Could not update preference');
    }
  };

  if (!consent) return <p className="mono text-dim">// Loading privacy controls...</p>;

  return (
    <div>
      <div className="eyebrow">// Patient Data Governance</div>
      <div className="dashboard-heading"><div><h1>Privacy & Access</h1><p>You decide how your medical information is shared, and you can see who accessed it</p></div><span className="badge badge-green"><ShieldCheck size={12}/> PATIENT CONTROLLED</span></div>
      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div className="card-h"><h3>Sharing Preferences</h3></div>
          <div className="card-b">
            {settings.map(([key, Icon, title, text])=>(
              <div className="privacy-setting" key={key}>
                <div className="comfort-icon"><Icon size={17}/></div>
                <div style={{ flex:1 }}><strong>{title}</strong><p>{text}</p></div>
                <button className={`privacy-toggle ${consent[key] ? 'on' : ''}`} aria-label={`Toggle ${title}`} onClick={()=>toggle(key)}><span/></button>
              </div>
            ))}
            <div className="care-note" style={{ marginTop:'.8rem' }}><ShieldCheck size={20}/><div><strong>Immediate effect</strong><p>Turning off doctor access blocks new clinician record requests. Signed records already shared remain part of your medical history.</p></div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3>Record Access History</h3><span className="badge badge-cyan">{logs.length} EVENTS</span></div>
          <div className="card-b">
            {!logs.length && <p className="mono text-dim">// Access activity will appear here</p>}
            {logs.map(log=>(
              <div className="review-row" key={log._id}>
                <div style={{ flex:1 }}><strong>{log.action.replaceAll('_',' ')}</strong><div className="mono text-dim">{log.actorName || 'System'} · {log.actorRole || 'service'} · {new Date(log.createdAt).toLocaleString()}</div></div>
                <span className="badge badge-cyan">{log.resourceType || 'Record'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
