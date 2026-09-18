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
      // Step 2: Quality check simulation UI feedback
      setTimeout(() => setCurrentStep(2), 600);
      // Step 3: MATLAB execution UI feedback
      setTimeout(() => setCurrentStep(3), 1500);

      const result = await api.createScreening(formData);

      // Step 4: Explanation ready UI feedback
      setCurrentStep(4);
      setTimeout(() => {
        setIsProcessing(false);
        if (onScreeningComplete) {
          onScreeningComplete(result);
        }
      }, 500);
    } catch (err) {
      console.error('Screening upload error:', err);
      setError(err.message || 'Screening could not be completed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {error && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
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
