import React, { useState } from 'react';
import type { Pattern } from '../../types/pattern';
import { toggleCommandPalette } from '../../stores/patternStore';

interface PatternInfoProps {
  pattern: Pattern;
  isMobile?: boolean;
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
export default function PatternInfo({ pattern, isMobile = false }: PatternInfoProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Pattern header - always visible */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            {isMobile && (
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-500 hover:text-gray-700 p-1 mr-1"
                aria-label="Toggle details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDetails ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                </svg>
              </button>
            )}
            <div className="flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800 mr-2">
                {pattern.keyNumber}
              </span>
              <h2 className="text-lg font-medium">{pattern.name}</h2>
              {isMobile && pattern.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                  {pattern.category}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => toggleCommandPalette()}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium flex items-center"
            title="Find pattern"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find
            <span className="ml-2 text-xs opacity-75">⌘K</span>
          </button>
        </div>
        {!isMobile && pattern.category && (
          <div className="text-sm text-gray-500 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {pattern.category}
            </span>
          </div>
        )}
        <p className="text-gray-700">{pattern.description}</p>
        
        {/* Short keys */}
        {pattern.shortKeys && pattern.shortKeys.length > 0 && (
          <div className="flex mt-2 gap-1">
            {pattern.shortKeys.map(key => (
              <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {key}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Example section - conditionally shown on mobile */}
      {pattern.example && (!isMobile || (isMobile && showDetails)) && (
        <CollapsibleSection title="Example" defaultExpanded={!isMobile}>
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
      
      {/* Pattern details section - conditionally shown on mobile */}
      {(pattern.searchRegex || pattern.replaceRegex || pattern.flags) && (!isMobile || (isMobile && showDetails)) && (
        <CollapsibleSection title="Pattern Details" defaultExpanded={!isMobile}>
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
