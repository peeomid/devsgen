import React from 'react';
import { useStore } from '@nanostores/react';
import { 
  originalJSON, 
  displayJSON, 
  fileName,
  clipboardStatus,
  jsonViewerActions 
} from '../../stores/jsonViewerStore';

interface JSONToolbarProps {
  onClear: () => void;
}

export const JSONToolbar: React.FC<JSONToolbarProps> = ({ onClear }) => {
  const originalData = useStore(originalJSON);
  const displayData = useStore(displayJSON);
  const currentFileName = useStore(fileName);
  const copyStatus = useStore(clipboardStatus);

  const handleCopyOriginal = async () => {
    if (originalData) {
      try {
        await jsonViewerActions.copyToClipboard(originalData);
      } catch (error) {
        console.error('Failed to copy original JSON:', error);
      }
    }
  };

  const handleCopyDisplayed = async () => {
    if (displayData) {
      try {
        const jsonString = JSON.stringify(displayData, null, 2);
        await jsonViewerActions.copyToClipboard(jsonString);
      } catch (error) {
        console.error('Failed to copy displayed JSON:', error);
      }
    }
  };

  const handleDownload = () => {
    if (!displayData) return;

    const jsonString = JSON.stringify(displayData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName || 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Copy Buttons */}
      <button
        type="button"
        onClick={handleCopyOriginal}
        disabled={!originalData || copyStatus === 'copying'}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        data-copy-json
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {copyStatus === 'copying' ? 'Copying...' : copyStatus === 'copied' ? 'Copied!' : 'Copy'}
      </button>

      {/* Download Button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={!displayData}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download
      </button>

      {/* Clear Button */}
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Clear
      </button>
    </div>
  );
};

export default JSONToolbar;