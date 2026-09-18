import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, User, RefreshCw, Send, Focus, Sun, Eye, FileText, Activity } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { ReportViewer } from '../../components/report/ReportViewer';
import { ImageComparison } from '../../components/screening/ImageComparison';

export const OperatorScreening = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [diabetesDuration, setDiabetesDuration] = useState('');
  const [contactLocation, setContactLocation] = useState('Mandya Rural Health Camp, KA');

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [screeningResult, setScreeningResult] = useState(null);
  const [error, setError] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  };

  const handleUploadAndRunScreening = async () => {
    if (!file) return;

    setLoading(true);
    setLoadingStage('Checking image quality (Focus, Illumination, Field of View)...');
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('patientId', patientId || `P-${Math.floor(10000 + Math.random() * 90000)}`);
    formData.append('patientName', patientName || 'Anonymous Patient');
    formData.append('age', age);
    formData.append('gender', gender);
    formData.append('diabetesDuration', diabetesDuration || 'Not specified');
    formData.append('contactLocation', contactLocation);

    try {
      setLoadingStage('Executing MATLAB DR screening engine (ResNet-18)...');
      const res = await api.createScreening(formData);
      setScreeningResult(res);

      if (res.status === 'UNGRADABLE') {
        setStep(3); // Step 3: Quality Check Failure Card
      } else {
        setStep(4); // Step 4: Screening Result & Triage Routing
      }
    } catch (err) {
      setError(err.message || 'Screening execution failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setScreeningResult(null);
    setError(null);
    setShowReport(false);
  };

  if (showReport && screeningResult) {
    return <ReportViewer screening={screeningResult} onBack={() => setShowReport(false)} />;
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }} className="animate-fade-in">
      {/* Step Indicators Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        {[
          { num: 1, label: '1. Patient Info' },
          { num: 2, label: '2. Fundus Capture' },
          { num: 3, label: '3. Quality Gate' },
          { num: 4, label: '4. DR Screening' },
        ].map((s) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: step >= s.num ? 'var(--primary)' : 'var(--bg-secondary)',
              color: step >= s.num ? '#FFF' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              {s.num}
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: step === s.num ? 600 : 400, color: step === s.num ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* STEP 1: PATIENT REGISTRATION */}
      {step === 1 && (
        <Card title="Step 1: Patient Information" subtitle="Enter patient demographics for camp screening registry">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Patient ID
              </label>
              <input
                type="text"
                placeholder="e.g. P00127 or leave blank for auto-id"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Patient Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Age (Years)
              </label>
              <input
                type="number"
                placeholder="e.g. 54"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Diabetes Duration
              </label>
              <input
                type="text"
                placeholder="e.g. 6 years"
                value={diabetesDuration}
                onChange={(e) => setDiabetesDuration(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Camp / Health Center Location
              </label>
              <input
                type="text"
                placeholder="e.g. Mandya Rural Camp, KA"
                value={contactLocation}
                onChange={(e) => setContactLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <Button variant="primary" icon={ArrowRight} onClick={() => setStep(2)} style={{ width: '100%', marginTop: '1.5rem' }}>
            Continue to Fundus Capture
          </Button>
        </Card>
      )}

      {/* STEP 2: FUNDUS CAPTURE / UPLOAD */}
      {step === 2 && (
        <Card title="Step 2: Fundus Image Capture / Upload" subtitle="Select uncompressed fundus photograph from camera feed or file">
          {!file ? (
            <div style={{
              border: '2px dashed var(--border-hover)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              cursor: 'pointer',
              marginTop: '1rem',
            }}>
              <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} id="op-file-input" />
              <label htmlFor="op-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <UploadCloud size={40} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Click to select retinal fundus photograph
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Supports PNG, JPEG, TIFF, BMP (Original byte stream preserved)
                </p>
              </label>
            </div>
          ) : (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <div style={{ maxHeight: '260px', overflow: 'hidden', borderRadius: 'var(--radius-md)', backgroundColor: '#000', marginBottom: '1rem' }}>
                <img src={preview} alt="Fundus preview" style={{ maxHeight: '260px', maxWidth: '100%', objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{file.name}</p>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Activity size={32} color="var(--primary)" className="animate-spin" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                RUNNING DR SCREENING PIPELINE
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {loadingStage}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              {file && (
                <Button variant="outline" icon={RefreshCw} onClick={() => { setFile(null); setPreview(null); }}>
                  Replace Image
                </Button>
              )}
              <Button variant="primary" disabled={!file} onClick={handleUploadAndRunScreening} style={{ flex: 1 }}>
                Check Quality & Run Screening
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* STEP 3: IMAGE QUALITY ASSESSMENT HARD GATE FAILURE */}
      {step === 3 && screeningResult && (
        <Card title="Step 3: Image Quality Assessment — HARD GATE FAILED" subtitle="MATLAB IQA evaluation stopped DR classification pipeline">
          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginBottom: '0.75rem' }}>
              <AlertTriangle size={24} />
              <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>IMAGE QUALITY INSUFFICIENT — RECAPTURE REQUIRED</span>
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>
              Reason: "{screeningResult.quality?.reason || 'Suboptimal focus, illumination, or field of view.'}"
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Please recapture the retinal image. DR neural classification was automatically halted to prevent unreliable predictions.
            </p>
          </div>

          {/* IQA METRICS BREAKDOWN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Focus Variance</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {screeningResult.quality?.focusScore?.toFixed(6) ?? 'N/A'}
              </span>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Illumination</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {screeningResult.quality?.brightness?.toFixed(4) ?? 'N/A'}
              </span>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Field of View Ratio</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {screeningResult.quality?.fovRatio != null ? (screeningResult.quality.fovRatio * 100).toFixed(1) + '%' : 'N/A'}
              </span>
            </div>
          </div>

          <Button variant="primary" icon={RefreshCw} onClick={handleReset} style={{ width: '100%' }}>
            Recapture Retinal Image
          </Button>
        </Card>
      )}

      {/* STEP 4: SCREENING RESULT & TRIAGE ROUTING OUTCOME */}
      {step === 4 && screeningResult && (
        <Card title="Step 4: Screening Complete & Risk Triage Routing" subtitle="Authoritative MATLAB prediction and clinical referral priority">
          {/* IQA PASSED BADGE */}
          <div style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>IMAGE QUALITY PASSED (Focus, Illumination & FOV Verified)</span>
          </div>

          {/* SCREENING RESULT CARD */}
          <div style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  MATLAB AI DR GRADE
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: screeningResult.triage?.referralRequired ? 'var(--danger)' : 'var(--success)', margin: 0 }}>
                  Grade {screeningResult.drGrade} — {screeningResult.drGrade <= 1 ? 'Low Risk DR' : 'Referable DR'}
                </h3>
              </div>

              <Badge variant={screeningResult.triage?.referralRequired ? 'danger' : 'success'} size="md">
                Priority: {screeningResult.triage?.priority || 'ROUTINE'}
              </Badge>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
              {screeningResult.triage?.recommendation}
            </p>
          </div>

          {/* MODEL ATTENTION — GRAD-CAM VISUAL EXPLAINABILITY */}
          <div style={{ marginBottom: '1.5rem' }}>
            <ImageComparison
              originalUrl={api.getFileUrl(screeningResult.originalImageUrl)}
              gradcamUrl={api.getFileUrl(screeningResult.gradcamUrl)}
              status={screeningResult.status}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Button variant="secondary" icon={FileText} onClick={() => setShowReport(true)}>
              View Explainable Report
            </Button>

            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => {
                handleReset();
                if (onComplete) onComplete();
              }}
            >
              {screeningResult.triage?.referralRequired ? 'Send to Ophthalmologist Queue' : 'Complete Screening'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
