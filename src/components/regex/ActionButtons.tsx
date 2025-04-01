import React from 'react';
import { useStore } from '@nanostores/react';
import { 
  transformText, 
  toggleCommandPalette,
  selectedPatternIdStore,
  patternsStore
} from '../../stores/patternStore';
import keyboardShortcuts from '../../utils/keyboardShortcuts';

interface ActionButtonsProps {
  input: string;
  onCreatePattern?: () => void;
}

export default function ActionButtons({ input, onCreatePattern }: ActionButtonsProps) {
  const selectedPatternId = useStore(selectedPatternIdStore);
  const patterns = useStore(patternsStore);
  // Use state to ensure consistent rendering between server and client
  const [selectedPattern, setSelectedPattern] = React.useState<any>(null);
  
  // Update selected pattern when dependencies change
  React.useEffect(() => {
    if (selectedPatternId && patterns.length > 0) {
      const pattern = patterns.find(p => p.id === selectedPatternId);
      setSelectedPattern(pattern || null);
    } else {
      setSelectedPattern(null);
    }
  }, [selectedPatternId, patterns]);
  
  // Register keyboard shortcuts - only on client side
  React.useEffect(() => {
    // Only register keyboard shortcuts in browser environment
    if (typeof window === 'undefined') return;
    
    const transformShortcutId = keyboardShortcuts.register({
      key: 'Enter',
      metaKey: true,
      description: 'Transform text',
      handler: (e) => {
        e.preventDefault();
        if (input.trim()) {
          transformText(input);
        }
      }
    });
    
    const commandPaletteShortcutId = keyboardShortcuts.register({
      key: 'k',
      metaKey: true,
      description: 'Open command palette',
      handler: (e) => {
        e.preventDefault();
        toggleCommandPalette();
      }
    });
    
    // Cleanup
    return () => {
      keyboardShortcuts.unregister(transformShortcutId);
      keyboardShortcuts.unregister(commandPaletteShortcutId);
    };
  }, [input]);
  
  return (
    <div className="flex flex-wrap gap-2">
      {/* Transform button */}
      <button
        onClick={() => input.trim() && transformText(input)}
        disabled={!selectedPatternId || !input.trim()}
        className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Transform text (⌘+Enter)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Transform
      </button>
      
      {/* Command palette button */}
      <button
        onClick={() => toggleCommandPalette()}
        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        title="Open command palette (⌘+K)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Find Pattern
      </button>
      
      {/* Create pattern button */}
      {onCreatePattern && (
        <button
          onClick={onCreatePattern}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          title="Create a new pattern"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Pattern
        </button>
      )}
      
      {/* Selected pattern info */}
      {selectedPattern && (
        <div className="flex items-center ml-auto text-sm text-gray-500">
          <span className="mr-1">Using:</span>
          <span className="font-medium text-gray-700">{selectedPattern.name}</span>
        </div>
      )}
    </div>
  );
}
