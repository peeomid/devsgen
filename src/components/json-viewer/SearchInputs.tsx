import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { 
  searchTerm, 
  selectedPath,
  jsonViewerActions,
  parsedJSON
} from '../../stores/jsonViewerStore';

export const SearchInputs: React.FC = () => {
  const currentSearchTerm = useStore(searchTerm);
  const currentSelectedPath = useStore(selectedPath);
  const data = useStore(parsedJSON);
  
  const [valueSearchInput, setValueSearchInput] = useState('');
  const [pathSearchInput, setPathSearchInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Smart placeholder examples that rotate every 3 seconds
  const getSmartPlaceholders = useCallback(() => {
    if (!data) return ['user.name', 'items[0].title', 'settings.theme'];
    
    const suggestions: string[] = [];
    
    const traverse = (obj: any, path: string = '') => {
      if (suggestions.length >= 6) return; // Limit suggestions
      
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          if (obj.length > 0 && path) {
            suggestions.push(`${path}[0]`);
            traverse(obj[0], `${path}[0]`);
          }
        } else {
          Object.keys(obj).slice(0, 3).forEach(key => {
            const newPath = path ? `${path}.${key}` : key;
            suggestions.push(newPath);
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              traverse(obj[key], newPath);
            }
          });
        }
      }
    };
    
    traverse(data);
    return suggestions.length > 0 ? suggestions : ['user.name', 'items[0].title', 'settings.theme'];
  }, [data]);

  const smartPlaceholders = useMemo(() => getSmartPlaceholders(), [data]);

  // Rotate placeholder every 3 seconds
  useEffect(() => {
    if (smartPlaceholders.length === 0) return;
    
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % smartPlaceholders.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [smartPlaceholders.length]);

  // Update path input when a path is selected from the tree
  useEffect(() => {
    if (currentSelectedPath) {
      setPathSearchInput(currentSelectedPath);
    }
  }, [currentSelectedPath]);

  const handleValueSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (valueSearchInput.trim()) {
      try {
        await jsonViewerActions.searchByValue(valueSearchInput.trim());
      } catch (error) {
        console.error('Value search failed:', error);
      }
    }
  }, [valueSearchInput]);

  const handlePathSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (pathSearchInput.trim()) {
      try {
        await jsonViewerActions.searchByPath(pathSearchInput.trim());
      } catch (error) {
        console.error('Path search failed:', error);
      }
    }
  }, [pathSearchInput]);

  const handleValueInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValueSearch(e);
    }
  }, [handleValueSearch]);

  const handlePathInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePathSearch(e);
    }
  }, [handlePathSearch]);

  return (
    <div className="space-y-4">
      {/* Search Values */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Values
        </label>
        <form onSubmit={handleValueSearch} className="flex items-center space-x-2">
          <input
            type="text"
            value={valueSearchInput}
            onChange={(e) => setValueSearchInput(e.target.value)}
            onKeyDown={handleValueInputKeyDown}
            placeholder="Enter value to search for..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            title="Search values"
          >
            🔍
          </button>
        </form>
      </div>

      {/* Search Path */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Path
        </label>
        <form onSubmit={handlePathSearch} className="flex items-center space-x-2">
          <input
            type="text"
            value={pathSearchInput}
            onChange={(e) => setPathSearchInput(e.target.value)}
            onKeyDown={handlePathInputKeyDown}
            placeholder={`Click any property above, or try: ${smartPlaceholders[placeholderIndex] || 'user.name'}`}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            title="Search path"
          >
            🔍
          </button>
        </form>
        <div className="mt-1 text-xs text-gray-500">
          💡 Click any property above
        </div>
      </div>
    </div>
  );
};

export default SearchInputs;