import React, { useState, useEffect } from 'react';

interface OutputAreaProps {
  value: string;
  executionTime?: number;
  isLoading?: boolean;
  error?: string | null;
}

export default function OutputArea({ 
  value, 
  executionTime,
  isLoading = false,
  error = null
}: OutputAreaProps) {
  const [isCopied, setIsCopied] = useState(false);
  
  // Reset copy state after 2 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isCopied) {
      timeout = setTimeout(() => setIsCopied(false), 2000);
    }
    return () => clearTimeout(timeout);
  }, [isCopied]);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };
  
  return (
    <div className="relative rounded-md border border-gray-300">
      {/* Header with stats and actions */}
      <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-300 rounded-t-md">
        <div className="text-xs text-gray-500">
          {error ? (
            <span className="text-error">Error</span>
          ) : (
            <>
              <span>{value.length} characters</span>
              {executionTime !== undefined && (
                <span className="ml-3">{executionTime.toFixed(2)}ms</span>
              )}
            </>
          )}
        </div>
        
        <div>
          <button
            onClick={handleCopy}
            disabled={isLoading || !value || !!error}
            className="text-gray-600 hover:text-primary px-2 py-1 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            aria-label="Copy to clipboard"
          >
            {isCopied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Content area */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error ? (
          <div className="p-4 text-error font-mono text-sm whitespace-pre-wrap">
            {error}
          </div>
        ) : (
          <pre className="p-4 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[400px] min-h-[200px]">
            {value || <span className="text-gray-400">Transformation result will appear here</span>}
          </pre>
        )}
      </div>
    </div>
  );
}
