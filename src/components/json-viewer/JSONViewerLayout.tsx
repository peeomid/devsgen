import React, { useEffect, useCallback, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  hasJSON,
  currentView,
  processingStatus,
  initializeJSONViewerStore,
  jsonViewerActions
} from '../../stores/jsonViewerStore';
import keyboardShortcuts from '../../utils/keyboardShortcuts';

// Import components (to be created)
import JSONInput from './JSONInput';
import JSONRaw from './JSONRaw';
import JSONTree from './JSONTree';
import FilterSetList from './FilterSetList';
import FilterSetDialog from './FilterSetDialog';
import ProgressBar from './ProgressBar';
import ViewToggle from './ViewToggle';
import JSONToolbar from './JSONToolbar';
import UnifiedSearchInterface from './UnifiedSearchInterface';

export interface JSONViewerLayoutProps {
  className?: string;
}

export const JSONViewerLayout: React.FC<JSONViewerLayoutProps> = ({ className = '' }) => {
  const hasData = useStore(hasJSON);
  const view = useStore(currentView);
  const status = useStore(processingStatus);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Initialize the store when component mounts
  useEffect(() => {
    initializeJSONViewerStore().catch(console.error);

    // Register keyboard shortcuts
    const shortcuts = [
      // Clear JSON shortcut
      keyboardShortcuts.register({
        key: 'Escape',
        description: 'Clear JSON data and filters',
        handler: (e) => {
          e.preventDefault();
          if (hasJSON.get()) {
            handleClearJSON();
          }
        }
      }),

      // Copy JSON shortcut
      keyboardShortcuts.register({
        key: 'c',
        metaKey: true,
        shiftKey: true,
        description: 'Copy JSON to clipboard',
        handler: (e) => {
          e.preventDefault();
          const copyButton = document.querySelector('[data-copy-json]') as HTMLButtonElement;
          if (copyButton) {
            copyButton.click();
          }
        }
      }),

      // Switch to tree view
      keyboardShortcuts.register({
        key: '1',
        metaKey: true,
        description: 'Switch to tree view',
        handler: (e) => {
          e.preventDefault();
          if (hasJSON.get()) {
            jsonViewerActions.setView('tree');
          }
        }
      }),

      // Switch to raw view
      keyboardShortcuts.register({
        key: '2',
        metaKey: true,
        description: 'Switch to raw view',
        handler: (e) => {
          e.preventDefault();
          if (hasJSON.get()) {
            jsonViewerActions.setView('raw');
          }
        }
      }),

      // Open filter dialog
      keyboardShortcuts.register({
        key: 'f',
        metaKey: true,
        description: 'Open filter dialog',
        handler: (e) => {
          e.preventDefault();
          if (hasJSON.get()) {
            jsonViewerActions.openFilterDialog();
          }
        }
      })
    ];

    // Cleanup function to unregister shortcuts
    return () => {
      shortcuts.forEach(id => keyboardShortcuts.unregister(id));
    };
  }, []);

  const handleClearJSON = useCallback(async () => {
    try {
      await jsonViewerActions.clearJSON();
    } catch (error) {
      console.error('Failed to clear JSON:', error);
    }
  }, []);

  return (
    <div className={`${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">JSON Viewer</h1>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title="Help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">
            Load, view, filter, and analyze JSON data with an interactive tree view
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <ProgressBar />
        </div>

        {!hasData || status === 'idle' ? (
          /* Initial State - JSON Input */
          <JSONInput />
        ) : (
          /* Data Loaded State - Split Layout */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content - Left Side (3/4 width on large screens) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Toolbar */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 space-y-3 sm:space-y-0">
                  <ViewToggle />
                  <JSONToolbar onClear={handleClearJSON} />
                </div>
              </div>

              {/* JSON Display */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6">
                  {view === 'tree' ? <JSONTree /> : <JSONRaw />}
                </div>
              </div>
            </div>

            {/* Sidebar - Right Side (1/4 width on large screens) */}
            <div className="lg:col-span-1 space-y-4">
              {/* Search Section */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm sticky top-4">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900">Search</h3>
                </div>
                <div className="p-4">
                  <UnifiedSearchInterface />
                </div>
              </div>

              {/* Filters Section */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                </div>
                <div className="p-4">
                  <FilterSetList />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>
              Part of{' '}
              <a 
                href="/" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Devsgen
              </a>
              {' '}developer utilities
            </p>
          </div>
        </div>

        {/* Filter Dialog */}
        <FilterSetDialog />

        {/* Help Modal */}
        {isHelpOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">JSON Viewer Help</h2>
                  <button
                    onClick={() => setIsHelpOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4 text-sm text-gray-700">
                  <section>
                    <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Upload a JSON file or paste JSON text to begin</li>
                      <li>Switch between Tree and Raw views to explore your data</li>
                      <li>Create filters to find specific data patterns</li>
                      <li>Copy filtered results or export to file</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-semibold text-gray-900 mb-2">Keyboard Shortcuts</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between">
                        <span>⌘1</span>
                        <span>Switch to Tree view</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⌘2</span>
                        <span>Switch to Raw view</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⌘F</span>
                        <span>Open filter dialog</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⌘⇧C</span>
                        <span>Copy JSON</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Escape</span>
                        <span>Clear data</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="font-semibold text-gray-900 mb-2">Filtering</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Path filters:</strong> Use JSONPath syntax like <code>$.users[*].name</code></li>
                      <li><strong>Value filters:</strong> Search for specific values in any field</li>
                      <li>Click on tree nodes to auto-fill path filters</li>
                      <li>Combine multiple filters with AND logic</li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JSONViewerLayout;