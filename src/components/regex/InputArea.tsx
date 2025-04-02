import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onTransform?: () => void;
}

export interface InputAreaHandle {
  focus: () => void;
  selectAll: () => void;
}

const InputArea = forwardRef<InputAreaHandle, InputAreaProps>(({ 
  value, 
  onChange, 
  placeholder = 'Enter text to transform... (⌘1 to focus)', 
  disabled = false,
  onTransform
}: InputAreaProps, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
    selectAll: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }
  }));
  
  // Handle keyboard shortcuts
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to transform
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && onTransform) {
        e.preventDefault();
        onTransform();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTransform]);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);
  
  // Auto-focus textarea on mount
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const textarea = textareaRef.current;
    if (textarea) {
      // Small timeout to ensure the component is fully rendered
      setTimeout(() => {
        textarea.focus();
      }, 100);
    }
  }, []);
  
  return (
    <div className={`relative rounded-md border ${isFocused ? 'border-primary' : 'border-gray-300'} transition-colors`}>
      <div className="absolute top-0 right-0 p-2 text-xs text-gray-500">
        {value.length} characters
      </div>
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-full min-h-[200px] p-4 font-mono text-sm resize-y rounded-md focus:outline-none"
        spellCheck={false}
        aria-label="Input text"
        title="Input area (⌘1 to focus)"
      />
      
      {onTransform && (
        <div className="absolute bottom-2 right-2">
          <button
            onClick={onTransform}
            disabled={disabled || !value.trim()}
            className="bg-primary text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            aria-label="Transform text"
          >
            Transform
            <span className="ml-2 text-xs opacity-75">⌘+↵</span>
          </button>
        </div>
      )}
    </div>
  );
});

export default InputArea;
