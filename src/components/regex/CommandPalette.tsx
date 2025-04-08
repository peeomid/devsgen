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
    
    // Check if query is a number (key number)
    const isNumeric = /^\d+$/.test(query);
    
    // Prioritize exact matches for key numbers
    if (isNumeric) {
      const keyNumber = parseInt(query, 10);
      const exactMatch = patterns.find(pattern => pattern.keyNumber === keyNumber);
      
      if (exactMatch) {
        setFilteredPatterns([exactMatch]);
        setSelectedIndex(0);
        return;
      }
    }
    
    // Check for exact matches on short keys
    const shortKeyMatches = patterns.filter(pattern => 
      pattern.shortKeys.some(key => key.toLowerCase() === query)
    );
    
    if (shortKeyMatches.length > 0) {
      setFilteredPatterns(shortKeyMatches);
      setSelectedIndex(0);
      return;
    }
    
    // If no exact matches, search in all fields including short keys
    const filtered = patterns.filter(pattern => 
      pattern.name.toLowerCase().includes(query) ||
      pattern.description.toLowerCase().includes(query) ||
      pattern.category?.toLowerCase().includes(query) ||
      pattern.tags.some(tag => tag.toLowerCase().includes(query)) ||
      pattern.shortKeys.some(key => key.toLowerCase().includes(query)) ||
      (isNumeric && pattern.keyNumber.toString().includes(query))
    );
    
    setFilteredPatterns(filtered);
    setSelectedIndex(0);
  }, [searchQuery, patterns]);
  
  // Focus input when command palette opens and reset when it closes
  useEffect(() => {
    if (uiState.isCommandPaletteOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    } else {
      // Reset search query and selection when command palette is closed
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [uiState.isCommandPaletteOpen]);
  
  // Create a flat list of selectable items (excluding category headers)
  const [flattenedItems, setFlattenedItems] = useState<{ pattern: Pattern; index: number }[]>([]);
  
  // Update selectable items when filtered patterns change
  useEffect(() => {
    // Create a flat list of patterns (no category headers)
    const items: { pattern: Pattern; index: number }[] = filteredPatterns.map((pattern, index) => {
      return { pattern, index };
    });
    
    setFlattenedItems(items);
    
    // Reset selected index if it's out of bounds
    if (selectedIndex >= items.length) {
      setSelectedIndex(items.length > 0 ? 0 : -1);
    } else if (items.length > 0 && selectedIndex < 0) {
      // Ensure we always have a selection if there are items
      setSelectedIndex(0);
    }
  }, [filteredPatterns]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (flattenedItems.length > 0) {
          setSelectedIndex((selectedIndex + 1) % flattenedItems.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (flattenedItems.length > 0) {
          setSelectedIndex((selectedIndex - 1 + flattenedItems.length) % flattenedItems.length);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (flattenedItems.length > 0 && selectedIndex >= 0 && selectedIndex < flattenedItems.length) {
          selectPattern(flattenedItems[selectedIndex].pattern.id);
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
    if (listRef.current && flattenedItems.length > 0 && selectedIndex >= 0) {
      // Find the li element with the selected pattern ID
      if (flattenedItems[selectedIndex]) {
        const patternId = flattenedItems[selectedIndex].pattern.id;
        const selectedElement = listRef.current.querySelector(`li[data-pattern-id="${patternId}"]`) as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
          });
        }
      }
    }
  }, [selectedIndex, flattenedItems]);
  
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
            filteredPatterns.map((pattern, index) => {
              return (
                <li 
                  key={pattern.id}
                  role="option"
                  data-pattern-id={pattern.id}
                  aria-selected={index === selectedIndex}
                  className={`px-4 py-3 cursor-pointer ${
                    index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    selectPattern(pattern.id);
                    toggleCommandPalette();
                  }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800 mr-2">
                                {pattern.keyNumber}
                              </span>
                              <h3 className="font-medium text-gray-900">{pattern.name}</h3>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{pattern.description}</p>
                            {pattern.shortKeys.length > 0 && (
                              <div className="flex mt-1 gap-1">
                                {pattern.shortKeys.map(key => (
                                  <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {key}
                                  </span>
                                ))}
                              </div>
                            )}
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
            })
          )}
        </ul>
      </div>
    </div>
  );
}
