import React, { useState } from 'react';
import { 
  UploadCloud, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  Info,
  Activity,
  Maximize2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { ReportViewer } from '../../components/report/ReportViewer';

export const OperatorScreening = ({ onComplete }) => {
  // Clinical Stepper: 1. Registration, 2. Fundus Capture, 3. Quality & Screening Result, 4. Report
  const [step, setStep] = useState(1);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Unspecified');
  const [diabetesDuration, setDiabetesDuration] = useState('');
  const [contactLocation, setContactLocation] = useState('');

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [screeningResult, setScreeningResult] = useState(null);
  const [error, setError] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const workflowSteps = [
    { num: 1, label: 'Patient Registration' },
    { num: 2, label: 'Fundus Image Capture' },
    { num: 3, label: 'Quality Verification' },
    { num: 4, label: 'AI Screening & Routing' },
  ];

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
    setLoadingStage('Evaluating image quality metrics (focus, illumination, field of view)...');
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    if (patientId) formData.append('patientId', patientId);
    if (patientName) formData.append('patientName', patientName);
    if (age) formData.append('age', age);
    if (gender && gender !== 'Unspecified') formData.append('gender', gender);
    if (diabetesDuration) formData.append('diabetesDuration', diabetesDuration);
    if (contactLocation) formData.append('contactLocation', contactLocation);

    try {
      setLoadingStage('Executing MATLAB screening algorithm (drScreen.m)...');
      const res = await api.createScreening(formData);
      setScreeningResult(res);

      if (res.status === 'UNGRADABLE') {
        setStep(3); // Step 3: Quality Check Failed
      } else {
        setStep(4); // Step 4: AI Screening & Routing Decision
      }
    } catch (err) {
      setError(err.message || 'Screening execution encountered an error. Please check engine connection.');
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
    setFullscreenImage(null);
  };

  if (showReport && screeningResult) {
    return <ReportViewer screening={screeningResult} onBack={() => setShowReport(false)} />;
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }} className="animate-fade-in">
      {/* Clinical Workflow Stepper */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
      }}>
        {workflowSteps.map((s, idx) => {
          const isCurrent = step === s.num || (step === 3 && s.num === 3) || (step === 4 && s.num === 4);
          const isDone = step > s.num;

          return (
            <React.Fragment key={s.num}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: isCurrent ? 'var(--primary)' : isDone ? 'var(--bg-secondary)' : 'transparent',
                  color: isCurrent ? '#FFFFFF' : isDone ? 'var(--primary)' : 'var(--text-muted)',
                  border: isCurrent ? '1px solid var(--primary)' : isDone ? '1px solid var(--primary-border)' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                }}>
                  {isDone ? '✓' : s.num}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {s.label}
                </span>
              </div>
              {idx < workflowSteps.length - 1 && (
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          fontSize: '0.8125rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: PATIENT REGISTRATION */}
      {step === 1 && (
        <Card
          title="Patient Intake & Demographics"
          subtitle="Record patient identity and operational screening center location"
          headerBorder={true}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem', marginTop: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Patient ID
              </label>
              <input
                type="text"
                placeholder="e.g. PATIENT-0042 (leave blank to auto-generate)"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="clinical-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Patient Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="clinical-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Age (Years)
              </label>
              <input
                type="number"
                placeholder="e.g. 54"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="clinical-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="clinical-select"
              >
                <option value="Unspecified">Unspecified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Duration of Diabetes
              </label>
              <input
                type="text"
                placeholder="e.g. 8 years"
                value={diabetesDuration}
                onChange={(e) => setDiabetesDuration(e.target.value)}
                className="clinical-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Screening Camp / Center Location
              </label>
              <input
                type="text"
                placeholder="e.g. Mandya Primary Health Center"
                value={contactLocation}
                onChange={(e) => setContactLocation(e.target.value)}
                className="clinical-input"
              />
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.875rem' }}>
            <Button variant="primary" icon={ArrowRight} onClick={() => setStep(2)}>
              Proceed to Fundus Capture
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: FUNDUS ACQUISITION & QUALITY EVALUATION */}
      {step === 2 && (
        <Card
          title="Fundus Image Acquisition"
          subtitle="Acquire retinal photograph from fundus camera or local disk"
          headerBorder={true}
        >
          {!file ? (
            <div style={{
              border: '1px dashed var(--border-hover)',
              borderRadius: 'var(--radius-sm)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              cursor: 'pointer',
              marginTop: '0.5rem',
            }}>
              <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} id="op-file-input" />
              <label htmlFor="op-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <UploadCloud size={32} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Click to select retinal fundus photograph
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                  Standard clinical formats supported: PNG, JPEG, TIFF, BMP (unaltered raw pixel stream preserved)
                </p>
              </label>
            </div>
          ) : (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#000000',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
                padding: '0.5rem',
                position: 'relative',
              }}>
                <img
                  src={preview}
                  alt="Fundus acquisition preview"
                  style={{ maxHeight: '280px', maxWidth: '100%', objectFit: 'contain', display: 'inline-block' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>File: <strong>{file.name}</strong></span>
                <span>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
              <Activity size={24} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                PROCESSING SCREENING PIPELINE
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                {loadingStage}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.875rem' }}>
              <Button variant="secondary" icon={ArrowLeft} onClick={() => setStep(1)}>
                Back to Patient Info
              </Button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {file && (
                  <Button variant="outline" icon={RefreshCw} onClick={() => { setFile(null); setPreview(null); }}>
                    Replace Image
                  </Button>
                )}
                <Button
                  variant="primary"
                  disabled={!file}
                  onClick={handleUploadAndRunScreening}
                >
                  Verify Quality & Screen
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 3: IMAGE QUALITY CHECK HARD GATE FAILED */}
      {step === 3 && screeningResult && (
        <Card
          title="Image Quality Gate — Recapture Required"
          subtitle="Automated Image Quality Assessment (IQA) stopped processing"
          headerBorder={true}
        >
          {/* Fundus image is primary visual element */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginTop: '0.5rem',
          }}>
            <div style={{
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#000000',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '220px',
            }}>
              <img
                src={preview || api.getFileUrl(screeningResult.originalImageUrl)}
                alt="Acquired fundus with quality defect"
                style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{
                padding: '0.75rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--warning-bg)',
                border: '1px solid var(--warning-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)', marginBottom: '0.35rem' }}>
                  <AlertTriangle size={16} />
                  <strong style={{ fontSize: '0.8125rem' }}>IMAGE DEFECT DETECTED</strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', margin: 0 }}>
                  Reason: "{screeningResult.quality?.reason || 'Suboptimal focus, illumination, or field of view.'}"
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.35rem', margin: 0 }}>
                  Retinal classification halted to prevent unreliable diagnostic outputs.
                </p>
              </div>

              {/* Exact IQA Parameters against thresholds */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.65625rem', color: 'var(--text-secondary)', display: 'block' }}>Focus Variance</span>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    {screeningResult.quality?.focusScore != null ? screeningResult.quality.focusScore.toFixed(6) : '—'}
                  </strong>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>≥ 0.00008</span>
                </div>

                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.65625rem', color: 'var(--text-secondary)', display: 'block' }}>Brightness</span>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    {screeningResult.quality?.brightness != null ? screeningResult.quality.brightness.toFixed(4) : '—'}
                  </strong>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>0.08–0.40</span>
                </div>

                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.65625rem', color: 'var(--text-secondary)', display: 'block' }}>FOV Ratio</span>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    {screeningResult.quality?.fovRatio != null ? `${(screeningResult.quality.fovRatio * 100).toFixed(1)}%` : '—'}
                  </strong>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>≥ 45.0%</span>
                </div>
              </div>

              <Button variant="primary" icon={RefreshCw} onClick={() => setStep(2)}>
                Recapture Retinal Image
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: AI SCREENING RESULT & CLINICAL REFERRAL ROUTING */}
      {step === 4 && screeningResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Assistive Tool Notice */}
          <div style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--primary-light)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--primary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={15} />
              <span><strong>ASSISTIVE SCREENING TOOL:</strong> Automated decision support — Doctor confirmation required.</span>
            </div>
            <Badge variant="success" size="sm">IQA Passed</Badge>
          </div>

          {/* Model Prediction & Routing Summary */}
          <Card
            title="AI Screening Result & Referral Routing"
            subtitle={`Patient: ${screeningResult.patientName || screeningResult.patientId} | ID: ${screeningResult.patientId}`}
            headerBorder={true}
            action={
              <Badge variant={screeningResult.triage?.referralRequired || screeningResult.drGrade >= 2 ? 'danger' : 'success'}>
                {screeningResult.triage?.referralRequired || screeningResult.drGrade >= 2 ? `Specialist Review (${screeningResult.triage?.priority || 'HIGH'})` : 'Routine Annual Follow-up'}
              </Badge>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', margin: '0.5rem 0 1rem 0' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Model DR Prediction</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: (screeningResult.drGrade >= 2) ? 'var(--danger)' : 'var(--success)' }}>
                  Grade {screeningResult.drGrade ?? '—'}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {screeningResult.drGrade === 0 ? 'No Apparent DR' : screeningResult.drGrade === 1 ? 'Mild Non-Proliferative' : screeningResult.drGrade === 2 ? 'Moderate Non-Proliferative' : screeningResult.drGrade === 3 ? 'Severe Non-Proliferative' : 'Proliferative DR'}
                </span>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Referral Status</span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: (screeningResult.drGrade >= 2) ? 'var(--danger)' : 'var(--success)', marginTop: '0.2rem' }}>
                  {screeningResult.triage?.referralRequired || screeningResult.drGrade >= 2 ? 'Referral Recommended' : 'Non-Referable'}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Threshold: Grade ≥ 2</span>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Routing Queue</span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {screeningResult.triage?.routing?.replace(/_/g, ' ') || 'OPHTHALMOLOGIST REVIEW'}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Priority: {screeningResult.triage?.priority || 'ROUTINE'}
                </span>
              </div>
            </div>

            {/* Clinical Recommendation Text */}
            <div style={{
              padding: '0.625rem 0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xs)',
              borderLeft: '3px solid var(--primary)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}>
              <strong>Clinical Routing Recommendation: </strong>
              <span>{screeningResult.triage?.recommendation || (screeningResult.drGrade >= 2 ? 'Referred to specialist ophthalmologist queue for clinical review.' : 'Routine annual screening follow-up recommended.')}</span>
            </div>
          </Card>

          {/* Visual Explainability: Retinal Fundus vs Grad-CAM Evidence */}
          <Card
            title="Evidence Regions — Visual Explainability"
            subtitle="Original fundus photograph alongside Grad-CAM deep feature activation heatmap"
            headerBorder={true}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
              {/* Original Retinal Fundus */}
              <div style={{
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#000000',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '0.35rem 0.6rem',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: '#FFFFFF',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>Original Retinal Fundus</span>
                  <button
                    onClick={() => setFullscreenImage({ url: api.getFileUrl(screeningResult.originalImageUrl), title: 'Original Retinal Fundus' })}
                    style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 0 }}
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
                <img
                  src={api.getFileUrl(screeningResult.originalImageUrl)}
                  alt="Original fundus"
                  style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block' }}
                />
              </div>

              {/* Model Attention — Grad-CAM */}
              <div style={{
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#000000',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '0.35rem 0.6rem',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: '#FFFFFF',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>Model Attention (Grad-CAM)</span>
                  <button
                    onClick={() => setFullscreenImage({ url: api.getFileUrl(screeningResult.gradcamUrl), title: 'Grad-CAM Attention Heatmap' })}
                    style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 0 }}
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
                <img
                  src={api.getFileUrl(screeningResult.gradcamUrl)}
                  alt="Grad-CAM activation overlay"
                  style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.75rem',
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
            }}>
              <Info size={13} color="var(--primary)" />
              <span>Grad-CAM highlights spatial lesion evidence regions that influenced the model prediction.</span>
            </div>
          </Card>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="secondary" icon={FileText} onClick={() => setShowReport(true)}>
              View Clinical Report
            </Button>

            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => {
                handleReset();
                if (onComplete) onComplete();
              }}
            >
              {screeningResult.triage?.referralRequired || screeningResult.drGrade >= 2 ? 'Submit to Specialist Queue' : 'Complete Screening'}
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Inspection Modal */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
            {fullscreenImage.title} — (Click anywhere to close)
          </div>
          <img
            src={fullscreenImage.url}
            alt={fullscreenImage.title}
            style={{ maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
      )}
    </div>
  );
};
