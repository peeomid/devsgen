import React from 'react';
import { useStore } from '@nanostores/react';
import { currentView, jsonViewerActions } from '../../stores/jsonViewerStore';

export const ViewToggle: React.FC = () => {
  const view = useStore(currentView);

  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      <button
        type="button"
        onClick={() => jsonViewerActions.setView('tree')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
          view === 'tree'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center space-x-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Tree</span>
        </div>
      </button>
      
      <button
        type="button"
        onClick={() => jsonViewerActions.setView('raw')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
          view === 'raw'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center space-x-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span>Raw</span>
        </div>
      </button>
    </div>
  );
};

export default ViewToggle;