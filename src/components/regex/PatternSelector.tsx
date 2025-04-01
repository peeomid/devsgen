import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { patternsStore, selectedPatternIdStore, selectPattern } from '../../stores/patternStore';
import type { Pattern } from '../../types/pattern';
import { PatternCategory } from '../../types/pattern';

export default function PatternSelector() {
  const patterns = useStore(patternsStore);
  const selectedPatternId = useStore(selectedPatternIdStore);
  const [activeCategory, setActiveCategory] = useState<PatternCategory | 'all'>('all');
  const [filteredPatterns, setFilteredPatterns] = useState<Pattern[]>([]);
  
  // Group patterns by category
  const patternsByCategory = patterns.reduce((acc, pattern) => {
    const category = pattern.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(pattern);
    return acc;
  }, {} as Record<string, Pattern[]>);
  
  // Get unique categories
  const categories = Object.keys(patternsByCategory).sort();
  
  // Filter patterns by category
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredPatterns(patterns);
    } else {
      setFilteredPatterns(patterns.filter(p => p.category === activeCategory));
    }
  }, [patterns, activeCategory]);
  
  // Get selected pattern
  const selectedPattern = patterns.find(p => p.id === selectedPatternId);
  
  return (
    <div className="bg-white rounded-md border border-gray-300 overflow-hidden">
      <div className="p-4 border-b border-gray-300">
        <h2 className="text-lg font-medium">Pattern Selection</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select a regex pattern or use the command palette (⌘K)
        </p>
      </div>
      
      {/* Category tabs */}
      <div className="border-b border-gray-300 overflow-x-auto">
        <div className="flex whitespace-nowrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 text-sm font-medium ${
              activeCategory === 'all' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category as PatternCategory)}
              className={`px-4 py-2 text-sm font-medium ${
                activeCategory === category 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Pattern list */}
      <div className="max-h-[300px] overflow-y-auto">
        {filteredPatterns.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No patterns found
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredPatterns.map(pattern => (
              <li key={pattern.id}>
                <button
                  onClick={() => selectPattern(pattern.id)}
                  className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                    selectedPatternId === pattern.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{pattern.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{pattern.description}</p>
                    </div>
                    {pattern.isBuiltIn && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Built-in
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500 font-mono">
                    <div>Search: <span className="text-gray-700">{pattern.searchRegex}</span></div>
                    <div>Replace: <span className="text-gray-700">{pattern.replaceRegex}</span></div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Selected pattern details */}
      {selectedPattern && (
        <div className="p-4 bg-gray-50 border-t border-gray-300">
          <h3 className="font-medium">Example</h3>
          <div className="mt-2 text-sm">
            <div className="mb-1">
              <span className="text-gray-500">Input:</span>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{selectedPattern.example.input}</pre>
            </div>
            <div>
              <span className="text-gray-500">Output:</span>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{selectedPattern.example.output}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
