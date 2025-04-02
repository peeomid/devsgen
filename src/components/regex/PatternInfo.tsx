import React, { useState } from 'react';
import type { Pattern } from '../../types/pattern';

interface PatternInfoProps {
  pattern: Pattern;
}

/**
 * Collapsible section component for pattern info
 */
interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultExpanded = false, children }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <div className="border-t border-gray-100 pt-3 mt-3">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full justify-between items-center text-left focus:outline-none group"
        aria-expanded={isExpanded}
      >
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <span className="text-gray-500 group-hover:text-gray-700 transition-colors">
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </button>
      
      {isExpanded && (
        <div className="mt-2 transition-all duration-200 ease-in-out">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Component to display information about the currently selected pattern
 */
export default function PatternInfo({ pattern }: PatternInfoProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Pattern header - always visible */}
      <div className="mb-2">
        <h2 className="text-lg font-medium mb-1">{pattern.name}</h2>
        {pattern.category && (
          <div className="text-sm text-gray-500 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {pattern.category}
            </span>
          </div>
        )}
        <p className="text-gray-700">{pattern.description}</p>
      </div>
      
      {/* Example section */}
      {pattern.example && (
        <CollapsibleSection title="Example" defaultExpanded={false}>
          <div className="mb-2 last:mb-0">
            <div className="text-xs text-gray-500 mb-1">Input:</div>
            <code className="block p-2 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
              {pattern.example.input}
            </code>
            
            <div className="text-xs text-gray-500 mt-2 mb-1">Output:</div>
            <code className="block p-2 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
              {pattern.example.output}
            </code>
          </div>
        </CollapsibleSection>
      )}
      
      {/* Pattern details section - collapsed by default */}
      {(pattern.searchRegex || pattern.replaceRegex || pattern.flags) && (
        <CollapsibleSection title="Pattern Details" defaultExpanded={false}>
          {pattern.searchRegex && (
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">Search:</div>
              <code className="block p-2 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
                {pattern.searchRegex}
              </code>
            </div>
          )}
          
          {pattern.replaceRegex && (
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">Replace:</div>
              <code className="block p-2 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
                {pattern.replaceRegex}
              </code>
            </div>
          )}
          
          {pattern.flags && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Flags:</div>
              <code className="block p-2 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
                {pattern.flags}
              </code>
            </div>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
}
