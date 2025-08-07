import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import type { Pattern } from '../../types/pattern';
import { 
  customRegexStore,
  isPatternModifiedStore,
  setCustomRegex
} from '../../stores/patternStore';

interface RegexEditorProps {
  pattern: Pattern | null;
}

export default function RegexEditor({ pattern }: RegexEditorProps) {
  const customRegex = useStore(customRegexStore);
  const isPatternModified = useStore(isPatternModifiedStore);
  
  const [searchRegex, setSearchRegex] = useState('');
  const [replaceRegex, setReplaceRegex] = useState('');
  const [flags, setFlags] = useState('');
  const [validationError, setValidationError] = useState('');

  // Update local state when pattern or custom regex changes
  useEffect(() => {
    if (isPatternModified && customRegex.searchRegex) {
      // Use custom regex
      setSearchRegex(customRegex.searchRegex);
      setReplaceRegex(customRegex.replaceRegex);
      setFlags(customRegex.flags || '');
    } else if (pattern) {
      // Use pattern regex
      setSearchRegex(pattern.searchRegex);
      setReplaceRegex(pattern.replaceRegex);
      setFlags(pattern.flags || '');
    } else {
      // Empty state
      setSearchRegex('');
      setReplaceRegex('');
      setFlags('');
    }
    setValidationError('');
  }, [pattern, customRegex, isPatternModified]);

  // Validate regex syntax
  const validateRegex = (regex: string): string | null => {
    if (!regex.trim()) return null;
    try {
      new RegExp(regex);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid regex';
    }
  };

  // Handle regex changes with validation
  const handleSearchChange = (value: string) => {
    setSearchRegex(value);
    const error = validateRegex(value);
    setValidationError(error || '');
    
    // Update custom regex if we have a pattern and user is editing
    if (pattern && value !== pattern.searchRegex) {
      setCustomRegex(value, replaceRegex, flags || undefined);
    }
  };

  const handleReplaceChange = (value: string) => {
    setReplaceRegex(value);
    
    // Update custom regex if we have a pattern and user is editing
    if (pattern && (searchRegex !== pattern.searchRegex || value !== pattern.replaceRegex)) {
      setCustomRegex(searchRegex, value, flags || undefined);
    }
  };

  const handleFlagsChange = (value: string) => {
    setFlags(value);
    
    // Update custom regex if we have a pattern and user is editing
    if (pattern && (searchRegex !== pattern.searchRegex || replaceRegex !== pattern.replaceRegex || value !== (pattern.flags || ''))) {
      setCustomRegex(searchRegex, replaceRegex, value || undefined);
    }
  };

  const isEmpty = !pattern && !searchRegex && !replaceRegex && !flags;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="space-y-4">
        {/* Search Regex */}
        <div>
          <label htmlFor="regex-search-input" className="block text-sm font-medium text-gray-700 mb-2">
            Search Regex
          </label>
          <input
            id="regex-search-input"
            type="text"
            value={searchRegex}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={`w-full p-3 border rounded-md font-mono text-sm ${
              validationError 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Enter search regex pattern..."
            data-testid="search-regex-input"
          />
        </div>

        {/* Replace Pattern */}
        <div>
          <label htmlFor="regex-replace-input" className="block text-sm font-medium text-gray-700 mb-2">
            Replace Pattern
          </label>
          <input
            id="regex-replace-input"
            type="text"
            value={replaceRegex}
            onChange={(e) => handleReplaceChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter replacement pattern..."
            data-testid="replace-regex-input"
          />
        </div>

        {/* Flags */}
        <div>
          <label htmlFor="regex-flags-input" className="block text-sm font-medium text-gray-700 mb-2">
            Flags (optional)
          </label>
          <input
            id="regex-flags-input"
            type="text"
            value={flags}
            onChange={(e) => handleFlagsChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., g, i, m"
            data-testid="regex-flags-input"
          />
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        )}

        {/* Empty state message */}
        {isEmpty && (
          <div className="text-center py-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm">
              Select a pattern or enter custom regex above
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Use ⌘K to find patterns
            </p>
          </div>
        )}
      </div>
    </div>
  );
}