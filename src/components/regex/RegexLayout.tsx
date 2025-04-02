import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import InputArea from './InputArea';
import type { InputAreaHandle } from './InputArea';
import OutputArea from './OutputArea';
import type { OutputAreaHandle } from './OutputArea';
import CommandPalette from './CommandPalette';
import PatternInfo from './PatternInfo';
import { 
  transformationStore, 
  transformText,
  uiStateStore,
  selectedPatternIdStore,
  patternsStore,
  getSelectedPattern,
  toggleCommandPalette,
  setLayout,
  initializeLayout
} from '../../stores/patternStore';

export default function RegexLayout() {
  const transformation = useStore(transformationStore);
  const uiState = useStore(uiStateStore);
  const patterns = useStore(patternsStore);
  const selectedPatternId = useStore(selectedPatternIdStore);
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const inputAreaRef = useRef<InputAreaHandle>(null);
  const outputAreaRef = useRef<OutputAreaHandle>(null);
  
  // Initialize layout and load saved data from localStorage
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    initializeLayout();
    
    // Load saved input from localStorage
    const savedInput = localStorage.getItem('regex_input');
    if (savedInput) {
      setInput(savedInput);
    }
    
    // Setup keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Force update the UI state directly
        uiStateStore.setKey('isCommandPaletteOpen', true);
      }
      
      // Command+1 to focus input area
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        if (inputAreaRef.current) {
          inputAreaRef.current.focus();
        }
      }
      
      // Command+2 to focus output area
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        if (outputAreaRef.current) {
          outputAreaRef.current.focus();
        }
      }
      
      // Command+Shift+C to copy output
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (outputAreaRef.current) {
          outputAreaRef.current.copyToClipboard();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Update selected pattern when selectedPatternId changes
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;
    
    if (selectedPatternId && patterns.length > 0) {
      const pattern = patterns.find(p => p.id === selectedPatternId);
      setSelectedPattern(pattern || null);
      
      // Save selected pattern ID to localStorage
      localStorage.setItem('regex_selected_pattern', selectedPatternId);
      
      // Focus and select all text in the input field when a pattern is selected
      setTimeout(() => {
        if (inputAreaRef.current) {
          inputAreaRef.current.selectAll();
        }
      }, 100);
    } else {
      setSelectedPattern(null);
    }
  }, [selectedPatternId, patterns]);
  
  // Navigate to create pattern page
  const handleCreatePattern = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/tools/regex/create';
    }
  };
  
  // Handle transformation
  const handleTransform = () => {
    if (input.trim()) {
      // Save input to localStorage
      localStorage.setItem('regex_input', input);
      transformText(input);
      
      // Auto-focus output and select all text after transform
      setTimeout(() => {
        if (outputAreaRef.current) {
          outputAreaRef.current.focus();
          outputAreaRef.current.selectAll();
        }
      }, 100);
    }
  };
  
  // Update output state when transformation result changes
  useEffect(() => {
    if (transformation.result?.output !== undefined) {
      setOutput(transformation.result.output);
    }
  }, [transformation.result?.output]);
  
  // Save input to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (input) {
      localStorage.setItem('regex_input', input);
    }
  }, [input]);
  
  // This function is kept for compatibility but no longer used in the UI
  const toggleLayout = () => {
    setLayout('horizontal'); // Always use horizontal layout
  };
  
  // Process input on initial load if needed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Wait for patterns to load and input to be restored
    if (patterns.length > 0 && input.trim() && !transformation.result) {
      // Small timeout to ensure everything is loaded
      setTimeout(() => {
        handleTransform();
      }, 300);
    }
  }, [patterns, input, transformation.result]);
  
  return (
    <div className="w-full">

      
      {/* Mobile pattern summary - only visible on mobile */}
      {selectedPattern && (
        <div className="lg:hidden mb-4 bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center mb-1">
            <button 
              onClick={() => {
                // Toggle collapsible section in mobile view
                const mobileDescriptionEl = document.getElementById('mobile-pattern-description');
                if (mobileDescriptionEl) {
                  mobileDescriptionEl.classList.toggle('hidden');
                }
              }}
              className="text-gray-500 hover:text-gray-700 p-1 mr-1"
              aria-label="Toggle description"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <h3 className="text-md font-medium">{selectedPattern.name}</h3>
            {selectedPattern.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                {selectedPattern.category}
              </span>
            )}
          </div>
          <div id="mobile-pattern-description" className="text-sm text-gray-700 mb-2 hidden">
            {selectedPattern.description}
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => toggleCommandPalette()}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-md text-sm font-medium flex items-center"
              title="Find pattern"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Pattern
              <span className="ml-2 text-xs opacity-75">⌘K</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Pattern info panel - hidden on mobile, visible on right side in desktop */}
        <div className="hidden lg:block lg:col-span-1 lg:order-2">
          {selectedPattern && (
            <PatternInfo pattern={selectedPattern} />
          )}
        </div>
        
        {/* Input/Output areas */}
        <div className="lg:col-span-2 lg:order-1">
          <div className="space-y-6">
            {/* Input area */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h2 className="text-lg font-medium">Input</h2>
                  <span className="ml-2 text-xs text-gray-500">(⌘1 to focus)</span>
                </div>
              </div>
              <InputArea
                ref={inputAreaRef}
                value={input}
                onChange={setInput}
                onTransform={handleTransform}
                disabled={transformation.isProcessing}
              />
            </div>
            
            {/* Output area */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h2 className="text-lg font-medium">Output</h2>
                  <span className="ml-2 text-xs text-gray-500">(⌘2 to focus)</span>
                </div>
                {/* Create pattern button moved here */}
                <button
                  onClick={handleCreatePattern}
                  className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  title="Create a new pattern"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Pattern
                </button>
              </div>
              <OutputArea
                ref={outputAreaRef}
                value={output}
                onChange={setOutput}
                executionTime={transformation.result?.executionTime}
                isLoading={transformation.isProcessing}
                error={transformation.error}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Command palette */}
      <CommandPalette />
    </div>
  );
}
