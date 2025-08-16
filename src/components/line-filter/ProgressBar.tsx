import React from 'react';
import { useStore } from '@nanostores/react';
import { processingStatus, processingProgress, processingError, isFiltering } from '../../stores/lineFilterStore';

export interface ProgressBarProps {
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ className = '' }) => {
  const status = useStore(processingStatus);
  const progress = useStore(processingProgress);
  const error = useStore(processingError);
  const filtering = useStore(isFiltering);

  const isProcessing = status !== 'idle' && status !== 'complete' && status !== 'error';
  const showProgress = isProcessing || filtering;

  if (!showProgress && !error) {
    return null;
  }

  const getStatusText = (): string => {
    if (filtering) return 'Filtering data...';
    
    switch (status) {
      case 'uploading': return 'Uploading file...';
      case 'parsing': return 'Processing file...';
      case 'complete': return 'Complete';
      case 'error': return 'Error occurred';
      default: return 'Processing...';
    }
  };

  const getProgressColor = (): string => {
    if (error) return 'bg-red-500';
    if (status === 'complete') return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`${className}`}>
      {showProgress && (
        <div className="space-y-2">
          {/* Status Text */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {getStatusText()}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            >
              {/* Animated loading effect */}
              {isProcessing && (
                <div className="h-full bg-white bg-opacity-30 animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Processing indicator for indeterminate states */}
          {(isProcessing || filtering) && progress === 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Processing Error
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;