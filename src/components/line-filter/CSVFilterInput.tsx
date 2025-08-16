import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { lineFilterActions, activeFilters, dataType, csvHeaders, canFilter } from '../../stores/lineFilterStore';
import type { CSVFilter } from '../../types/filters';
import { PatternTagInput, type Pattern } from './PatternTagInput';

export interface CSVFilterInputProps {
  className?: string;
  onFilterAdded?: (filter: CSVFilter) => void;
  editingFilterId?: string | null;
  onEditComplete?: () => void;
}

export const CSVFilterInput: React.FC<CSVFilterInputProps> = ({ 
  className = '',
  onFilterAdded,
  editingFilterId,
  onEditComplete
}) => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [filterType, setFilterType] = useState<'include' | 'exclude'>('include');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [scope, setScope] = useState<'all' | 'column'>('all');
  const [selectedColumn, setSelectedColumn] = useState<number>(-1);
  const [validationError, setValidationError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const currentDataType = useStore(dataType);
  const currentCanFilter = useStore(canFilter);
  const headers = useStore(csvHeaders);
  const filters = useStore(activeFilters);

  // Load filter data when editing
  useEffect(() => {
    if (editingFilterId) {
      const filterToEdit = filters[editingFilterId] as CSVFilter;
      if (filterToEdit && 'scope' in filterToEdit) {
        // Convert single pattern to pattern array for backward compatibility
        const filterPatterns = Array.isArray(filterToEdit.patterns) 
          ? filterToEdit.patterns.map((p, index) => ({
              id: `pattern_${index}_${Date.now()}`,
              value: p,
              isValid: true
            }))
          : [{
              id: `pattern_0_${Date.now()}`,
              value: filterToEdit.pattern,
              isValid: true
            }];
        
        setPatterns(filterPatterns);
        setFilterType(filterToEdit.type);
        setCaseSensitive(filterToEdit.caseSensitive);
        setUseRegex(filterToEdit.useRegex);
        setScope(filterToEdit.scope);
        setSelectedColumn(filterToEdit.columnIndex || -1);
        setIsEditMode(true);
        setValidationError('');
      }
    } else {
      setIsEditMode(false);
    }
  }, [editingFilterId, filters]);

  const columnOptions = useMemo(() => {
    return headers.map((header, index) => ({
      index,
      name: header || `Column ${index + 1}`,
      displayName: header ? `${header} (${index + 1})` : `Column ${index + 1}`
    }));
  }, [headers]);

  const validatePattern = useCallback((value: string): { isValid: boolean; error?: string } => {
    if (!value.trim()) {
      return { isValid: false, error: 'Pattern cannot be empty' };
    }

    if (useRegex) {
      try {
        new RegExp(value);
      } catch (error) {
        return { isValid: false, error: `Invalid regex: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }

    return { isValid: true };
  }, [useRegex]);

  const handlePatternsChange = useCallback((newPatterns: Pattern[]) => {
    setPatterns(newPatterns);
    setValidationError('');
  }, []);

  const handleScopeChange = useCallback((newScope: 'all' | 'column') => {
    setScope(newScope);
    if (newScope === 'all') {
      setSelectedColumn(-1);
    } else if (columnOptions.length > 0 && selectedColumn === -1) {
      setSelectedColumn(0);
    }
  }, [columnOptions.length, selectedColumn]);

  const generateFilterId = useCallback((): string => {
    return `csvfilter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleAddFilter = useCallback(async () => {
    if (patterns.length === 0 || !currentCanFilter) return;
    if (scope === 'column' && (selectedColumn === -1 || selectedColumn >= headers.length)) return;

    // Validate all patterns
    const hasInvalidPatterns = patterns.some(p => !p.isValid);
    if (hasInvalidPatterns) {
      setValidationError('Please fix invalid patterns before adding filter');
      return;
    }

    const patternValues = patterns.map(p => p.value);

    if (isEditMode && editingFilterId) {
      // Update existing filter
      const updates: Partial<CSVFilter> = {
        patterns: patternValues,
        pattern: patternValues[0], // Keep backward compatibility
        type: filterType,
        caseSensitive,
        useRegex,
        scope,
        columnIndex: scope === 'column' ? selectedColumn : undefined,
        columnName: scope === 'column' ? headers[selectedColumn] : undefined
      };

      try {
        lineFilterActions.updateFilter(editingFilterId, updates);
        // Re-apply the filter with new settings
        await lineFilterActions.applyFilter(editingFilterId);
        
        // Reset form and exit edit mode
        setPatterns([]);
        setValidationError('');
        setIsEditMode(false);
        onEditComplete?.();
      } catch (error) {
        console.error('Failed to update filter:', error);
        setValidationError('Failed to update filter. Please try again.');
      }
    } else {
      // Add new filter
      const filter: CSVFilter = {
        id: generateFilterId(),
        patterns: patternValues,
        pattern: patternValues[0], // Keep backward compatibility
        type: filterType,
        caseSensitive,
        useRegex,
        scope,
        columnIndex: scope === 'column' ? selectedColumn : undefined,
        columnName: scope === 'column' ? headers[selectedColumn] : undefined,
        isActive: true,
        created: new Date()
      };

      try {
        await lineFilterActions.addFilter(filter);
        onFilterAdded?.(filter);

        // Reset form only if filter was successfully added
        setPatterns([]);
        setValidationError('');
      } catch (error) {
        console.error('Failed to add filter:', error);
        setValidationError('Failed to add filter. Please try again.');
      }
    }
  }, [patterns, filterType, caseSensitive, useRegex, scope, selectedColumn, headers, currentCanFilter, generateFilterId, onFilterAdded, isEditMode, editingFilterId, onEditComplete]);


  if (currentDataType !== 'csv') {
    return null;
  }

  const activeFilterCount = Object.keys(filters).length;
  const canSubmit = patterns.length > 0 && patterns.every(p => p.isValid) && currentCanFilter && 
    (scope === 'all' || (scope === 'column' && selectedColumn >= 0));

  const handleCancelEdit = useCallback(() => {
    setPatterns([]);
    setValidationError('');
    setScope('all');
    setSelectedColumn(-1);
    setIsEditMode(false);
    onEditComplete?.();
  }, [onEditComplete]);

  return (
    <div className={`${className}`}>
      {/* Pattern Tag Input */}
      <div className="mb-2">
        <PatternTagInput
          patterns={patterns}
          onPatternsChange={handlePatternsChange}
          onAddFilter={handleAddFilter}
          placeholder="CSV filter pattern..."
          disabled={!currentCanFilter}
          className=""
        />
      </div>

      {/* Filter Options */}
      <div className="flex items-center space-x-2">

        {/* Type Toggle */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'include' | 'exclude')}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          disabled={!currentCanFilter}
        >
          <option value="include">Include</option>
          <option value="exclude">Exclude</option>
        </select>

        {/* Column Scope */}
        <select
          value={scope === 'column' ? selectedColumn : 'all'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'all') {
              setScope('all');
              setSelectedColumn(-1);
            } else {
              setScope('column');
              setSelectedColumn(parseInt(value));
            }
          }}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          disabled={!currentCanFilter}
        >
          <option value="all">All columns</option>
          {headers.map((header, index) => (
            <option key={index} value={index}>
              {header || `Column ${index + 1}`}
            </option>
          ))}
        </select>

        {/* Options */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`px-1.5 py-1 text-xs rounded ${
              caseSensitive 
                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
            title="Case sensitive"
            disabled={!currentCanFilter}
          >
            Aa
          </button>
          <button
            type="button"
            onClick={() => setUseRegex(!useRegex)}
            className={`px-1.5 py-1 text-xs rounded ${
              useRegex 
                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
            title="Use regex"
            disabled={!currentCanFilter}
          >
            .*
          </button>
        </div>

        {/* Add/Update Button */}
        <button
          type="button"
          onClick={handleAddFilter}
          disabled={!canSubmit}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEditMode ? 'Update Filter' : 'Add Filter'}
        </button>

        {isEditMode && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-2 py-1.5 bg-gray-500 text-white text-xs font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mt-2">
          <p className="text-xs text-red-600">{validationError}</p>
        </div>
      )}
    </div>
  );
};

export default CSVFilterInput;