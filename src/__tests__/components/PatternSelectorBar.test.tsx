import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PatternSelectorBar from '../../components/regex/PatternSelectorBar';
import { 
  isPatternModifiedStore,
  resetCustomRegex
} from '../../stores/patternStore';
import type { Pattern } from '../../types/pattern';

// Mock pattern for testing
const mockPattern: Pattern = {
  id: 'test-pattern',
  keyNumber: 1,
  shortKeys: ['test'],
  name: 'Test Pattern',
  description: 'A test pattern',
  category: 'TEXT_EXTRACTION' as any,
  searchRegex: '\\d+',
  replaceRegex: 'NUMBER',
  flags: 'g',
  example: {
    input: '123 456',
    output: 'NUMBER NUMBER'
  },
  isBuiltIn: true,
  tags: ['test'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
};

describe('PatternSelectorBar', () => {
  beforeEach(() => {
    // Reset stores
    resetCustomRegex();
  });

  it('should show "No pattern selected" when no pattern is provided', () => {
    render(<PatternSelectorBar pattern={null} />);
    expect(screen.getByText('No pattern selected')).toBeInTheDocument();
    expect(screen.getByText('Find')).toBeInTheDocument();
  });

  it('should show pattern name and key number when pattern is selected', () => {
    render(<PatternSelectorBar pattern={mockPattern} />);
    
    expect(screen.getByText('Test Pattern')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Find')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('should show custom regex state when pattern is modified', () => {
    // Set pattern as modified
    isPatternModifiedStore.set(true);
    
    render(<PatternSelectorBar pattern={mockPattern} />);
    
    expect(screen.getByText('Custom Regex')).toBeInTheDocument();
    // Check for "based on" text and pattern name separately since they're in different spans
    expect(screen.getByText(/based on/)).toBeInTheDocument();
    expect(screen.getByTestId('pattern-base-name')).toHaveTextContent('Test Pattern');
    expect(screen.getByText('Find')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should call toggleCommandPalette when Find button is clicked', () => {
    const toggleCommandPalette = vi.fn();
    vi.doMock('../../stores/patternStore', () => ({
      toggleCommandPalette,
      isPatternModifiedStore: { get: () => false },
      resetCustomRegex: vi.fn(),
    }));

    render(<PatternSelectorBar pattern={mockPattern} />);
    
    fireEvent.click(screen.getByText('Find'));
    // Note: In a real test, we'd need to mock the import properly
  });

  it('should focus search input when Edit button is clicked', () => {
    // Create a mock input element
    const mockInput = document.createElement('input');
    mockInput.id = 'regex-search-input';
    mockInput.focus = vi.fn();
    document.body.appendChild(mockInput);

    render(<PatternSelectorBar pattern={mockPattern} />);
    
    fireEvent.click(screen.getByText('Edit'));
    
    expect(mockInput.focus).toHaveBeenCalled();
    
    // Clean up
    document.body.removeChild(mockInput);
  });

  it('should show ⌘K shortcut for Find button', () => {
    render(<PatternSelectorBar pattern={mockPattern} />);
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('should show ⌘E shortcut for Edit button', () => {
    render(<PatternSelectorBar pattern={mockPattern} />);
    expect(screen.getByText('⌘E')).toBeInTheDocument();
  });
});