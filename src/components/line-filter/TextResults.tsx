import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { filterResults, dataType, currentPage, pageSize, lineFilterActions, lineCount, activeFilters } from '../../stores/lineFilterStore';
import { databaseService } from '../../services/DatabaseService';
import type { Line } from '../../types/database';

export interface TextResultsProps {
  className?: string;
}

export const TextResults: React.FC<TextResultsProps> = ({ className = '' }) => {
  const [displayLines, setDisplayLines] = useState<Line[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [editingLine, setEditingLine] = useState<string | null>(null);

  const results = useStore(filterResults);
  const currentDataType = useStore(dataType);
  const page = useStore(currentPage);
  const size = useStore(pageSize);
  const totalLines = useStore(lineCount);
  const filters = useStore(activeFilters);

  // Get all matched line numbers from active filters, or all lines if no filters
  const matchedLineNumbers = useMemo(() => {
    const hasActiveFilters = Object.keys(filters).length > 0;
    
    if (!hasActiveFilters) {
      // Show all lines when no filters are active
      return Array.from({ length: totalLines }, (_, i) => i + 1);
    }
    
    // Show filtered results when filters are active - intersection (AND logic)
    const activeFilterResults = Object.values(filters)
      .filter(filter => filter.isActive)
      .map(filter => results[filter.id])
      .filter(result => result !== undefined);
    
    if (activeFilterResults.length === 0) {
      return [];
    }
    
    // Start with the first filter's matches
    let intersection = new Set(activeFilterResults[0].matchedLines);
    
    // Intersect with all other active filters
    for (let i = 1; i < activeFilterResults.length; i++) {
      const currentMatches = new Set(activeFilterResults[i].matchedLines);
      intersection = new Set([...intersection].filter(lineNum => currentMatches.has(lineNum)));
    }
    
    return Array.from(intersection).sort((a, b) => a - b);
  }, [results, filters, totalLines]);

  const totalResults = matchedLineNumbers.length;
  const totalPages = Math.ceil(totalResults / size);
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;
  
  // Memoize the page line numbers to prevent infinite re-renders
  const currentPageLineNumbers = useMemo(() => {
    return matchedLineNumbers.slice(startIndex, endIndex);
  }, [matchedLineNumbers, startIndex, endIndex]);

  // Load lines for current page
  useEffect(() => {
    if (currentDataType !== 'text' || currentPageLineNumbers.length === 0) {
      setDisplayLines([]);
      return;
    }

    const loadLines = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const lines = await databaseService.getLinesByNumbers(currentPageLineNumbers, 'text') as Line[];
        // Sort by line number to maintain order
        const sortedLines = lines.sort((a, b) => a.lineNumber - b.lineNumber);
        setDisplayLines(sortedLines);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lines';
        setError(errorMessage);
        setDisplayLines([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLines();
  }, [currentDataType, currentPageLineNumbers]);

  const handleCopyResults = useCallback(async () => {
    try {
      const allLines = await databaseService.getLinesByNumbers(matchedLineNumbers, 'text') as Line[];
      const sortedLines = allLines.sort((a, b) => a.lineNumber - b.lineNumber);
      const text = sortedLines.map(line => line.content).join('\n');
      
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy results:', err);
    }
  }, [matchedLineNumbers]);

  const highlightMatches = useCallback((text: string): string => {
    // Simple highlighting - could be enhanced with actual filter patterns
    return text;
  }, []);

  const startEditing = useCallback((lineId: string) => {
    setEditingLine(lineId);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingLine(null);
  }, []);

  const handleRowClick = useCallback((lineId: string) => {
    if (editingLine !== lineId) {
      setEditingLine(lineId);
    }
  }, [editingLine]);

  const handleTextareaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking textarea
  }, []);

  const handleOutsideClick = useCallback((e: React.MouseEvent) => {
    if (editingLine) {
      setEditingLine(null);
    }
  }, [editingLine]);

  if (currentDataType !== 'text') {
    return null;
  }

  if (totalResults === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No results found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Results ({totalResults.toLocaleString()} lines)
          </h3>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyResults}
              data-copy-results
              className="
                px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded
                hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500
              "
            >
              {copySuccess ? 'Copied!' : 'Copy All'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              <span>Loading results...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && displayLines.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, totalResults)} of {totalResults.toLocaleString()} results
              </p>
            </div>
            
            <div className="max-h-[32rem] overflow-y-auto" onClick={handleOutsideClick}>
              {displayLines.map((line) => (
                <div
                  key={line.id}
                  className={`flex border-b border-gray-100 ${editingLine === line.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => handleRowClick(line.id)}
                >
                  {/* Line Number */}
                  <div className="flex-shrink-0 w-16 px-3 py-2 bg-gray-50 border-r border-gray-200 text-xs text-gray-500 text-right font-mono">
                    {line.lineNumber}
                  </div>
                  
                  {/* Line Content */}
                  <div className="flex-1 px-3 py-2 text-sm font-mono">
                    {editingLine === line.id ? (
                      /* Textarea Mode */
                      <textarea
                        value={line.content}
                        readOnly
                        onClick={handleTextareaClick}
                        className="w-full h-24 p-2 text-sm font-mono border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                      />
                    ) : (
                      /* Normal Display Mode - Click to edit */
                      <pre className="whitespace-pre-wrap break-words max-h-20 overflow-hidden cursor-pointer hover:bg-gray-50 rounded p-1 -m-1">
                        {highlightMatches(line.content)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => lineFilterActions.setPage(page - 1)}
                disabled={page <= 1}
                className="
                  px-3 py-1 border border-gray-300 text-sm rounded
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => lineFilterActions.setPage(page + 1)}
                disabled={page >= totalPages}
                className="
                  px-3 py-1 border border-gray-300 text-sm rounded
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextResults;