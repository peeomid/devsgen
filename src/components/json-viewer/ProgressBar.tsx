import React from 'react';
import { useStore } from '@nanostores/react';
import { processingStatus, processingProgress, processingError } from '../../stores/jsonViewerStore';

export const ProgressBar: React.FC = () => {
  const status = useStore(processingStatus);
  const progress = useStore(processingProgress);
  const error = useStore(processingError);

  const isVisible = status !== 'idle' && status !== 'ready';

  if (!isVisible) return null;

  return (
    <div className="w-full">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700 font-medium">{error}</span>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-900">
                  {status === 'loading' ? 'Loading JSON...' : 'Processing...'}
                </span>
                <span className="text-sm text-blue-700">{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;