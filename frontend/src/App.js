import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import LoginPage    from './pages/LoginPage';
import Dashboard    from './pages/Dashboard';
import ICUMonitor   from './pages/ICUMonitor';
import WarRoom      from './pages/WarRoom';
import EpidemicRadar from './pages/EpidemicRadar';
import Appointments from './pages/Appointments';
import MyAppointments from './pages/MyAppointments';
import ChatPage     from './pages/ChatPage';
import Reminders    from './pages/Reminders';
import SymptomChecker from './pages/SymptomChecker';
import ImageDiseaseAI from './pages/ImageDiseaseAI';
import MedicineOCR from './pages/MedicineOCR';
import PatientTimeline from './pages/PatientTimeline';
import DoctorReport from './pages/DoctorReport';
import AdminPanel from './pages/AdminPanel';
import BodyAge      from './pages/BodyAge';
import RiskScanner  from './pages/RiskScanner';
import BMI          from './pages/BMI';
import HealthRecords from './pages/HealthRecords';
import ConsultationDesk from './pages/ConsultationDesk';
import PrivacyCenter from './pages/PrivacyCenter';
import './index.css';

function PrivateRoute({ children, doctorOnly = false, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'2rem', animation:'liveBlink 1s infinite', marginBottom:'.75rem' }}>🏥</div>
        <p style={{ color:'var(--t3)', fontFamily:'var(--mono)', fontSize:11 }}>// Loading MediCare AI...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace/>;
  if (doctorOnly && user.role !== 'doctor') return <Navigate to="/dashboard" replace/>;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace/>;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();
  const home = user?.role === 'admin' ? '/admin' : '/dashboard';
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={home} replace/> : <LoginPage/>}/>
      <Route path="/" element={<Navigate to={home} replace/>}/>

      <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
      <Route path="/chat" element={<PrivateRoute><ChatPage/></PrivateRoute>}/>
      <Route path="/appointments" element={<PrivateRoute><Appointments/></PrivateRoute>}/>
      <Route path="/my-appointments" element={<PrivateRoute><MyAppointments/></PrivateRoute>}/>
      <Route path="/symptoms" element={<PrivateRoute><SymptomChecker/></PrivateRoute>}/>
      <Route path="/image-disease" element={<PrivateRoute><ImageDiseaseAI/></PrivateRoute>}/>
      <Route path="/medicine-ocr" element={<PrivateRoute><MedicineOCR/></PrivateRoute>}/>
      <Route path="/timeline" element={<PrivateRoute><PatientTimeline/></PrivateRoute>}/>
      <Route path="/doctor-report" element={<PrivateRoute><DoctorReport/></PrivateRoute>}/>
      <Route path="/reminders" element={<PrivateRoute><Reminders/></PrivateRoute>}/>
      <Route path="/body-age" element={<PrivateRoute><BodyAge/></PrivateRoute>}/>
      <Route path="/risk-scanner" element={<PrivateRoute><RiskScanner/></PrivateRoute>}/>
      <Route path="/bmi" element={<PrivateRoute><BMI/></PrivateRoute>}/>
      <Route path="/health-records" element={<PrivateRoute><HealthRecords/></PrivateRoute>}/>
      <Route path="/privacy" element={<PrivateRoute><PrivacyCenter/></PrivateRoute>}/>

      {/* Doctor-only routes */}
      <Route path="/icu-monitor"   element={<PrivateRoute doctorOnly><ICUMonitor/></PrivateRoute>}/>
      <Route path="/war-room"      element={<PrivateRoute doctorOnly><WarRoom/></PrivateRoute>}/>
      <Route path="/epidemic-radar" element={<PrivateRoute doctorOnly><EpidemicRadar/></PrivateRoute>}/>
      <Route path="/consultation-desk" element={<PrivateRoute doctorOnly><ConsultationDesk/></PrivateRoute>}/>
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminPanel/></PrivateRoute>}/>

      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background:'var(--s2)', color:'var(--t)', border:'1px solid var(--bd)', fontFamily:'var(--mono)', fontSize:12 },
          success: { iconTheme: { primary:'#00ff88', secondary:'#000' } },
          error:   { iconTheme: { primary:'#ff3355', secondary:'#fff' } },
        }}/>
          <AppRoutes/>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
