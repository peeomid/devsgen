import React, { useState } from 'react';
import { PatternService } from '../../services/PatternService';
import type { PatternImportResult } from '../../types/pattern';

const patternService = new PatternService();

export default function PatternImportExport() {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [exportText, setExportText] = useState('');
  const [importResult, setImportResult] = useState<PatternImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Handle create pattern navigation
  const handleCreatePattern = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/tools/regex-find-replace/create';
    }
  };
  
  // Handle import
  const handleImport = async () => {
    setError(null);
    setImportResult(null);
    
    if (!importText.trim()) {
      setError('Please enter JSON data to import');
      return;
    }
    
    try {
      await patternService.importPatterns(importText);
      setImportText('');
      setError(null);
      setImportResult({
        success: true,
        imported: 1, // This will be updated with actual count
        skipped: 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import patterns');
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [err instanceof Error ? err.message : 'Unknown error']
      });
    }
  };
  
  // Handle export
  const handleExport = async () => {
    try {
      const exported = await patternService.exportPatterns();
      setExportText(exported);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export patterns');
    }
  };
  
  // Copy export text to clipboard
  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      // Show success message
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header with Create Pattern button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Pattern Management</h3>
        <button
          onClick={handleCreatePattern}
          className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
          title="Create a new pattern"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Pattern
        </button>
      </div>
      
      {/* Import section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Import Patterns</h3>
          <button
            onClick={() => setIsImporting(!isImporting)}
            className="text-sm text-primary hover:text-blue-700"
          >
            {isImporting ? 'Cancel' : 'Import Patterns'}
          </button>
        </div>
        
        {isImporting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Paste JSON data containing patterns to import. This will add new patterns to your collection.
            </p>
            
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-32 p-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder='[{"id": "example", "name": "Example Pattern", ...}]'
            />
            
            <div className="flex justify-end">
              <button
                onClick={handleImport}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Import
              </button>
            </div>
            
            {importResult && (
              <div className={`p-3 rounded-md ${
                importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {importResult.success ? (
                  <p>Successfully imported {importResult.imported} patterns</p>
                ) : (
                  <div>
                    <p>Failed to import patterns</p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <ul className="list-disc list-inside mt-1 text-sm">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Export section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Export Patterns</h3>
          <button
            onClick={() => {
              setIsExporting(!isExporting);
              if (!isExporting) {
                handleExport();
              }
            }}
            className="text-sm text-primary hover:text-blue-700"
          >
            {isExporting ? 'Cancel' : 'Export Patterns'}
          </button>
        </div>
        
        {isExporting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your custom patterns are shown below in JSON format. Copy this data to save or share your patterns.
            </p>
            
            <div className="relative">
              <textarea
                value={exportText}
                readOnly
                className="w-full h-32 p-2 border border-gray-300 rounded-md font-mono text-sm"
              />
              
              <button
                onClick={handleCopyExport}
                className="absolute top-2 right-2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-1 rounded"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
