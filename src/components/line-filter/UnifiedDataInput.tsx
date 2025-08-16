import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { lineFilterActions, processingStatus, processingProgress, processingError, hasHeaders } from '../../stores/lineFilterStore';
import { FileParserService } from '../../services/FileParserService';

export interface UnifiedDataInputProps {
  className?: string;
}

type InputMode = 'both' | 'file-focused' | 'text-focused';

export const UnifiedDataInput: React.FC<UnifiedDataInputProps> = ({ className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('both');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const status = useStore(processingStatus);
  const progress = useStore(processingProgress);
  const error = useStore(processingError);
  const currentHasHeaders = useStore(hasHeaders);

  const isProcessing = status === 'uploading' || status === 'parsing';
  
  // Smart CSV detection with enhanced details
  const csvInfo = useMemo(() => {
    if (!pastedText.trim()) return null;
    
    const lines = pastedText.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) return null;
    
    const delimiters = [
      { char: ',', name: 'Comma' },
      { char: ';', name: 'Semicolon' },
      { char: '\t', name: 'Tab' }
    ];
    
    for (const delimiter of delimiters) {
      const firstLineCount = lines[0].split(delimiter.char).length;
      if (firstLineCount > 1) {
        const consistentColumns = lines.slice(0, Math.min(3, lines.length))
          .every(line => line.split(delimiter.char).length === firstLineCount);
        if (consistentColumns) {
          return {
            delimiter: delimiter.name,
            columns: firstLineCount,
            format: `${delimiter.name} CSV (${firstLineCount} columns)`
          };
        }
      }
    }
    return null;
  }, [pastedText]);

  const lineCount = pastedText.split('\n').filter(line => line.trim().length > 0).length;
  const hasText = pastedText.trim().length > 0;
  const hasDataReady = hasText || inputMode === 'file-focused';

  // File handling
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setInputMode('file-focused');
      setPastedText(''); // Clear text when file is selected
      await lineFilterActions.loadFile(file);
    } catch (error) {
      console.error('File upload failed:', error);
      setInputMode('both');
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Text handling
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPastedText(value);
    
    if (value.trim()) {
      setInputMode('text-focused');
    } else if (inputMode === 'text-focused') {
      setInputMode('both');
    }
  }, [inputMode]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (text) {
      setPastedText(text);
      setInputMode('text-focused');
    }
  }, []);

  const handleProcessText = useCallback(async () => {
    if (!pastedText.trim()) return;

    try {
      await lineFilterActions.loadText(pastedText);
      setPastedText('');
      setInputMode('both');
    } catch (error) {
      console.error('Text processing failed:', error);
    }
  }, [pastedText]);

  const handleClear = useCallback(() => {
    setPastedText('');
    setInputMode('both');
  }, []);

  const maxFileSize = FileParserService.getMaxFileSize();
  const maxLines = FileParserService.getMaxLines();
  const maxFileSizeMB = Math.round(maxFileSize / 1024 / 1024);

  return (
    <div className={`${className}`}>
      {/* Unified Input Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Your Data</h2>
              <p className="text-sm text-gray-600">Upload a file or paste text directly</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div 
            className={`
              relative border-2 border-dashed rounded-lg text-center transition-all duration-200
              ${isDragOver ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-blue-300'}
              ${inputMode === 'text-focused' ? 'opacity-60 bg-gray-50' : 'opacity-100'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={!isProcessing ? handleBrowseClick : undefined}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.tsv,.log"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isProcessing}
            />

            <div className="py-8">
              <div className="flex justify-center mb-4">
                <svg
                  className={`w-10 h-10 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              
              <p className="text-base font-medium text-gray-700 mb-2">
                {isDragOver ? 'Drop your file here' : 'Drop file or click to browse'}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Supports .txt, .csv, .tsv, .log files
              </p>
              
              <div className="inline-flex items-center space-x-3 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-full">
                <span>Max: {maxFileSizeMB}MB</span>
                <span>•</span>
                <span>{maxLines.toLocaleString()} lines</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm font-medium text-gray-500">OR</span>
            </div>
          </div>

          {/* Text Input Area */}
          <div className={`transition-all duration-200 ${inputMode === 'file-focused' ? 'opacity-60 bg-gray-50 rounded-lg' : 'opacity-100'}`}>
            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <textarea
                value={pastedText}
                onChange={handleTextChange}
                onPaste={handlePaste}
                placeholder="Paste your text data here, or start typing..."
                className="w-full h-32 p-4 text-sm font-mono resize-none border-0 focus:outline-none focus:ring-0 placeholder-gray-400"
                disabled={isProcessing}
              />
              
              {/* Text Status Bar */}
              {hasText && (
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {lineCount} lines ready
                    </div>
                    {csvInfo && (
                      <div className="flex items-center text-sm text-blue-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {csvInfo.format}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-sm text-gray-500 hover:text-red-600 font-medium"
                    disabled={isProcessing}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CSV Settings - Unified */}
          {csvInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-2">CSV Format Detected: {csvInfo.format}</p>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentHasHeaders}
                      onChange={(e) => lineFilterActions.setHasHeaders(e.target.checked)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                      disabled={isProcessing}
                    />
                    <span className="text-sm text-blue-800">First row contains column headers</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    {status === 'uploading' ? 'Uploading file...' : 'Processing data...'}
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-blue-700 mt-1">{progress}% complete</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Process Button */}
          {!isProcessing && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleProcessText}
                disabled={!hasText}
                className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg focus:outline-none focus:ring-4 transform transition-all duration-200 shadow-lg ${
                  hasText 
                    ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-95 focus:ring-blue-300 hover:shadow-xl' 
                    : 'text-gray-500 bg-gray-300 cursor-not-allowed focus:ring-gray-300'
                }`}
              >
                Process
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedDataInput;