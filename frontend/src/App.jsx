import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';

// Operator Pages
import { OperatorDashboard } from './pages/operator/OperatorDashboard';
import { OperatorScreening } from './pages/operator/OperatorScreening';
import { OperatorQueue } from './pages/operator/OperatorQueue';
import { OperatorPatients } from './pages/operator/OperatorPatients';

// Doctor Pages
import { Dashboard as DoctorDashboard } from './pages/Dashboard';
import { ScreeningResult as DoctorScreeningResult } from './pages/ScreeningResult';
import { Screenings as DoctorScreenings } from './pages/Screenings';
import { DoctorPendingReviews } from './pages/doctor/DoctorPendingReviews';
import { Patients as DoctorPatients } from './pages/Patients';
import { PatientDetails as DoctorPatientDetails } from './pages/PatientDetails';
import { AssistantPage as DoctorAssistantPage } from './pages/AssistantPage';

import { api } from './services/api';

export function AppContent() {
  const { role } = useAuth();
  const [currentTab, setCurrentTab] = useState(role === 'operator' ? 'operator-dashboard' : 'doctor-dashboard');
  const [screenings, setScreenings] = useState([]);
  const [activeResult, setActiveResult] = useState(null);
  const [activePatient, setActivePatient] = useState(null);
  const [dbConnected, setDbConnected] = useState(true);

  // Load screenings from backend using active role credentials
  const loadScreenings = async () => {
    try {
      const data = await api.getScreenings(role);
      if (data.screenings) {
        setScreenings(data.screenings);
        setDbConnected(true);
      }
    } catch (err) {
      console.warn('Backend / MongoDB status:', err.message);
      setDbConnected(false);
    }
  };

  useEffect(() => {
    loadScreenings();
  }, [role]);

  // Enforce role-protected routes & redirects!
  useEffect(() => {
    if (role === 'operator' && !currentTab.startsWith('operator-')) {
      setCurrentTab('operator-dashboard');
    } else if (role === 'doctor' && !currentTab.startsWith('doctor-')) {
      setCurrentTab('doctor-dashboard');
    }
  }, [role]);

  const handleViewScreening = (screeningRecord) => {
    if (role === 'doctor') {
      setActiveResult(screeningRecord);
      setCurrentTab('doctor-screening-result');
    }
  };

  const handleSelectPatient = (patientRecord) => {
    if (role === 'doctor') {
      setActivePatient(patientRecord);
      setCurrentTab('doctor-patient-details');
    }
  };

  const getHeaderInfo = () => {
    if (role === 'operator') {
      switch (currentTab) {
        case 'operator-dashboard':
          return { title: 'Screening Center', subtitle: 'Operator Workflow & Operational Queue' };
        case 'operator-screening':
          return { title: 'New Patient Screening', subtitle: 'Upload fundus image & perform operational IQA' };
        case 'operator-queue':
          return { title: 'Screening Center Queue', subtitle: 'Track submitted screenings (No diagnostic data)' };
        case 'operator-patients':
          return { title: 'Patient Lookup', subtitle: 'Screening center patient registry' };
        default:
          return { title: 'Screening Center', subtitle: 'Operator Specialist' };
      }
    } else {
      switch (currentTab) {
        case 'doctor-dashboard':
          return { title: 'Clinical Overview', subtitle: 'Diabetic Retinopathy screening metrics & statistics' };
        case 'doctor-screenings':
          return { title: 'Screenings Database', subtitle: 'Searchable clinical screening records' };
        case 'doctor-screening-result':
          return { title: 'Screening Result & Explainability', subtitle: `ID: ${activeResult?.screeningId || 'Result'}` };
        case 'doctor-pending-reviews':
          return { title: 'Pending Reviews', subtitle: 'Screenings awaiting clinician review & decision' };
        case 'doctor-patients':
          return { title: 'Patients Registry', subtitle: 'Registered patient clinical profiles' };
        case 'doctor-patient-details':
          return { title: `Patient History: ${activePatient?.patientId || ''}`, subtitle: 'Full clinical timeline of patient screenings' };
        case 'doctor-assistant':
          return { title: 'AI Clinical Assistant', subtitle: 'Contextual AI Q&A based on MATLAB screening outputs' };
        default:
          return { title: 'Clinical Specialist', subtitle: 'Ophthalmologist Interface' };
      }
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <Layout
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      title={headerInfo.title}
      subtitle={headerInfo.subtitle}
      dbConnected={dbConnected}
    >
      {/* OPERATOR ROLE VIEWS */}
      {role === 'operator' && (
        <>
          {currentTab === 'operator-dashboard' && (
            <OperatorDashboard
              screenings={screenings}
              onNavigateScreening={() => setCurrentTab('operator-screening')}
              onNavigateQueue={() => setCurrentTab('operator-queue')}
              onNavigatePatients={() => setCurrentTab('operator-patients')}
            />
          )}

          {currentTab === 'operator-screening' && (
            <OperatorScreening onComplete={loadScreenings} />
          )}

          {currentTab === 'operator-queue' && (
            <OperatorQueue
              screenings={screenings}
              onNavigateScreening={() => setCurrentTab('operator-screening')}
            />
          )}

          {currentTab === 'operator-patients' && (
            <OperatorPatients
              screenings={screenings}
              onNavigateScreening={() => setCurrentTab('operator-screening')}
            />
          )}
        </>
      )}

      {/* DOCTOR ROLE VIEWS */}
      {role === 'doctor' && (
        <>
          {currentTab === 'doctor-dashboard' && (
            <DoctorDashboard
              screenings={screenings}
              onNavigateScreening={() => setCurrentTab('doctor-screenings')}
              onViewScreening={handleViewScreening}
            />
          )}

          {currentTab === 'doctor-screenings' && (
            <DoctorScreenings
              screenings={screenings}
              onViewScreening={handleViewScreening}
            />
          )}

          {currentTab === 'doctor-screening-result' && (
            <DoctorScreeningResult
              result={activeResult}
              onBack={() => setCurrentTab('doctor-dashboard')}
              onNewScreening={() => setCurrentTab('doctor-screenings')}
            />
          )}

          {currentTab === 'doctor-pending-reviews' && (
            <DoctorPendingReviews
              screenings={screenings}
              onViewScreening={handleViewScreening}
            />
          )}

          {currentTab === 'doctor-patients' && (
            <DoctorPatients
              screenings={screenings}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {currentTab === 'doctor-patient-details' && (
            <DoctorPatientDetails
              patient={activePatient}
              onBack={() => setCurrentTab('doctor-patients')}
              onViewScreening={handleViewScreening}
            />
          )}

          {currentTab === 'doctor-assistant' && (
            <DoctorAssistantPage
              screenings={screenings}
              onViewScreening={handleViewScreening}
            />
          )}
        </>
      )}
    </Layout>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
