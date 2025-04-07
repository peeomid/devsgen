import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface OutputAreaProps {
  value: string;
  executionTime?: number;
  isLoading?: boolean;
  error?: string | null;
  onCopy?: () => void;
  onChange?: (value: string) => void;
}

export interface OutputAreaHandle {
  focus: () => void;
  selectAll: () => void;
  copyToClipboard: () => Promise<boolean>;
}

const OutputArea = forwardRef<OutputAreaHandle, OutputAreaProps>(({ 
  value, 
  executionTime,
  isLoading = false,
  error = null,
  onCopy,
  onChange
}: OutputAreaProps, ref) => {
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
    selectAll: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    },
    copyToClipboard: async () => {
      return await handleCopy();
    }
  }));
  
  // Reset copy state after 2 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isCopied) {
      timeout = setTimeout(() => setIsCopied(false), 2000);
    }
    return () => clearTimeout(timeout);
  }, [isCopied]);
  
  const handleCopy = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      if (onCopy) onCopy();
      return true;
    } catch (err) {
      console.error('Failed to copy text:', err);
      return false;
    }
  };
  
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className={`relative rounded-md border ${isFocused ? 'border-primary' : 'border-gray-300'} transition-colors`}>
      <div className="absolute top-0 right-0 p-2 text-xs text-gray-500">
        {value.length} characters
        {executionTime !== undefined && (
          <span className="ml-3">{executionTime.toFixed(2)}ms</span>
        )}
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
          <textarea
            ref={textareaRef}
            className="w-full h-full min-h-[200px] p-4 font-mono text-sm resize-y rounded-md focus:outline-none"
            value={value}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Output will appear here... (⌘2 to focus)"
            spellCheck={false}
            aria-label="Output text"
            title="Output area (⌘2 to focus)"
          />
        )}
      </div>
      
      {/* Copy button */}
      <div className="absolute bottom-2 right-2">
        <button
          onClick={handleCopy}
          disabled={isLoading || !value || !!error}
          className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
              <span className="ml-2 text-xs opacity-75">⌘⇧C</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});

export default OutputArea;
