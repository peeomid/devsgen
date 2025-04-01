import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { patternsStore, selectPattern, toggleCommandPalette } from '../../stores/patternStore';
import { uiStateStore } from '../../stores/patternStore';
import type { Pattern } from '../../types/pattern';

export default function CommandPalette() {
  const patterns = useStore(patternsStore);
  const uiState = useStore(uiStateStore);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatterns, setFilteredPatterns] = useState<Pattern[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  
  // Filter patterns based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatterns(patterns);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = patterns.filter(pattern => 
      pattern.name.toLowerCase().includes(query) ||
      pattern.description.toLowerCase().includes(query) ||
      pattern.category?.toLowerCase().includes(query) ||
      pattern.tags.some(tag => tag.toLowerCase().includes(query))
    );
    
    setFilteredPatterns(filtered);
    setSelectedIndex(0);
  }, [searchQuery, patterns]);
  
  // Focus input when command palette opens
  useEffect(() => {
    if (uiState.isCommandPaletteOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [uiState.isCommandPaletteOpen]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredPatterns.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPatterns[selectedIndex]) {
          selectPattern(filteredPatterns[selectedIndex].id);
          toggleCommandPalette();
        }
        break;
      case 'Escape':
        e.preventDefault();
        toggleCommandPalette();
        break;
    }
  };
  
  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredPatterns.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex, filteredPatterns]);
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (uiState.isCommandPaletteOpen && 
          !target.closest('.command-palette-content')) {
        toggleCommandPalette();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [uiState.isCommandPaletteOpen]);
  
  if (!uiState.isCommandPaletteOpen) {
    return null;
  }
  
  return (
    <div className="command-palette">
      <div className="command-palette-content">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a pattern..."
            className="w-full outline-none text-lg"
            autoComplete="off"
            aria-label="Search patterns"
          />
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span className="shortcut-hint">↑↓</span>
            <span>to navigate</span>
            <span className="shortcut-hint">↵</span>
            <span>to select</span>
            <span className="shortcut-hint">Esc</span>
            <span>to close</span>
          </div>
        </div>
        
        <ul 
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto"
          role="listbox"
        >
          {filteredPatterns.length === 0 ? (
            <li className="px-4 py-3 text-gray-500">
              No patterns found
            </li>
          ) : (
            // Group patterns by category
            Object.entries(filteredPatterns.reduce((groups, pattern) => {
              const category = pattern.category || 'Uncategorized';
              if (!groups[category]) {
                groups[category] = [];
              }
              groups[category].push(pattern);
              return groups;
            }, {} as Record<string, Pattern[]>))
            .map(([category, categoryPatterns]) => (
              <React.Fragment key={category}>
                <li className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                  {category}
                </li>
                {categoryPatterns.map((pattern, patternIndex) => {
                  // Calculate the actual index in the flat list for keyboard navigation
                  const flatIndex = filteredPatterns.findIndex(p => p.id === pattern.id);
                  return (
                    <li 
                      key={pattern.id}
                      role="option"
                      aria-selected={flatIndex === selectedIndex}
                      className={`px-4 py-3 cursor-pointer ${
                        flatIndex === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        selectPattern(pattern.id);
                        toggleCommandPalette();
                      }}
                    >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{pattern.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{pattern.description}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">{pattern.category}</span>
                    {pattern.isBuiltIn && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Built-in
                      </span>
                    )}
                  </div>
                </div>
                    </li>
                  );
                })}
              </React.Fragment>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
