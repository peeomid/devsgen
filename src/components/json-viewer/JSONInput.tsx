import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { 
  jsonViewerActions, 
  processingStatus, 
  processingProgress, 
  processingError,
  isDragover,
  validationFeedback
} from '../../stores/jsonViewerStore';
import { JSONValidator } from '../../utils/jsonValidator';

export interface JSONInputProps {
  className?: string;
}

type InputMode = 'both' | 'file-focused' | 'text-focused';

export const JSONInput: React.FC<JSONInputProps> = ({ className = '' }) => {
  const [pastedText, setPastedText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('both');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const status = useStore(processingStatus);
  const progress = useStore(processingProgress);
  const error = useStore(processingError);
  const dragOver = useStore(isDragover);
  const feedback = useStore(validationFeedback);

  const isProcessing = status === 'loading' || status === 'processing';
  
  // JSON validation with enhanced error handling and auto-fix
  const jsonValidation = useMemo(() => {
    if (!pastedText.trim()) return null;
    
    // Enhanced validation with inline auto-fix logic
    let content = pastedText.trim();
    let autoFixApplied = false;
    let fixedContent = content;
    const appliedFixes: string[] = [];
    
    // Don't auto-fix multiple JSON objects - show error instead
    // if (/\}\s*\{/.test(content)) {
    //   fixedContent = '[' + content.replace(/(\}\s*\{)/g, '}, {') + ']';
    //   appliedFixes.push('Converted multiple JSON objects to array');
    //   autoFixApplied = true;
    // }
    
    // Auto-fix: Trailing commas
    if (/,(\s*[\}\]])/.test(fixedContent)) {
      fixedContent = fixedContent.replace(/,(\s*[\}\]])/g, '$1');
      appliedFixes.push('Removed trailing commas');
      autoFixApplied = true;
    }
    
    // Auto-fix: Single quotes to double quotes (but preserve apostrophes in values)
    // Skip this for now to avoid corrupting apostrophes like "Devil's Food"
    // Most modern JSON already uses double quotes correctly
    // if (/'([^'\\]*(\\.[^'\\]*)*)'/.test(fixedContent)) {
    //   fixedContent = fixedContent.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
    //   appliedFixes.push('Converted single quotes to double quotes');
    //   autoFixApplied = true;
    // }
    
    // Try parsing the fixed content
    try {
      const parsed = JSON.parse(fixedContent);
      const size = new Blob([content]).size;
      const sizeKB = Math.round(size / 1024);
      const sizeMB = Math.round(size / 1024 / 1024);
      
      let objectCount = 0;
      const countObjects = (obj: any) => {
        if (typeof obj === 'object' && obj !== null) {
          objectCount++;
          if (Array.isArray(obj)) {
            obj.forEach(countObjects);
          } else {
            Object.values(obj).forEach(countObjects);
          }
        }
      };
      countObjects(parsed);
      
      return {
        isValid: true,
        size: size < 1024 * 1024 ? `${sizeKB}KB` : `${sizeMB}MB`,
        type: Array.isArray(parsed) ? 'Array' : 'Object',
        objectCount,
        sizeBytes: size,
        autoFixed: autoFixApplied,
        suggestion: autoFixApplied ? `Fixed automatically: ${appliedFixes.join(', ')}` : undefined,
        fixedContent: autoFixApplied ? fixedContent : undefined
      };
    } catch (error) {
      // Enhanced error analysis
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
      let line: number | undefined;
      let column: number | undefined;
      let position: number | undefined;
      let problemChar = '';
      let suggestion = 'Please check your JSON syntax';
      
      // Extract position information
      const positionMatch = errorMessage.match(/at position (\d+)/);
      const lineMatch = errorMessage.match(/line (\d+)/);
      const columnMatch = errorMessage.match(/column (\d+)/);
      
      if (positionMatch) {
        position = parseInt(positionMatch[1]);
        const lines = content.slice(0, position).split('\n');
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
        
        // Show the problematic character
        if (position < content.length) {
          problemChar = content.charAt(position);
          if (problemChar) {
            suggestion = `Problem character: "${problemChar}" at position ${position}`;
          }
        }
      } else if (lineMatch && columnMatch) {
        line = parseInt(lineMatch[1]);
        column = parseInt(columnMatch[1]);
      }
      
      // Enhanced error messages based on error type
      if (errorMessage.includes('Unexpected end of JSON input')) {
        suggestion = 'Incomplete JSON - missing closing brackets or braces';
      } else if (errorMessage.includes('Unexpected token')) {
        const tokenMatch = errorMessage.match(/Unexpected token (.+?) in JSON/);
        const token = tokenMatch ? tokenMatch[1] : 'unknown';
        if (token === "'") {
          suggestion = 'Use double quotes (") instead of single quotes (\') for strings';
        } else if (token === ',') {
          suggestion = 'Remove trailing commas before closing brackets';
        } else if (token.match(/[a-zA-Z]/)) {
          suggestion = 'Unquoted strings must be wrapped in double quotes';
        }
      } else if (errorMessage.includes('Unexpected non-whitespace character after JSON')) {
        suggestion = 'Multiple JSON objects detected. This might be caused by accidentally duplicating content when pasting. Please check your JSON contains only one complete object or array.';
      }
      
      return {
        isValid: false,
        error: errorMessage,
        suggestion,
        line,
        column,
        position,
        problemChar,
        canAutoFix: false // No auto-fix for multiple objects - user should fix manually
      };
    }
  }, [pastedText]);

  const hasText = pastedText.trim().length > 0;
  const canProcess = hasText && jsonValidation?.isValid;

  // File handling
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setInputMode('file-focused');
      setPastedText(''); // Clear text when file is selected
      jsonViewerActions.setDragover(false);
      await jsonViewerActions.loadJSONFromFile(file);
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
    jsonViewerActions.setDragover(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    jsonViewerActions.setDragover(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    jsonViewerActions.setDragover(false);
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
    e.preventDefault(); // Prevent default paste behavior to avoid duplication
    const text = e.clipboardData.getData('text');
    if (text) {
      setPastedText(text);
      setInputMode('text-focused');
    }
  }, []);

  const handleProcessText = useCallback(async () => {
    if (!pastedText.trim() || !jsonValidation?.isValid) return;

    try {
      // Use the auto-fixed content if available, otherwise use original text
      const contentToProcess = jsonValidation.fixedContent || pastedText;
      await jsonViewerActions.loadJSONFromText(contentToProcess);
      setPastedText('');
      setInputMode('both');
    } catch (error) {
      console.error('JSON processing failed:', error);
    }
  }, [pastedText, jsonValidation]);

  const handleClear = useCallback(() => {
    setPastedText('');
    setInputMode('both');
  }, []);

  const handleAutoFix = useCallback(() => {
    if (!jsonValidation?.canAutoFix) return;
    
    let content = pastedText.trim();
    
    // Apply the same auto-fixes in the correct order
    // 1. Handle multiple JSON objects first
    if (/\}\s*\{/.test(content)) {
      content = '[' + content.replace(/(\}\s*\{)/g, '}, {') + ']';
    }
    
    // 2. Remove trailing commas
    if (/,(\s*[\}\]])/.test(content)) {
      content = content.replace(/,(\s*[\}\]])/g, '$1');
    }
    
    // 3. Convert single quotes to double quotes (but be careful with apostrophes in values)
    // Only convert single quotes that are used as string delimiters, not apostrophes within strings
    if (/'([^'\\]*(\\.[^'\\]*)*)'/.test(content)) {
      // This regex should only match single quotes used as string delimiters
      // Skip this conversion for now since it's causing issues with apostrophes
      // The JSON might already be using double quotes correctly
    }
    
    setPastedText(content);
  }, [pastedText, jsonValidation]);

  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const maxFileSizeMB = Math.round(maxFileSize / 1024 / 1024);

  return (
    <div className={`${className}`}>
      {/* Unified Input Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Load JSON Data</h2>
              <p className="text-sm text-gray-600">Upload a JSON file or paste JSON directly</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div 
            className={`
              relative border-2 border-dashed rounded-lg text-center transition-all duration-200
              ${dragOver ? 'border-green-400 bg-green-50 scale-[1.01]' : 'border-gray-300 hover:border-green-300'}
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
              accept=".json,.jsonl"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isProcessing}
            />

            <div className="py-8">
              <div className="flex justify-center mb-4">
                <svg
                  className={`w-10 h-10 ${dragOver ? 'text-green-500' : 'text-gray-400'}`}
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
                {dragOver ? 'Drop your JSON file here' : 'Drop JSON file or click to browse'}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Supports .json and .jsonl files
              </p>
              
              <div className="inline-flex items-center space-x-3 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-full">
                <span>Max: {maxFileSizeMB}MB</span>
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
            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500">
              <textarea
                value={pastedText}
                onChange={handleTextChange}
                onPaste={handlePaste}
                placeholder={`Paste your JSON data here...\n\nExample:\n{\n  "users": [\n    {"name": "Alice", "age": 30},\n    {"name": "Bob", "age": 25}\n  ]\n}`}
                className="w-full h-40 p-4 text-sm font-mono resize-none border-0 focus:outline-none focus:ring-0 placeholder-gray-400"
                disabled={isProcessing}
              />
              
              {/* Text Status Bar */}
              {hasText && (
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {jsonValidation?.isValid ? (
                      <>
                        <div className="flex items-center text-sm text-green-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {jsonValidation.autoFixed ? 'Fixed & Valid' : 'Valid JSON'} ({jsonValidation.size})
                        </div>
                        <div className="flex items-center text-sm text-blue-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {jsonValidation.type} ({jsonValidation.objectCount} objects)
                        </div>
                        {jsonValidation.autoFixed && (
                          <div className="flex items-center text-sm text-orange-600">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Auto-fixed
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {jsonValidation?.error || 'Invalid JSON'}
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

          {/* Large File Warning */}
          {jsonValidation?.isValid && jsonValidation.sizeBytes > 10 * 1024 * 1024 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-900">Large JSON File Detected</p>
                  <p className="text-sm text-yellow-800">Processing may take a moment. Large files are stored efficiently using browser storage.</p>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <div className="flex-1">
                  <p className="font-medium text-green-900">
                    {status === 'loading' ? 'Loading JSON file...' : 'Processing JSON data...'}
                  </p>
                  <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-green-700 mt-1">{progress}% complete</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Error Display */}
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

          {/* Enhanced JSON Validation Error with suggestions and auto-fix */}
          {!jsonValidation?.isValid && hasText && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-red-700 font-medium">JSON Validation Error</p>
                    <p className="text-sm text-red-600 mt-1">{jsonValidation.suggestion}</p>
                    {jsonValidation.problemChar && (
                      <p className="text-xs text-red-500 mt-2 font-mono bg-red-100 px-2 py-1 rounded">
                        Problem character: "<span className="font-bold text-red-700">{jsonValidation.problemChar}</span>" 
                        {jsonValidation.position && ` at position ${jsonValidation.position}`}
                      </p>
                    )}
                    {jsonValidation.line && jsonValidation.column && (
                      <p className="text-xs text-red-500 mt-1">
                        Location: Line {jsonValidation.line}, Column {jsonValidation.column}
                      </p>
                    )}
                  </div>
                </div>
                {jsonValidation.canAutoFix && (
                  <button
                    onClick={handleAutoFix}
                    className="ml-4 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded border border-blue-600 hover:border-blue-700 transition-colors"
                  >
                    Auto-fix
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Auto-fix notification */}
          {jsonValidation?.autoFixed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">JSON automatically fixed!</p>
                  <p className="text-sm text-green-600 mt-1">{jsonValidation.suggestion}</p>
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
                disabled={!canProcess}
                className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg focus:outline-none focus:ring-4 transform transition-all duration-200 shadow-lg ${
                  canProcess 
                    ? 'text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 active:scale-95 focus:ring-green-300 hover:shadow-xl' 
                    : 'text-gray-500 bg-gray-300 cursor-not-allowed focus:ring-gray-300'
                }`}
              >
                Load JSON
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

export default JSONInput;