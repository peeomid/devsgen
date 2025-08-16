import React from 'react';
import { useStore } from '@nanostores/react';
import { dataType, lineCount, csvHeaders, hasHeaders, delimiter, lineFilterActions } from '../../stores/lineFilterStore';

export interface FormatDetectorProps {
  className?: string;
}

export const FormatDetector: React.FC<FormatDetectorProps> = ({ className = '' }) => {
  const currentDataType = useStore(dataType);
  const currentLineCount = useStore(lineCount);
  const currentCsvHeaders = useStore(csvHeaders);
  const currentHasHeaders = useStore(hasHeaders);
  const currentDelimiter = useStore(delimiter);

  if (currentDataType === 'none') {
    return null;
  }

  const getDelimiterName = (delim: string): string => {
    switch (delim) {
      case ',': return 'Comma';
      case ';': return 'Semicolon';
      case '\t': return 'Tab';
      case '|': return 'Pipe';
      default: return 'Custom';
    }
  };

  const formatBadgeText = () => {
    if (currentDataType === 'csv') {
      return `${currentDataType.toUpperCase()} • ${currentLineCount.toLocaleString()} lines • ${currentCsvHeaders.length} columns`;
    }
    return `${currentDataType.toUpperCase()} • ${currentLineCount.toLocaleString()} lines`;
  };

  return (
    <div className={`${className}`}>
      {/* Compact Badge */}
      <div className="inline-flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{formatBadgeText()}</span>
        </div>

        {/* CSV Header Toggle - Compact */}
        {currentDataType === 'csv' && (
          <label className="flex items-center space-x-1 cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            <input
              type="checkbox"
              checked={currentHasHeaders}
              onChange={(e) => lineFilterActions.setHasHeaders(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 w-3 h-3"
            />
            <span className="text-xs">Headers</span>
          </label>
        )}
      </div>
    </div>
  );
};

export default FormatDetector;