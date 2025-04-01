import React from 'react';
import type { Pattern } from '../../types/pattern';

interface PatternInfoProps {
  pattern: Pattern;
}

/**
 * Component to display information about the currently selected pattern
 */
export default function PatternInfo({ pattern }: PatternInfoProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
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
      
      {(pattern.searchRegex || pattern.replaceRegex) && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Pattern Details</h3>
          
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
        </div>
      )}
      
      {/* Check for single example or examples array */}
      {((pattern.example || (pattern.examples && pattern.examples.length > 0)) && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Example</h3>
          
          {/* Handle both single example and examples array */}
          {pattern.example ? (
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
          ) : pattern.examples && pattern.examples.map((example, index) => (
            <div key={index} className="mb-2 last:mb-0">
              <div className="text-xs text-gray-500 mb-1">Input:</div>
              <code className="block p-2 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
                {example.input}
              </code>
              
              <div className="text-xs text-gray-500 mt-2 mb-1">Output:</div>
              <code className="block p-2 bg-gray-50 rounded text-sm font-mono overflow-x-auto">
                {example.output}
              </code>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
