import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { patternsStore, deletePattern } from '../../stores/patternStore';
import type { Pattern } from '../../types/pattern';
import PatternForm from './PatternForm';

export default function PatternManager() {
  const patterns = useStore(patternsStore);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPattern, setEditingPattern] = useState<Pattern | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Filter to only show user-created patterns
  const userPatterns = patterns.filter(pattern => !pattern.isBuiltIn);
  
  // Handle edit pattern
  const handleEditPattern = (pattern: Pattern) => {
    setEditingPattern(pattern);
    setIsEditing(true);
  };
  
  // Handle delete pattern
  const handleDeletePattern = (patternId: string) => {
    deletePattern(patternId);
    setShowDeleteConfirm(null);
  };
  
  // Handle save pattern
  const handleSavePattern = () => {
    setIsEditing(false);
    setEditingPattern(null);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPattern(null);
  };
  
  return (
    <div>
      {isEditing ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Edit Pattern</h2>
            <button
              onClick={handleCancelEdit}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
          <PatternForm
            initialPattern={editingPattern || undefined}
            onSave={handleSavePattern}
            onCancel={handleCancelEdit}
          />
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-medium mb-4">Your Custom Patterns</h2>
          
          {userPatterns.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-gray-600 mb-4">You haven't created any custom patterns yet</p>
              <a
                href="/tools/regex-find-replace/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700"
              >
                Create Your First Pattern
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {userPatterns.map(pattern => (
                <div
                  key={pattern.id}
                  className="bg-white p-4 rounded-md border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{pattern.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{pattern.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPattern(pattern)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                        title="Edit pattern"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(pattern.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                        title="Delete pattern"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 font-mono">
                    <div>Search: <span className="text-gray-700">{pattern.searchRegex}</span></div>
                    <div>Replace: <span className="text-gray-700">{pattern.replaceRegex}</span></div>
                  </div>
                  
                  {/* Delete confirmation */}
                  {showDeleteConfirm === pattern.id && (
                    <div className="mt-3 p-3 bg-red-50 rounded-md">
                      <p className="text-sm text-red-800 mb-2">
                        Are you sure you want to delete this pattern? This action cannot be undone.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleDeletePattern(pattern.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
