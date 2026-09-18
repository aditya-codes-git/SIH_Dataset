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
      setError('Please upload a valid retinal fundus image format (PNG, JPEG, TIFF, BMP).');
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
    <Card className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          New Retinal Screening
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Upload an uncompressed fundus image for AI-assisted Diabetic Retinopathy screening.
        </p>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          fontSize: '0.875rem',
          marginBottom: '1rem',
        }}>
          <AlertCircle size={16} />
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
            border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-hover)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
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
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <UploadCloud size={24} />
          </div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Click to upload or drag & drop retinal fundus image
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Supports PNG, JPEG, TIFF, BMP (Up to 50MB)
          </p>
        </div>
      ) : (
        /* Image Preview Box */
        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          backgroundColor: 'var(--bg-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ImageIcon size={20} color="var(--primary)" />
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove} icon={X}>
              Remove
            </Button>
          </div>

          <div style={{
            maxHeight: '260px',
            overflow: 'hidden',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <img
              src={preview}
              alt="Uploaded Retinal Fundus Preview"
              style={{ maxHeight: '260px', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* Patient Meta Input Form */}
      <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Patient ID (Optional)
          </label>
          <div style={{ position: 'relative' }}>
            <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="e.g. PATIENT-8021 or leave blank for auto-assign"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!file}
          icon={ArrowRight}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          Run MATLAB AI Screening
        </Button>
      </form>
    </Card>
  );
};
