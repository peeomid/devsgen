import React from 'react';
import { useStore } from '@nanostores/react';
import type { Pattern } from '../../types/pattern';
import { 
  toggleCommandPalette,
  isPatternModifiedStore,
  resetCustomRegex
} from '../../stores/patternStore';

interface PatternSelectorBarProps {
  pattern: Pattern | null;
}

export default function PatternSelectorBar({ pattern }: PatternSelectorBarProps) {
  const isPatternModified = useStore(isPatternModifiedStore);

  const handleEdit = () => {
    // Focus the search input in RegexEditor
    const searchInput = document.getElementById('regex-search-input');
    if (searchInput) {
      searchInput.focus();
    }
  };

  const handleReset = () => {
    resetCustomRegex();
  };

  const renderPatternState = () => {
    if (!pattern) {
      return (
        <div className="flex items-center" data-testid="pattern-selector-empty">
          <span className="text-gray-500">No pattern selected</span>
        </div>
      );
    }

    if (isPatternModified) {
      return (
        <div className="flex items-center" data-testid="pattern-selector-modified">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-orange-700 font-medium">
            Custom Regex
          </span>
          <span className="text-gray-500 ml-1">
            (based on <span data-testid="pattern-base-name">{pattern.name}</span>)
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center" data-testid="pattern-selector-active">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-gray-900 font-medium" data-testid="pattern-name">{pattern.name}</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800 ml-2" data-testid="pattern-key">
          {pattern.keyNumber}
        </span>
      </div>
    );
  };

  const renderActions = () => {
    const findButton = (
      <button 
        onClick={() => toggleCommandPalette()}
        className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium flex items-center"
        title="Find pattern"
        data-testid="find-pattern-button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Find
        <span className="ml-2 text-xs opacity-75">⌘K</span>
      </button>
    );

    if (!pattern) {
      return <div className="flex gap-2">{findButton}</div>;
    }

    if (isPatternModified) {
      return (
        <div className="flex gap-2">
          {findButton}
          <button 
            onClick={handleReset}
            className="bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-1 rounded-md text-sm font-medium flex items-center"
            title="Reset to original pattern"
            data-testid="reset-pattern-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        {findButton}
        <button 
          onClick={handleEdit}
          className="bg-orange-50 text-orange-700 hover:bg-orange-100 px-3 py-1 rounded-md text-sm font-medium flex items-center"
          title="Edit pattern"
          data-testid="edit-pattern-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
          <span className="ml-2 text-xs opacity-75">⌘E</span>
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
      <div className="flex justify-between items-center">
        {renderPatternState()}
        {renderActions()}
      </div>
    </div>
  );
}