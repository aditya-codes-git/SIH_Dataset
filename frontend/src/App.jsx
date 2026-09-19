import React, { useState, useEffect, useCallback } from 'react';
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
import { ScreeningResult as DoctorScreeningResult } from './pages/doctor/DoctorScreeningResult';
import { Screenings as DoctorScreenings } from './pages/Screenings';
import { DoctorPendingReviews } from './pages/doctor/DoctorPendingReviews';
import { Patients as DoctorPatients } from './pages/Patients';
import { PatientDetails as DoctorPatientDetails } from './pages/PatientDetails';
import { AssistantPage as DoctorAssistantPage } from './pages/AssistantPage';

import { api } from './services/api';

export function AppContent() {
  const { role } = useAuth();

  // Initialize currentTab from localStorage if valid for role, else default to dashboard
  const [currentTab, setCurrentTab] = useState(() => {
    const saved = localStorage.getItem('retinoscan_active_tab');
    if (saved) {
      if (role === 'operator' && saved.startsWith('operator-')) return saved;
      if (role === 'doctor' && saved.startsWith('doctor-')) return saved;
    }
    return role === 'operator' ? 'operator-dashboard' : 'doctor-dashboard';
  });

  const [screenings, setScreenings] = useState([]);
  const [activeResult, setActiveResult] = useState(null);
  const [activePatient, setActivePatient] = useState(null);
  const [recaptureScreening, setRecaptureScreening] = useState(null);
  const [dbConnected, setDbConnected] = useState(true);

  // Load screenings from backend using active role credentials
  const loadScreenings = useCallback(async () => {
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
  }, [role]);

  useEffect(() => {
    loadScreenings();
  }, [loadScreenings]);

  // Persist currentTab whenever it changes
  useEffect(() => {
    if (currentTab) {
      localStorage.setItem('retinoscan_active_tab', currentTab);
    }
  }, [currentTab]);

  // Enforce role-protected routes & redirects on role change
  useEffect(() => {
    if (role === 'operator' && !currentTab.startsWith('operator-')) {
      setCurrentTab('operator-dashboard');
    } else if (role === 'doctor' && !currentTab.startsWith('doctor-')) {
      setCurrentTab('doctor-dashboard');
    }
  }, [role]);

  // Auto-restore active screening record from database if refreshed on detail tab
  useEffect(() => {
    const savedScreeningId = localStorage.getItem('retinoscan_active_screening_id');
    const isDetailTab = currentTab === 'operator-screening-result' || currentTab === 'doctor-screening-result';

    if (isDetailTab && savedScreeningId && !activeResult) {
      api.getScreeningById(savedScreeningId, role)
        .then((res) => {
          const item = res.screening || res;
          if (item && item.screeningId) {
            setActiveResult(item);
          }
        })
        .catch((err) => {
          console.warn('Could not auto-restore screening record on reload:', err.message);
        });
    }
  }, [currentTab, role, activeResult]);

  const handleViewScreening = async (screeningOrId) => {
    const id = typeof screeningOrId === 'string' ? screeningOrId : screeningOrId?.screeningId;
    if (!id) return;

    // Persist ID in localStorage for browser refresh persistence
    localStorage.setItem('retinoscan_active_screening_id', id);

    try {
      const res = await api.getScreeningById(id, role);
      const record = res.screening || res;
      setActiveResult(record);

      if (role === 'operator') {
        setCurrentTab('operator-screening-result');
      } else {
        setCurrentTab('doctor-screening-result');
      }
    } catch (err) {
      console.error('Failed to load screening details:', err);
      if (typeof screeningOrId === 'object' && screeningOrId !== null) {
        setActiveResult(screeningOrId);
        setCurrentTab(role === 'operator' ? 'operator-screening-result' : 'doctor-screening-result');
      }
    }
  };

  const handleRecapture = (screeningRecord) => {
    setRecaptureScreening(screeningRecord);
    setCurrentTab('operator-screening');
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
          return { title: 'Screening Center Queue', subtitle: 'Track submitted screenings (Complete operational registry)' };
        case 'operator-patients':
          return { title: 'Patient Lookup', subtitle: 'Screening center patient registry' };
        case 'operator-screening-result':
          return { title: 'Screening Details & Diagnostics', subtitle: `ID: ${activeResult?.screeningId || 'Details'}` };
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
              onNavigateScreening={() => {
                setRecaptureScreening(null);
                setCurrentTab('operator-screening');
              }}
              onNavigateQueue={() => setCurrentTab('operator-queue')}
              onNavigatePatients={() => setCurrentTab('operator-patients')}
              onViewScreening={handleViewScreening}
              onRecapture={handleRecapture}
            />
          )}

          {currentTab === 'operator-screening' && (
            <OperatorScreening 
              initialScreening={recaptureScreening}
              onComplete={async () => {
                setRecaptureScreening(null);
                await loadScreenings();
              }} 
            />
          )}

          {currentTab === 'operator-queue' && (
            <OperatorQueue
              screenings={screenings}
              onNavigateScreening={() => {
                setRecaptureScreening(null);
                setCurrentTab('operator-screening');
              }}
              onViewScreening={handleViewScreening}
              onRecapture={handleRecapture}
            />
          )}

          {currentTab === 'operator-patients' && (
            <OperatorPatients
              screenings={screenings}
              onNavigateScreening={() => {
                setRecaptureScreening(null);
                setCurrentTab('operator-screening');
              }}
            />
          )}

          {currentTab === 'operator-screening-result' && (
            <DoctorScreeningResult
              result={activeResult}
              isOperator={true}
              onBack={() => {
                loadScreenings();
                setCurrentTab('operator-queue');
              }}
              onNewScreening={() => {
                setRecaptureScreening(null);
                loadScreenings();
                setCurrentTab('operator-screening');
              }}
              onRecapture={handleRecapture}
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
              isOperator={false}
              onBack={() => {
                loadScreenings();
                setCurrentTab('doctor-dashboard');
              }}
              onReviewSubmitted={async (updatedScreening) => {
                setActiveResult(updatedScreening);
                await loadScreenings();
              }}
              onNewScreening={() => {
                loadScreenings();
                setCurrentTab('doctor-screenings');
              }}
            />
          )}

          {currentTab === 'doctor-pending-reviews' && (
            <DoctorPendingReviews
              screenings={screenings}
              onViewScreening={handleViewScreening}
              onRefresh={loadScreenings}
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
