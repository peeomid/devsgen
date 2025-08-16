import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { filterResults, dataType, csvHeaders, currentPage, pageSize, lineFilterActions, lineCount, activeFilters } from '../../stores/lineFilterStore';
import { databaseService } from '../../services/DatabaseService';
import type { CSVLine } from '../../types/database';

export interface CSVResultsProps {
  className?: string;
}

export const CSVResults: React.FC<CSVResultsProps> = ({ className = '' }) => {
  const [displayLines, setDisplayLines] = useState<CSVLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const results = useStore(filterResults);
  const currentDataType = useStore(dataType);
  const headers = useStore(csvHeaders);
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
    if (currentDataType !== 'csv' || currentPageLineNumbers.length === 0) {
      setDisplayLines([]);
      return;
    }

    const loadLines = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const lines = await databaseService.getLinesByNumbers(currentPageLineNumbers, 'csv') as CSVLine[];
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
      const allLines = await databaseService.getLinesByNumbers(matchedLineNumbers, 'csv') as CSVLine[];
      const sortedLines = allLines.sort((a, b) => a.lineNumber - b.lineNumber);
      
      // Create CSV content with headers
      let csvContent = '';
      if (headers.length > 0) {
        csvContent += headers.join(',') + '\n';
      }
      csvContent += sortedLines.map(line => line.originalContent).join('\n');
      
      await navigator.clipboard.writeText(csvContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy results:', err);
    }
  }, [matchedLineNumbers, headers]);

  // Show all columns with horizontal scrolling
  const displayHeaders = headers;
  const hasMoreColumns = false;

  const startEditing = useCallback((cellId: string) => {
    setEditingCell(cellId);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleCellClick = useCallback((cellId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingCell !== cellId) {
      setEditingCell(cellId);
    }
  }, [editingCell]);

  const handleTextareaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleOutsideClick = useCallback(() => {
    if (editingCell) {
      setEditingCell(null);
    }
  }, [editingCell]);

  if (currentDataType !== 'csv') {
    return null;
  }

  if (totalResults === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
            CSV Results ({totalResults.toLocaleString()} rows)
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
              {copySuccess ? 'Copied!' : 'Copy CSV'}
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

        {/* Results Table */}
        {!isLoading && !error && displayLines.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-xs text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, totalResults)} of {totalResults.toLocaleString()} results
                {headers.length > 1 && ` (${headers.length} columns)`}
              </p>
            </div>
            
            <div className="overflow-x-auto max-h-[32rem] overflow-y-auto" onClick={handleOutsideClick}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {/* Line Number Column */}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Line
                    </th>
                    
                    {/* Data Columns */}
                    {displayHeaders.map((header, index) => (
                      <th
                        key={index}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                      >
                        <div className="truncate max-w-32" title={header || `Column ${index + 1}`}>
                          {header || `Column ${index + 1}`}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayLines.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      {/* Line Number */}
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 font-mono border-r border-gray-200">
                        {line.lineNumber}
                      </td>
                      
                      {/* Data Cells */}
                      {displayHeaders.map((_, index) => {
                        const cellValue = line.data[index] || '';
                        const cellId = `${line.id}-${index}`;
                        const isEditing = editingCell === cellId;
                        
                        return (
                          <td
                            key={index}
                            className={`px-3 py-2 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 ${isEditing ? 'bg-blue-50' : ''}`}
                            onClick={(e) => handleCellClick(cellId, e)}
                          >
                            {isEditing ? (
                              /* Textarea Mode */
                              <textarea
                                value={cellValue}
                                readOnly
                                onClick={handleTextareaClick}
                                className="w-full h-16 p-2 text-xs font-mono border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                              />
                            ) : (
                              /* Normal Display Mode - Click to edit */
                              <div className="max-w-32 truncate cursor-pointer hover:bg-gray-50 rounded p-1 -m-1" title={cellValue}>
                                {cellValue}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
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

export default CSVResults;