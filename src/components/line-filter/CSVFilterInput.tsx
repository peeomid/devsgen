import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { lineFilterActions, activeFilters, dataType, csvHeaders, canFilter } from '../../stores/lineFilterStore';
import type { CSVFilter } from '../../types/filters';

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
  const [pattern, setPattern] = useState('');
  const [filterType, setFilterType] = useState<'include' | 'exclude'>('include');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [scope, setScope] = useState<'all' | 'column'>('all');
  const [selectedColumn, setSelectedColumn] = useState<number>(-1);
  const [isValid, setIsValid] = useState(true);
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
        setPattern(filterToEdit.pattern);
        setFilterType(filterToEdit.type);
        setCaseSensitive(filterToEdit.caseSensitive);
        setUseRegex(filterToEdit.useRegex);
        setScope(filterToEdit.scope);
        setSelectedColumn(filterToEdit.columnIndex || -1);
        setIsEditMode(true);
        setIsValid(true);
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

  const validatePattern = useCallback((value: string, regex: boolean): boolean => {
    if (!value.trim()) {
      setValidationError('Pattern cannot be empty');
      return false;
    }

    if (regex) {
      try {
        new RegExp(value);
      } catch (error) {
        setValidationError(`Invalid regex: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
      }
    }

    setValidationError('');
    return true;
  }, []);

  const handlePatternChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPattern(value);
    const valid = validatePattern(value, useRegex);
    setIsValid(valid);
  }, [useRegex, validatePattern]);

  const handleRegexToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const regex = e.target.checked;
    setUseRegex(regex);
    const valid = validatePattern(pattern, regex);
    setIsValid(valid);
  }, [pattern, validatePattern]);

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
    if (!pattern.trim() || !isValid || !currentCanFilter) return;
    if (scope === 'column' && (selectedColumn === -1 || selectedColumn >= headers.length)) return;

    if (isEditMode && editingFilterId) {
      // Update existing filter
      const updates: Partial<CSVFilter> = {
        pattern: pattern.trim(),
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
        setPattern('');
        setIsValid(true);
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
        pattern: pattern.trim(),
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
        setPattern('');
        setIsValid(true);
        setValidationError('');
      } catch (error) {
        console.error('Failed to add filter:', error);
        setValidationError('Failed to add filter. Please try again.');
      }
    }
  }, [pattern, filterType, caseSensitive, useRegex, scope, selectedColumn, headers, isValid, currentCanFilter, generateFilterId, onFilterAdded, isEditMode, editingFilterId, onEditComplete]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFilter();
    }
  }, [handleAddFilter]);

  if (currentDataType !== 'csv') {
    return null;
  }

  const activeFilterCount = Object.keys(filters).length;
  const canSubmit = pattern.trim() && isValid && currentCanFilter && 
    (scope === 'all' || (scope === 'column' && selectedColumn >= 0));

  const handleCancelEdit = useCallback(() => {
    setPattern('');
    setIsValid(true);
    setValidationError('');
    setScope('all');
    setSelectedColumn(-1);
    setIsEditMode(false);
    onEditComplete?.();
  }, [onEditComplete]);

  return (
    <div className={`${className}`}>
      {/* Compact Single-Line Filter Input */}
      <div className="flex items-center space-x-2">
        {/* Pattern Input - Primary */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={pattern}
            onChange={handlePatternChange}
            onKeyDown={handleKeyPress}
            placeholder="Filter pattern..."
            className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 ${
              !isValid 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            disabled={!currentCanFilter}
          />
        </div>

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
          disabled={!isValid || !pattern.trim() || !currentCanFilter}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEditMode ? 'Update' : 'Add'}
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