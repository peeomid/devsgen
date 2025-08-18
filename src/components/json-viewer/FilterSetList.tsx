import React from 'react';
import { useStore } from '@nanostores/react';
import { activeFilterSets, jsonViewerActions } from '../../stores/jsonViewerStore';

export const FilterSetList: React.FC = () => {
  const filterSets = useStore(activeFilterSets);
  const filterList = Object.values(filterSets);

  return (
    <div className="space-y-3">
      {/* Add Filter Button */}
      <button
        type="button"
        onClick={() => jsonViewerActions.openFilterDialog()}
        className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Filter
      </button>

      {/* Filter List */}
      {filterList.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No filters active
        </div>
      ) : (
        <div className="space-y-2">
          {filterList.map(filter => (
            <div
              key={filter.id}
              className={`flex items-center justify-between p-2 rounded-md border ${
                filter.active 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="text-lg">
                  {filter.type === 'path' ? '📍' : '🔍'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {filter.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {filter.values.length} value{filter.values.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => jsonViewerActions.toggleFilterSet(filter.id)}
                  className={`p-1 rounded ${
                    filter.active
                      ? 'text-green-600 hover:text-green-800'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={filter.active ? 'Disable filter' : 'Enable filter'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  onClick={() => jsonViewerActions.removeFilterSet(filter.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                  title="Remove filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterSetList;