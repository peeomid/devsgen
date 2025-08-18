import React, { useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { 
  searchQuery,
  searchType,
  searchPath,
  jsonViewerActions,
  isFiltering
} from '../../stores/jsonViewerStore';

export type SearchType = 'both' | 'properties' | 'values';

export const UnifiedSearchInterface: React.FC = () => {
  const currentQuery = useStore(searchQuery);
  const currentType = useStore(searchType);
  const currentPath = useStore(searchPath);
  const searching = useStore(isFiltering);

  const handleSearchTypeChange = useCallback((type: SearchType) => {
    jsonViewerActions.setSearchType(type);
  }, []);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    jsonViewerActions.setSearchQuery(e.target.value);
  }, []);

  const handlePathChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    jsonViewerActions.setSearchPath(e.target.value);
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuery.trim()) {
      await jsonViewerActions.unifiedSearch();
    }
  }, [currentQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  }, [handleSearch]);

  const handleClearPath = useCallback(() => {
    jsonViewerActions.clearSearchPath();
  }, []);

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
      {/* Search Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search in:
        </label>
        <select
          value={currentType}
          onChange={(e) => handleSearchTypeChange(e.target.value as SearchType)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          disabled={searching}
        >
          <option value="both">Both (Properties & Values)</option>
          <option value="properties">Properties Only</option>
          <option value="values">Values Only</option>
        </select>
      </div>

      {/* Search Input */}
      <div>
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentQuery}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={searching}
            />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
          <button
            type="submit"
            disabled={!currentQuery.trim() || searching}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentQuery.trim() && !searching
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Path Scope (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📂 Scope to path: (optional)
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentPath}
              onChange={handlePathChange}
              placeholder="Click any property in the tree, or type path like batters.batter[].type"
              className="w-full pr-8 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={searching}
            />
            {currentPath && (
              <button
                onClick={handleClearPath}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Clear path scope"
                disabled={searching}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {!currentPath && (
          <div className="mt-1 text-xs text-gray-500">
            💡 Click any property in the tree above to auto-fill the path
          </div>
        )}
      </div>

      {/* Search Examples */}
      {!currentQuery && (
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <div className="font-medium mb-1">Examples:</div>
          <div className="space-y-1">
            <div><span className="font-mono bg-white px-1 rounded">chocolate</span> - Find all values containing "chocolate"</div>
            <div><span className="font-mono bg-white px-1 rounded">type</span> - Find all properties named "type"</div>
            <div><span className="font-mono bg-white px-1 rounded">5001</span> in <span className="font-mono bg-white px-1 rounded">topping[].id</span> - Find "5001" only in topping IDs</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedSearchInterface;