import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#00d4ff','#00ff88','#ff7700','#ff3355'];

function WellnessRing({ value, color, label, detail }) {
  return (
    <div className="wellness-item">
      <div className="wellness-ring" style={{ '--ring-value':`${value * 3.6}deg`, '--ring-color':color }}>
        <div><strong>{value}%</strong></div>
      </div>
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isDoctor, isAdmin } = useAuth();
  const { on, joinDoctors } = useSocket();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [aptData, setAptData] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [livePatients, setLivePatients] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    axios.get('/api/appointments/stats').then(r => setStats(r.data)).catch(() => {});
    axios.get('/api/appointments').then(r => {
      const list = Array.isArray(r.data) ? r.data : [];
      setAppointments(list);
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const counts = Array(7).fill(0);
      list.forEach(a => {
        const d = new Date(a.date);
        if (!Number.isNaN(d.getTime())) counts[d.getDay()]++;
      });
      setAptData(days.map((day, i) => ({ day, count:counts[i] })));
    }).catch(() => {});
    if (!isDoctor && !isAdmin) axios.get('/api/reminders').then(r => setReminders(r.data || [])).catch(() => {});

    if (isDoctor) {
      joinDoctors();
      const unsub = on('vitals:update', patients => setLivePatients(patients));
      const unsubAlert = on('war:alert', alert => setRecentAlerts(prev => [alert, ...prev].slice(0,8)));
      return () => { unsub(); unsubAlert(); };
    }
  }, [isDoctor, isAdmin, joinDoctors, on]);

  if (isAdmin) return <Navigate to="/admin" replace/>;

  const criticalCount = livePatients.filter(p => {
    const v = p.vitals;
    return v && (v.hr > 130 || v.hr < 50 || v.bp_s > 185 || v.spo2 < 88 || parseFloat(v.temp) > 39.5);
  }).length;

  const futureAppointments = appointments
    .filter(a => new Date(a.date) >= new Date() && !['Cancelled','Completed'].includes(a.status))
    .sort((a,b) => new Date(a.date) - new Date(b.date));
  const nextAppointment = futureAppointments[0];
  const takenMeds = reminders.filter(r => r.takenToday).length;
  const medAdherence = reminders.length ? Math.round((takenMeds / reminders.length) * 100) : 0;

  return (
    <div>
      <div className="eyebrow">// {isDoctor ? 'Hospital Command Center' : 'Your Health Home'}</div>
      <div className="dashboard-heading">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p>{isDoctor ? 'Clinical operations, patient load, and live alerts' : 'Here is a calm, clear view of your health today.'}</p>
        </div>
        {!isDoctor && <Link to="/appointments" className="btn btn-primary">Book appointment</Link>}
      </div>

      <div className="dashboard-kpis">
        {[
          { label:isDoctor ? 'Total Appointments' : 'My Appointments', value:stats?.total ?? '-', color:'var(--p)', sub:isDoctor ? 'hospital records' : 'all-time records' },
          { label:'Today', value:stats?.todayCount ?? '-', color:'var(--g)', sub:'scheduled visits' },
          { label:'Upcoming', value:stats?.upcoming ?? '-', color:'var(--y)', sub:'confirmed or scheduled' },
          ...(isDoctor ? [
            { label:'ICU Patients', value:livePatients.length || 12, color:'var(--o)', sub:'currently monitored' },
            { label:'Critical', value:criticalCount, color:'var(--r)', sub:'needs attention', flash:criticalCount > 0 },
          ] : [
            { label:'Medicines Today', value:reminders.length ? `${takenMeds}/${reminders.length}` : '0', color:'var(--o)', sub:'marked as taken' },
          ]),
        ].map(k => (
          <div key={k.label} className={`metric-card${k.flash ? ' critical-flash' : ''}`}>
            <div className="metric-label">{k.label}</div>
            <div className="metric-value" style={{ color:k.color }}>{k.value}</div>
            <div className="metric-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {!isDoctor && (
        <>
          <div className="grid-2 patient-home-grid" style={{ marginBottom:'1rem' }}>
            <div className="card">
              <div className="card-h"><h3>Today’s Wellness</h3><span className="badge badge-green">PERSONAL</span></div>
              <div className="card-b wellness-grid">
                <WellnessRing value={78} color="var(--p)" label="Daily activity" detail="6,240 of 8,000 steps"/>
                <WellnessRing value={75} color="var(--g)" label="Hydration" detail="6 of 8 glasses"/>
                <WellnessRing value={90} color="var(--y)" label="Sleep" detail="7.2 hours last night"/>
                <WellnessRing value={medAdherence} color="var(--o)" label="Medication" detail={`${takenMeds} of ${reminders.length} completed`}/>
              </div>
            </div>

            <div className="card care-card">
              <div className="card-h"><h3>Next Care Step</h3></div>
              <div className="card-b">
                {nextAppointment ? (
                  <>
                    <div className="next-care-date">
                      <strong>{new Date(nextAppointment.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</strong>
                      <span>{nextAppointment.slot}</span>
                    </div>
                    <h3 style={{ marginBottom:'.25rem' }}>{nextAppointment.specialist}</h3>
                    <p className="text-muted" style={{ lineHeight:1.5, marginBottom:'1rem' }}>{nextAppointment.problem}</p>
                    <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                      <Link to="/my-appointments" className="btn btn-primary">View details</Link>
                      <Link to="/chat" className="btn btn-ghost">Ask health AI</Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="comfort-icon">+</div>
                    <h3 style={{ marginBottom:'.35rem' }}>No upcoming visit</h3>
                    <p className="text-muted" style={{ lineHeight:1.55, marginBottom:'1rem' }}>You have no appointment waiting. Book a consultation whenever something feels unusual or you need follow-up care.</p>
                    <Link to="/appointments" className="btn btn-primary">Find a doctor</Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid-2 patient-home-grid" style={{ marginBottom:'1rem' }}>
            <div className="card">
              <div className="card-h"><h3>Today’s Medicines</h3><Link to="/reminders" className="text-cyan mono" style={{ fontSize:9 }}>MANAGE</Link></div>
              <div className="card-b data-list">
                {reminders.length === 0 && <p className="text-muted">No active medicine reminders. Add medicines from your prescription so nothing is missed.</p>}
                {reminders.slice(0,4).map(r => (
                  <div className="medicine-row" key={r._id}>
                    <div className={`medicine-check ${r.takenToday ? 'done' : ''}`}>{r.takenToday ? '✓' : ''}</div>
                    <div style={{ flex:1 }}>
                      <strong>{r.name} <span className="text-muted">{r.dosage}</span></strong>
                      <div className="mono text-dim">{r.time} · {r.frequency}</div>
                    </div>
                    <span className={`badge ${r.takenToday ? 'badge-green' : 'badge-yellow'}`}>{r.takenToday ? 'Taken' : 'Due'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h3>Quick Care</h3></div>
              <div className="card-b quick-care-grid">
                {[
                  ['Book a doctor','Choose specialty and time','/appointments','var(--p)'],
                  ['Ask Health AI','Get first-step guidance','/chat','var(--g)'],
                  ['Check symptoms','Understand warning signs','/symptoms','var(--y)'],
                  ['Medical timeline','See your complete history','/timeline','var(--o)'],
                ].map(([title, sub, path, color]) => (
                  <Link key={title} to={path} style={{ '--action-color':color }}>
                    <strong>{title}</strong>
                    <span>{sub}</span>
                    <b>→</b>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="care-note">
            <div className="comfort-icon">i</div>
            <div>
              <strong>You know your body best.</strong>
              <p>If symptoms feel severe, unusual, or rapidly worsening, do not wait for an AI answer. Call 108 or visit the nearest emergency department.</p>
            </div>
          </div>
        </>
      )}

      {isDoctor && (
        <>
          <div className="grid-2" style={{ marginBottom:'1rem' }}>
            <div className="card">
              <div className="card-h"><h3>Appointments This Week</h3></div>
              <div className="card-b">
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={aptData}>
                    <defs><linearGradient id="aptGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/><stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="day" tick={{ fill:'var(--t3)', fontSize:10 }} axisLine={false}/>
                    <YAxis tick={{ fill:'var(--t3)', fontSize:10 }} axisLine={false}/>
                    <Tooltip contentStyle={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8 }}/>
                    <Area type="monotone" dataKey="count" stroke="#00d4ff" fill="url(#aptGrad)" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Live Clinical Alerts</h3><span className="live-dot">Monitoring</span></div>
              <div className="card-b data-list">
                {recentAlerts.length === 0 && <p className="mono text-dim">// Waiting for clinical alerts...</p>}
                {recentAlerts.map((a,i) => <div className="data-row" key={i}><span>{a.msg}</span><small>{a.time}</small></div>)}
              </div>
            </div>
          </div>
          {stats?.byStatus?.length > 0 && (
            <div className="card">
              <div className="card-h"><h3>Appointment Status Breakdown</h3></div>
              <div className="card-b" style={{ display:'flex', alignItems:'center', gap:'2rem', flexWrap:'wrap' }}>
                <PieChart width={160} height={160}>
                  <Pie data={stats.byStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                    {stats.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:8 }}/>
                </PieChart>
                <div className="data-list" style={{ flex:1 }}>
                  {stats.byStatus.map((s,i) => <div className="data-row" key={s._id}><span><i className="status-dot" style={{ background:COLORS[i%COLORS.length] }}/> {s._id}</span><strong>{s.count}</strong></div>)}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
