import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const TABS = ['Overview', 'Users', 'Review Queue'];

export default function AdminPanel() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Overview');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name:'', email:'', password:'demo1234', role:'doctor', phone:'', specialization:'' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [overview, userList] = await Promise.all([
        axios.get('/api/admin/overview'),
        axios.get('/api/admin/users'),
      ]);
      setData(overview.data);
      setUsers(userList.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Admin dashboard could not load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return users;
    return users.filter(u => `${u.name} ${u.email} ${u.role} ${u.specialization || ''}`.toLowerCase().includes(q));
  }, [users, query]);

  const markReviewed = async (scanId) => {
    try {
      await axios.patch(`/api/scans/${scanId}/review`, { doctorNote: 'Reviewed by hospital administrator. Clinical follow-up recommended where appropriate.' });
      toast.success('Scan marked as reviewed');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not update scan');
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', newUser);
      toast.success(`${newUser.role} account created`);
      setNewUser({ name:'', email:'', password:'demo1234', role:'doctor', phone:'', specialization:'' });
      setShowCreate(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not create account');
    }
  };

  const toggleUser = async (user) => {
    try {
      await axios.patch(`/api/admin/users/${user._id}/status`, { active:user.active === false });
      toast.success(user.active === false ? 'Account activated' : 'Account deactivated');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not update account');
    }
  };

  if (error) return (
    <div className="card" style={{ padding:'2rem' }}>
      <h2 style={{ color:'var(--r)', marginBottom:'.5rem' }}>Admin Console Unavailable</h2>
      <p className="mono text-muted" style={{ marginBottom:'1rem' }}>{error}</p>
      <button className="btn btn-primary" onClick={load}>Retry</button>
    </div>
  );

  const stats = [
    ['Registered Patients', data?.roleCounts?.patient || 0, 'var(--g)', 'Active patient profiles'],
    ['Clinical Staff', data?.roleCounts?.doctor || 0, 'var(--p)', 'Verified doctor accounts'],
    ['Appointments', data?.appointments || 0, 'var(--y)', `${data?.todayAppointments || 0} upcoming today`],
    ['Review Queue', data?.pendingScans || 0, 'var(--r)', 'AI scans needing attention'],
    ['Clinical Reports', data?.reports || 0, 'var(--o)', 'Stored patient summaries'],
    ['Active Medicines', data?.activeReminders || 0, 'var(--g)', 'Patient reminder plans'],
  ];

  return (
    <div>
      <div className="eyebrow">// Hospital Administration</div>
      <div style={{ display:'flex', justifyContent:'space-between', gap:'1rem', alignItems:'flex-start', flexWrap:'wrap', marginBottom:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'.25rem' }}>Operations Command Center</h1>
          <p style={{ color:'var(--t2)', fontFamily:'Georgia,serif', fontStyle:'italic' }}>People, clinical activity, AI review, and system readiness in one place</p>
        </div>
        <div style={{ display:'flex', gap:'.5rem' }}>
          <span className="live-dot">Systems online</span>
          <button className="btn btn-ghost" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="segmented" style={{ marginBottom:'1rem' }}>
        {TABS.map(item => (
          <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      {loading && <p className="mono text-dim">// Loading hospital operations...</p>}

      {!loading && data && tab === 'Overview' && (
        <>
          <div className="grid-3" style={{ marginBottom:'1rem' }}>
            {stats.map(([label, value, color, sub]) => (
              <div className="metric-card" key={label}>
                <div className="metric-label">{label}</div>
                <div className="metric-value" style={{ color }}>{value}</div>
                <div className="metric-sub">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ alignItems:'start', marginBottom:'1rem' }}>
            <div className="card">
              <div className="card-h"><h3>7-Day Appointment Intake</h3><span className="badge badge-cyan">LIVE DATA</span></div>
              <div className="card-b">
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={data.dailyActivity}>
                    <defs>
                      <linearGradient id="adminActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--p)" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="var(--p)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--bd)" strokeDasharray="3 3"/>
                    <XAxis dataKey="_id" tick={{ fill:'var(--t3)', fontSize:9 }} axisLine={false}/>
                    <YAxis tick={{ fill:'var(--t3)', fontSize:9 }} axisLine={false}/>
                    <Tooltip contentStyle={{ background:'var(--s1)', border:'1px solid var(--bd)', borderRadius:8 }}/>
                    <Area type="monotone" dataKey="count" stroke="var(--p)" fill="url(#adminActivity)" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h3>System Readiness</h3></div>
              <div className="card-b" style={{ display:'grid', gap:'.6rem' }}>
                {data.systemChecks.map(check => {
                  const color = check.tone === 'green' ? 'var(--g)' : 'var(--y)';
                  return (
                    <div key={check.name} className="status-row">
                      <span className="status-dot" style={{ background:color, boxShadow:`0 0 10px ${color}` }}/>
                      <div style={{ flex:1 }}>
                        <strong>{check.name}</strong>
                        <div className="mono text-dim" style={{ fontSize:9 }}>{check.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ alignItems:'start' }}>
            <div className="card">
              <div className="card-h"><h3>Recent Appointments</h3><Link to="/my-appointments" className="text-cyan mono" style={{ fontSize:9 }}>OPEN LEDGER</Link></div>
              <div className="card-b data-list">
                {data.recentAppointments.map(a => (
                  <div className="data-row" key={a._id}>
                    <div>
                      <strong>{a.patientName}</strong>
                      <div className="mono text-dim">{a.specialist} · {a.problem}</div>
                    </div>
                    <span className={`badge ${a.status === 'Completed' ? 'badge-green' : a.status === 'Cancelled' ? 'badge-red' : 'badge-yellow'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Administrative Shortcuts</h3></div>
              <div className="card-b admin-actions">
                <button onClick={() => setTab('Users')}>Manage user directory <span>→</span></button>
                <button onClick={() => setTab('Review Queue')}>Review AI scan queue <span>→</span></button>
                <Link to="/my-appointments">Inspect appointment records <span>→</span></Link>
                <Link to="/doctor-report">Open report generator <span>→</span></Link>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && tab === 'Users' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', marginBottom:'.75rem', flexWrap:'wrap' }}>
            <input className="compact-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email, role..."/>
            <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>{showCreate ? 'Close form' : 'Create account'}</button>
          </div>

          {showCreate && (
            <form className="card admin-create-form" onSubmit={createUser}>
              <div className="card-h"><h3>Create Hospital Account</h3><span className="badge badge-yellow">TEMP PASSWORD</span></div>
              <div className="card-b">
                <input required value={newUser.name} onChange={e => setNewUser(v => ({...v,name:e.target.value}))} placeholder="Full name"/>
                <input required type="email" value={newUser.email} onChange={e => setNewUser(v => ({...v,email:e.target.value}))} placeholder="Email address"/>
                <input required value={newUser.password} onChange={e => setNewUser(v => ({...v,password:e.target.value}))} placeholder="Temporary password"/>
                <select value={newUser.role} onChange={e => setNewUser(v => ({...v,role:e.target.value}))}>
                  <option value="doctor">Doctor</option><option value="patient">Patient</option><option value="admin">Administrator</option>
                </select>
                <input value={newUser.phone} onChange={e => setNewUser(v => ({...v,phone:e.target.value}))} placeholder="Phone"/>
                <input value={newUser.specialization} onChange={e => setNewUser(v => ({...v,specialization:e.target.value}))} placeholder="Specialization (doctor)"/>
                <button className="btn btn-primary" type="submit">Create secure account</button>
              </div>
            </form>
          )}

          <div className="card">
            <div className="card-h"><h3>User Directory</h3><span className="badge badge-cyan">{filteredUsers.length} ACCOUNTS</span></div>
            <div className="card-b admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Person</th><th>Role</th><th>Contact</th><th>Profile</th><th>Status</th></tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong><div>{u.email}</div></td>
                      <td><span className="badge badge-cyan">{u.role}</span></td>
                      <td>{u.phone || 'Not provided'}</td>
                      <td>{u.specialization || `${u.age || '-'} yrs · ${u.gender || 'Not set'}`}</td>
                      <td><button className={`account-toggle ${u.active === false ? 'inactive' : 'active'}`} onClick={() => toggleUser(u)}>{u.active === false ? 'Activate' : 'Deactivate'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && data && tab === 'Review Queue' && (
        <div className="card">
          <div className="card-h"><h3>AI Image Scan Review</h3><span className="badge badge-yellow">{data.pendingScans} PENDING</span></div>
          <div className="card-b data-list">
            {data.recentScans.map(scan => (
              <div className="review-row" key={scan._id}>
                <div>
                  <strong>{scan.patientName || scan.userId?.name || 'Patient'}</strong>
                  <div className="mono text-dim">{scan.topCondition} · {scan.confidence}% confidence · {scan.status}</div>
                </div>
                {scan.status === 'Needs Review'
                  ? <button className="btn btn-primary" onClick={() => markReviewed(scan._id)}>Mark reviewed</button>
                  : <span className="badge badge-green">Reviewed</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
