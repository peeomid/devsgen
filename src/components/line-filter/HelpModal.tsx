import React from 'react';
import keyboardShortcuts from '../../utils/keyboardShortcuts';

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = keyboardShortcuts.getShortcuts().filter(s => 
    s.description.toLowerCase().includes('filter') || 
    s.description.toLowerCase().includes('copy') ||
    s.description.toLowerCase().includes('clear')
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Line Filter Tool - Help
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Overview */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Overview</h4>
              <p className="text-sm text-gray-600">
                The Line Filter Tool helps you efficiently filter and search through large text files and CSV data. 
                Upload files or paste text, then use include/exclude filters to find exactly what you need.
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>File Support:</strong> .txt, .csv, .tsv, .log files up to 5MB and 10,000 lines</li>
                <li>• <strong>Text Paste:</strong> Paste content directly from clipboard</li>
                <li>• <strong>Auto-Detection:</strong> Automatically detects CSV format and headers</li>
                <li>• <strong>Pattern Matching:</strong> Include or exclude lines based on patterns</li>
                <li>• <strong>Regex Support:</strong> Use regular expressions for complex patterns</li>
                <li>• <strong>CSV Filtering:</strong> Filter by specific columns or search all data</li>
                <li>• <strong>Export Results:</strong> Copy filtered results to clipboard</li>
              </ul>
            </div>

            {/* Filter Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Filter Types</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Include Filters:</span>
                  <span className="text-gray-600 ml-1">Show only lines that match the pattern</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Exclude Filters:</span>
                  <span className="text-gray-600 ml-1">Hide lines that match the pattern</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Column Filters (CSV):</span>
                  <span className="text-gray-600 ml-1">Filter specific columns in CSV data</span>
                </div>
              </div>
            </div>

            {/* Regex Examples */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Regex Examples</h4>
              <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                <div><code className="bg-white px-1 rounded">^ERROR</code> - Lines starting with "ERROR"</div>
                <div><code className="bg-white px-1 rounded">\d{4}-\d{2}-\d{2}</code> - Date patterns (YYYY-MM-DD)</div>
                <div><code className="bg-white px-1 rounded">\b\w+@\w+\.\w+\b</code> - Email addresses</div>
                <div><code className="bg-white px-1 rounded">failed|error|exception</code> - Multiple keywords</div>
                <div><code className="bg-white px-1 rounded">^\s*$</code> - Empty lines</div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            {shortcuts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Keyboard Shortcuts</h4>
                <div className="space-y-1">
                  {shortcuts.map((shortcut) => (
                    <div key={shortcut.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{shortcut.description}</span>
                      <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                        {keyboardShortcuts.formatShortcut(shortcut.id)}
                      </kbd>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Add filter quickly</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">⌘+Enter</kbd>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use multiple filters to narrow down results progressively</li>
                <li>• CSV headers are auto-detected, but you can toggle header detection</li>
                <li>• Case-sensitive matching is available for precise filtering</li>
                <li>• Large files are processed in chunks to keep the UI responsive</li>
                <li>• All processing happens locally in your browser for privacy</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="
                w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;