import React, { useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { lineFilterActions, activeFilters, filterResults, isFiltering } from '../../stores/lineFilterStore';
import type { TextFilter, CSVFilter } from '../../types/filters';

export interface FilterListProps {
  className?: string;
  onFilterEdit?: (filterId: string) => void;
}

export const FilterList: React.FC<FilterListProps> = ({ 
  className = '',
  onFilterEdit 
}) => {
  const filters = useStore(activeFilters);
  const results = useStore(filterResults);
  const currentlyFiltering = useStore(isFiltering);

  const filterArray = Object.values(filters);

  const handleToggleFilter = useCallback((filterId: string) => {
    lineFilterActions.toggleFilter(filterId);
  }, []);

  const handleRemoveFilter = useCallback((filterId: string) => {
    lineFilterActions.removeFilter(filterId);
  }, []);

  const handleApplyFilter = useCallback(async (filterId: string) => {
    try {
      await lineFilterActions.applyFilter(filterId);
    } catch (error) {
      console.error('Failed to apply filter:', error);
    }
  }, []);

  const handleApplyAllFilters = useCallback(async () => {
    try {
      await lineFilterActions.applyAllActiveFilters();
    } catch (error) {
      console.error('Failed to apply filters:', error);
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    lineFilterActions.clearFilters();
  }, []);

  const getFilterDisplayName = (filter: TextFilter | CSVFilter): string => {
    // Handle multiple patterns (OR logic)
    const patterns = filter.patterns && filter.patterns.length > 0 ? filter.patterns : [filter.pattern];
    
    if (patterns.length === 1) {
      // Single pattern - show normally
      return patterns[0];
    } else {
      // Multiple patterns - show all with OR
      return patterns.join(' OR ');
    }
  };

  const getFilterTooltip = (filter: TextFilter | CSVFilter): string => {
    // Build tooltip with context info (not patterns since they're now visible)
    const type = filter.type.charAt(0).toUpperCase() + filter.type.slice(1);
    
    let scope = 'All columns';
    if ('scope' in filter && filter.scope === 'column') {
      scope = filter.columnName || `Column ${(filter.columnIndex || 0) + 1}`;
    }
    
    const options = [];
    if (filter.caseSensitive) options.push('Case sensitive');
    if (filter.useRegex) options.push('Regex');
    
    let tooltip = `${type} in ${scope}`;
    if (options.length > 0) {
      tooltip += ` • ${options.join(', ')}`;
    }
    
    return tooltip;
  };

  if (filterArray.length === 0) {
    return null;
  }

  const activeCount = filterArray.filter(f => f.isActive).length;

  return (
    <div className={`${className}`}>
      {/* Compact Horizontal Filter Display */}
      <div className="flex items-center space-x-3">
        {/* Filter Count and Actions */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            {activeCount > 0 ? `${activeCount} Active` : 'No Filters'}
          </span>
          
          {activeCount > 0 && (
            <>
              <button
                type="button"
                onClick={handleApplyAllFilters}
                disabled={currentlyFiltering}
                className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear
              </button>
            </>
          )}
        </div>

        {/* Compact Filter Tags */}
        {filterArray.length > 0 && (
          <div className="flex items-center flex-wrap gap-2">
            {filterArray.map((filter) => {
              const result = results[filter.id];
              
              return (
                <div
                  key={filter.id}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                    filter.isActive 
                      ? 'bg-blue-100 border-blue-300 text-blue-800' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filter.isActive}
                    onChange={() => handleToggleFilter(filter.id)}
                    className="w-3 h-3 rounded"
                  />
                  <span className="truncate max-w-32" title={getFilterTooltip(filter)}>
                    {getFilterDisplayName(filter)}
                  </span>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center space-x-0.5">
                    {onFilterEdit && (
                      <button
                        type="button"
                        onClick={() => onFilterEdit(filter.id)}
                        className="p-0.5 hover:bg-white hover:bg-opacity-50 rounded"
                        title="Edit filter"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFilter(filter.id)}
                      className="p-0.5 hover:bg-red-200 hover:text-red-800 rounded"
                      title="Remove filter"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Processing Indicator */}
        {currentlyFiltering && (
          <div className="inline-flex items-center space-x-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span>Applying...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterList;