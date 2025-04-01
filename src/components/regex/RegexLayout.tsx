import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import InputArea from './InputArea';
import type { InputAreaHandle } from './InputArea';
import OutputArea from './OutputArea';
import CommandPalette from './CommandPalette';
import ActionButtons from './ActionButtons';
import PatternInfo from './PatternInfo'; // We'll create this component
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
  const inputAreaRef = useRef<InputAreaHandle>(null);
  
  // Initialize layout from localStorage
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    initializeLayout();
    
    // Setup keyboard shortcut for command palette
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Force update the UI state directly
        uiStateStore.setKey('isCommandPaletteOpen', true);
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
      transformText(input);
    }
  };
  
  // Toggle layout mode
  const toggleLayout = () => {
    setLayout(uiState.layout === 'horizontal' ? 'vertical' : 'horizontal');
  };
  
  return (
    <div className="w-full">
      {/* Layout toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleLayout}
          className="flex items-center text-sm text-gray-600 hover:text-primary"
          aria-label={`Switch to ${uiState.layout === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
        >
          {uiState.layout === 'horizontal' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Vertical Layout
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Horizontal Layout
            </>
          )}
        </button>
      </div>
      
      <div className={`grid gap-6 ${
        uiState.layout === 'horizontal'
          ? 'grid-cols-1 lg:grid-cols-3'
          : 'grid-cols-1'
      }`}>
        {/* Pattern info panel - shows at top in mobile, right side in desktop */}
        <div className={`order-1 ${uiState.layout === 'horizontal' ? 'lg:col-span-1 lg:order-2' : ''}`}>
          {selectedPattern && (
            <PatternInfo pattern={selectedPattern} />
          )}
        </div>
        
        {/* Input/Output areas - left side in desktop, below pattern in mobile */}
        <div className={`order-2 ${
          uiState.layout === 'horizontal'
            ? 'lg:col-span-2 lg:order-1'
            : ''
        }`}>
          <div className="space-y-6">
            {/* Input area */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-medium">Input</h2>
                <ActionButtons input={input} onCreatePattern={handleCreatePattern} />
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
              <h2 className="text-lg font-medium mb-2">Output</h2>
              <OutputArea
                value={transformation.result?.output || ''}
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
