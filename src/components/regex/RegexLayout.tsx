import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import InputArea from './InputArea';
import type { InputAreaHandle } from './InputArea';
import OutputArea from './OutputArea';
import type { OutputAreaHandle } from './OutputArea';
import CommandPalette from './CommandPalette';
import PatternSelectorBar from './PatternSelectorBar';
import RegexEditor from './RegexEditor';
import PatternReference from './PatternReference';
import { analytics } from '../../services/AnalyticsService';
import { 
  transformationStore, 
  transformText,
  uiStateStore,
  selectedPatternIdStore,
  patternsStore,
  isPatternModifiedStore,
  initializeLayout
} from '../../stores/patternStore';

export default function RegexLayout() {
  const transformation = useStore(transformationStore);
  const uiState = useStore(uiStateStore);
  const patterns = useStore(patternsStore);
  const selectedPatternId = useStore(selectedPatternIdStore);
  const isPatternModified = useStore(isPatternModifiedStore);
  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const inputAreaRef = useRef<InputAreaHandle>(null);
  const outputAreaRef = useRef<OutputAreaHandle>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  
  // Track tool session on mount
  useEffect(() => {
    analytics.toolSessionStarted('regex-find-replace');
    sessionStartTimeRef.current = Date.now();
    
    // Track session duration on unmount
    return () => {
      const sessionDuration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      analytics.toolSessionDuration('regex-find-replace', sessionDuration);
    };
  }, []);
  
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
      
      // Command+E to focus search input (edit pattern)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        const searchInput = document.getElementById('regex-search-input');
        if (searchInput) {
          searchInput.focus();
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
      {/* Hybrid Layout: Desktop (side by side), Mobile (stacked) */}
      <div className="lg:grid lg:grid-cols-[1fr,400px] lg:gap-6 space-y-6 lg:space-y-0">
        
        {/* Left Column: Input/Output Areas */}
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

        {/* Right Column: Three-panel regex structure (Desktop only) */}
        <div className="hidden lg:block">
          <div className="space-y-4">
            {/* 1. Pattern Selector Bar */}
            <PatternSelectorBar pattern={selectedPattern} />
            
            {/* 2. Regex Editor */}
            <RegexEditor pattern={selectedPattern} />
            
            {/* 3. Pattern Reference (conditional) */}
            {selectedPattern && !isPatternModified && (
              <PatternReference pattern={selectedPattern} isMobile={false} />
            )}
          </div>
        </div>
        
        {/* Mobile: Three-panel structure stacked on top */}
        <div className="lg:hidden space-y-4">
          {/* 1. Pattern Selector Bar */}
          <PatternSelectorBar pattern={selectedPattern} />
          
          {/* 2. Regex Editor */}
          <RegexEditor pattern={selectedPattern} />
          
          {/* 3. Pattern Reference (conditional) */}
          {selectedPattern && !isPatternModified && (
            <PatternReference pattern={selectedPattern} isMobile={true} />
          )}
        </div>
      </div>
      
      {/* Command palette */}
      <CommandPalette />
    </div>
  );
}
