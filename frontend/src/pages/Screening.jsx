import React, { useState } from 'react';
import { UploadDropzone } from '../components/screening/UploadDropzone';
import { ProcessingState } from '../components/screening/ProcessingState';
import { api } from '../services/api';

export const Screening = ({ onScreeningComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);

  const handleAnalyze = async (file, patientId) => {
    setIsProcessing(true);
    setCurrentStep(1);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    if (patientId) {
      formData.append('patientId', patientId);
    }

    try {
      setTimeout(() => setCurrentStep(2), 600);
      setTimeout(() => setCurrentStep(3), 1500);

      const result = await api.createScreening(formData);

      setCurrentStep(4);
      setTimeout(() => {
        setIsProcessing(false);
        if (onScreeningComplete) {
          onScreeningComplete(result);
        }
      }, 500);
    } catch (err) {
      console.error('Screening upload error:', err);
      setError(err.message || 'Screening could not be completed. Please verify engine status.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }} className="animate-fade-in">
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          fontSize: '0.8125rem',
          marginBottom: '1rem',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {isProcessing ? (
        <ProcessingState step={currentStep} />
      ) : (
        <UploadDropzone onAnalyze={handleAnalyze} />
      )}
    </div>
  );
};
