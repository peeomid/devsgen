import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { PatternService } from '../../services/PatternService';
import type { Pattern, PatternInput, PatternCategory } from '../../types/pattern';
import { patternsStore, createPattern, updatePattern } from '../../stores/patternStore';

interface PatternFormProps {
  initialPattern?: Pattern;
  onSave?: (pattern: Pattern) => void;
  onCancel?: () => void;
}

const patternService = new PatternService();

const CATEGORIES: PatternCategory[] = [
  'Text Formatting',
  'Data Extraction',
  'Validation',
  'Code',
  'Date & Time',
  'URL',
  'Other'
];

export default function PatternForm({ initialPattern, onSave, onCancel }: PatternFormProps) {
  const [formData, setFormData] = useState<PatternInput>({
    id: '',
    name: '',
    description: '',
    category: 'Other',
    searchRegex: '',
    replaceRegex: '',
    example: {
      input: '',
      output: ''
    },
    tags: [],
    shortKeys: [],
    isBuiltIn: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  const [shortKeyInput, setShortKeyInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  
  // Initialize form with pattern data if editing
  useEffect(() => {
    if (initialPattern) {
      setFormData({
        ...initialPattern,
        tags: [...initialPattern.tags]
      });
      setIsEditing(true);
    }
  }, [initialPattern]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'example.input' || name === 'example.output') {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for the field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Add a tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim();
    if (!formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
    }
    setTagInput('');
  };
  
  // Remove a tag
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  // Add a short key
  const handleAddShortKey = () => {
    if (!shortKeyInput.trim()) return;
    
    const newShortKey = shortKeyInput.trim();
    
    // Validate short key (max 3 characters, alphanumeric)
    if (newShortKey.length > 3) {
      setErrors(prev => ({
        ...prev,
        shortKey: 'Short keys must be 3 characters or less'
      }));
      return;
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(newShortKey)) {
      setErrors(prev => ({
        ...prev,
        shortKey: 'Short keys must be alphanumeric'
      }));
      return;
    }
    
    if (!formData.shortKeys.includes(newShortKey)) {
      setFormData(prev => ({
        ...prev,
        shortKeys: [...prev.shortKeys, newShortKey]
      }));
      setErrors(prev => ({
        ...prev,
        shortKey: ''
      }));
    }
    
    setShortKeyInput('');
  };
  
  // Remove a short key
  const handleRemoveShortKey = (key: string) => {
    setFormData(prev => ({
      ...prev,
      shortKeys: prev.shortKeys.filter(k => k !== key)
    }));
  };
  
  // Test the pattern
  const handleTestPattern = () => {
    setTestResult(null);
    setTestError(null);
    
    try {
      const result = patternService.testPattern({
        searchRegex: formData.searchRegex,
        replaceRegex: formData.replaceRegex,
        input: formData.example.input
      });
      
      setTestResult(result.output);
      
      // Update the expected output
      setFormData(prev => ({
        ...prev,
        example: {
          ...prev.example,
          output: result.output
        }
      }));
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'An error occurred while testing the pattern');
    }
  };
  
  // Validate the form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.searchRegex.trim()) {
      newErrors.searchRegex = 'Search regex is required';
    }
    
    if (!formData.example.input.trim()) {
      newErrors['example.input'] = 'Example input is required';
    }
    
    try {
      // Test if the regex is valid
      new RegExp(formData.searchRegex);
    } catch (error) {
      newErrors.searchRegex = 'Invalid regular expression';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      let pattern: Pattern;
      
      if (isEditing) {
        // Update existing pattern
        pattern = await patternService.updatePattern(formData);
        updatePattern(pattern);
      } else {
        // Create new pattern
        pattern = await patternService.createPattern(formData);
        createPattern(pattern);
      }
      
      if (onSave) {
        onSave(pattern);
      }
    } catch (error) {
      console.error('Failed to save pattern:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save pattern'
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic information */}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            } shadow-sm focus:border-primary focus:ring-primary sm:text-sm`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            value={formData.description}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            } shadow-sm focus:border-primary focus:ring-primary sm:text-sm`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Regex patterns */}
      <div className="space-y-4">
        <div>
          <label htmlFor="searchRegex" className="block text-sm font-medium text-gray-700">
            Search Pattern
          </label>
          <input
            type="text"
            id="searchRegex"
            name="searchRegex"
            value={formData.searchRegex}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border ${
              errors.searchRegex ? 'border-red-300' : 'border-gray-300'
            } shadow-sm focus:border-primary focus:ring-primary sm:text-sm font-mono`}
          />
          {errors.searchRegex && (
            <p className="mt-1 text-sm text-red-600">{errors.searchRegex}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="replaceRegex" className="block text-sm font-medium text-gray-700">
            Replace Pattern
          </label>
          <input
            type="text"
            id="replaceRegex"
            name="replaceRegex"
            value={formData.replaceRegex}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm font-mono"
          />
        </div>
      </div>
      
      {/* Example */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Example</h3>
        
        <div>
          <label htmlFor="example.input" className="block text-sm font-medium text-gray-700">
            Input
          </label>
          <textarea
            id="example.input"
            name="example.input"
            rows={3}
            value={formData.example.input}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border ${
              errors['example.input'] ? 'border-red-300' : 'border-gray-300'
            } shadow-sm focus:border-primary focus:ring-primary sm:text-sm font-mono`}
          />
          {errors['example.input'] && (
            <p className="mt-1 text-sm text-red-600">{errors['example.input']}</p>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="example.output" className="block text-sm font-medium text-gray-700">
              Expected Output
            </label>
            <button
              type="button"
              onClick={handleTestPattern}
              className="text-sm text-primary hover:text-blue-700"
            >
              Test Pattern
            </button>
          </div>
          
          <textarea
            id="example.output"
            name="example.output"
            rows={3}
            value={formData.example.output}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm font-mono"
            readOnly={testResult !== null}
          />
          
          {testResult && (
            <p className="mt-1 text-sm text-green-600">
              Test successful! The output matches the expected result.
            </p>
          )}
          
          {testError && (
            <p className="mt-1 text-sm text-red-600">{testError}</p>
          )}
        </div>
      </div>
      
      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="block w-full rounded-none rounded-l-md border border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
            placeholder="Add a tag"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
          >
            Add
          </button>
        </div>
        
        {formData.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                >
                  <span className="sr-only">Remove tag {tag}</span>
                  <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                    <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Short Keys */}
      <div>
        <label htmlFor="shortKeys" className="block text-sm font-medium text-gray-700">
          Short Keys (max 3 characters each)
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="shortKeys"
            value={shortKeyInput}
            onChange={(e) => setShortKeyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddShortKey();
              }
            }}
            className="block w-full rounded-none rounded-l-md border border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
            placeholder="Add a short key"
            maxLength={3}
          />
          <button
            type="button"
            onClick={handleAddShortKey}
            className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
          >
            Add
          </button>
        </div>
        
        {errors.shortKey && (
          <p className="mt-1 text-sm text-red-600">{errors.shortKey}</p>
        )}
        
        <p className="mt-1 text-xs text-gray-500">
          Short keys are used for quick access to patterns. They must be alphanumeric and maximum 3 characters.
        </p>
        
        {formData.shortKeys.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.shortKeys.map(key => (
              <span
                key={key}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {key}
                <button
                  type="button"
                  onClick={() => handleRemoveShortKey(key)}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                >
                  <span className="sr-only">Remove short key {key}</span>
                  <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                    <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Form actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {isEditing ? 'Update Pattern' : 'Create Pattern'}
        </button>
      </div>
      
      {/* Form-level error */}
      {errors.submit && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md">
          {errors.submit}
        </div>
      )}
    </form>
  );
}
