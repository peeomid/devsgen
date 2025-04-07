import React from 'react';

interface ShortcutItemProps {
  step: number;
  shortcut: string;
  description: string;
  keyboardKey: string;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ step, shortcut, description, keyboardKey }) => {
  return (
    <div className="flex items-center mx-1 my-1">
      <span className="font-medium mr-1">{step}.</span>
      <kbd 
        className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md font-mono text-xs mr-1"
        title={keyboardKey}
      >
        {shortcut}
      </kbd>
      <span>{description}</span>
    </div>
  );
};

const ShortcutGuide: React.FC = () => {
  return (
    <div className="mt-3 flex flex-wrap items-center text-sm text-gray-500">
      <ShortcutItem 
        step={1} 
        shortcut="⌘K" 
        description="Find pattern" 
        keyboardKey="Command + K"
      />
      
      <div className="flex items-center mx-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
      
      <ShortcutItem 
        step={2} 
        shortcut="⌘↵" 
        description="Transform" 
        keyboardKey="Command + Enter"
      />
      
      <div className="flex items-center mx-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
      
      <ShortcutItem 
        step={3} 
        shortcut="⌘⇧C" 
        description="Copy result" 
        keyboardKey="Command + Shift + C"
      />
    </div>
  );
};

export default ShortcutGuide;
