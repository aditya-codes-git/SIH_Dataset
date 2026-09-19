import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, ArrowRight, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const UploadDropzone = ({ onAnalyze }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    if (!selectedFile.type.match(/^image\/(png|jpeg|jpg|tiff|bmp)$/i) && !selectedFile.name.match(/\.(png|jpe?g|tiff?|bmp)$/i)) {
      setError('Please upload a supported retinal fundus image format (PNG, JPEG, TIFF, BMP).');
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    onAnalyze(file, patientId || `PATIENT-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  return (
    <Card
      title="Retinal Fundus Screening"
      subtitle="Acquire and submit an uncompressed fundus photograph for clinical decision support"
      headerBorder={true}
      style={{ maxWidth: '680px', margin: '0 auto' }}
    >
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          fontSize: '0.75rem',
          marginBottom: '0.875rem',
        }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1px dashed ${dragActive ? 'var(--primary)' : 'var(--border-hover)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            backgroundColor: dragActive ? 'var(--primary-light)' : 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/tiff,image/bmp"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.5rem auto',
            border: '1px solid var(--border-color)',
          }}>
            <UploadCloud size={20} />
          </div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Select retinal fundus photograph or drag & drop file
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', margin: 0 }}>
            Standard formats: PNG, JPEG, TIFF, BMP (Original byte stream preserved)
          </p>
        </div>
      ) : (
        /* Image Preview Box */
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem',
          backgroundColor: 'var(--bg-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={16} color="var(--primary)" />
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove} icon={X}>
              Remove
            </Button>
          </div>

          <div style={{
            maxHeight: '240px',
            overflow: 'hidden',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src={preview}
              alt="Retinal Fundus Preview"
              style={{ maxHeight: '240px', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* Patient Input & Action */}
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Patient ID (Optional)
          </label>
          <div style={{ position: 'relative' }}>
            <User size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="e.g. PATIENT-8021 (leave blank for automatic assignment)"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="clinical-input"
              style={{ paddingLeft: '2rem' }}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!file}
          icon={ArrowRight}
          style={{ width: '100%', marginTop: '0.25rem' }}
        >
          Run MATLAB AI Screening
        </Button>
      </form>
    </Card>
  );
};
