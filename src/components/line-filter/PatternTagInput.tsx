import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface Pattern {
  id: string;
  value: string;
  isValid: boolean;
  error?: string;
}

export interface PatternTagInputProps {
  patterns: Pattern[];
  onPatternsChange: (patterns: Pattern[]) => void;
  onAddFilter: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const PatternTagInput: React.FC<PatternTagInputProps> = ({
  patterns,
  onPatternsChange,
  onAddFilter,
  placeholder = "Enter pattern...",
  disabled = false,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const generateId = useCallback(() => {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const validatePattern = useCallback((value: string): { isValid: boolean; error?: string } => {
    if (!value.trim()) {
      return { isValid: false, error: 'Pattern cannot be empty' };
    }
    // Add regex validation if needed
    return { isValid: true };
  }, []);

  const addPattern = useCallback(() => {
    if (!inputValue.trim()) return;

    const validation = validatePattern(inputValue);
    const newPattern: Pattern = {
      id: generateId(),
      value: inputValue.trim(),
      isValid: validation.isValid,
      error: validation.error
    };

    onPatternsChange([...patterns, newPattern]);
    setInputValue('');
    
    // Focus back to input for next pattern
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [inputValue, patterns, onPatternsChange, generateId, validatePattern]);

  const removePattern = useCallback((id: string) => {
    onPatternsChange(patterns.filter(p => p.id !== id));
    // Focus back to input after removal
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [patterns, onPatternsChange]);

  const startEditing = useCallback((pattern: Pattern) => {
    setEditingId(pattern.id);
    setEditValue(pattern.value);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId || !editValue.trim()) {
      setEditingId(null);
      return;
    }

    const validation = validatePattern(editValue);
    const updatedPatterns = patterns.map(p => 
      p.id === editingId 
        ? { ...p, value: editValue.trim(), isValid: validation.isValid, error: validation.error }
        : p
    );
    
    onPatternsChange(updatedPatterns);
    setEditingId(null);
    setEditValue('');
    
    // Focus back to main input
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [editingId, editValue, patterns, onPatternsChange, validatePattern]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue('');
    // Focus back to main input
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Enter: Add complete filter
          if (inputValue.trim()) {
            addPattern(); // Add current input as pattern first
          }
          onAddFilter();
        } else {
          // Enter: Add pattern (OR logic)
          addPattern();
        }
        break;
        
      case 'Backspace':
        if (!inputValue && patterns.length > 0) {
          // Remove last pattern if input is empty
          e.preventDefault();
          const lastPattern = patterns[patterns.length - 1];
          removePattern(lastPattern.id);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        if (inputValue) {
          setInputValue('');
        }
        break;
    }
  }, [inputValue, patterns, addPattern, onAddFilter, removePattern]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        saveEdit();
        break;
      case 'Escape':
        e.preventDefault();
        cancelEdit();
        break;
    }
  }, [saveEdit, cancelEdit]);

  // Focus input when component mounts or when not editing
  useEffect(() => {
    if (!editingId) {
      inputRef.current?.focus();
    }
  }, [editingId]);

  const hasPatterns = patterns.length > 0;
  const showAddButton = hasPatterns || inputValue.trim();

  return (
    <div className={`${className}`}>
      {/* Pattern Tags */}
      {hasPatterns && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {patterns.map((pattern) => (
            <div
              key={pattern.id}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${
                pattern.isValid 
                  ? 'bg-blue-100 border-blue-300 text-blue-800' 
                  : 'bg-red-100 border-red-300 text-red-800'
              }`}
            >
              {editingId === pattern.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                  className="bg-transparent border-none outline-none text-xs w-20 min-w-0"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => startEditing(pattern)}
                  className="cursor-pointer truncate max-w-32"
                  title={pattern.error || pattern.value}
                >
                  {pattern.value}
                </span>
              )}
              
              <button
                type="button"
                onClick={() => removePattern(pattern.id)}
                className="ml-1 hover:bg-white hover:bg-opacity-50 rounded-full p-0.5"
                title="Remove pattern"
                disabled={disabled}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          {/* OR Logic Indicator */}
          {patterns.length > 1 && (
            <span className="text-xs text-gray-500 font-medium px-1">OR</span>
          )}
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-center gap-2">
        {/* Main Input */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasPatterns ? "Add another pattern..." : placeholder}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={disabled}
          />
        </div>

        {/* Add Pattern Button (when patterns exist) */}
        {hasPatterns && (
          <button
            type="button"
            onClick={addPattern}
            disabled={!inputValue.trim() || disabled}
            className="px-2 py-1.5 text-xs text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add OR pattern (Enter)"
          >
            + OR
          </button>
        )}
      </div>

      {/* Keyboard Hints */}
      {!disabled && (
        <div className="mt-1 text-xs text-gray-500">
          {hasPatterns ? (
            <span>Press Enter to add OR pattern, Shift+Enter to add filter</span>
          ) : (
            <span>Press Enter for OR patterns, Shift+Enter to add filter</span>
          )}
        </div>
      )}
    </div>
  );
};

export default PatternTagInput;