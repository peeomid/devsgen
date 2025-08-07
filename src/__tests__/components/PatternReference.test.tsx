import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PatternReference from '../../components/regex/PatternReference';
import type { Pattern } from '../../types/pattern';

// Mock pattern for testing
const mockPattern: Pattern = {
  id: 'test-pattern',
  keyNumber: 1,
  shortKeys: ['test', 'tst'],
  name: 'Test Pattern',
  description: 'A test pattern for unit testing',
  category: 'TEXT_EXTRACTION' as any,
  searchRegex: '\\d+',
  replaceRegex: 'NUMBER',
  flags: 'g',
  example: {
    input: '123 456 789',
    output: 'NUMBER NUMBER NUMBER'
  },
  isBuiltIn: true,
  tags: ['test', 'numbers'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
};

describe('PatternReference', () => {
  it('should display pattern name and description', () => {
    render(<PatternReference pattern={mockPattern} />);
    
    expect(screen.getByText('Test Pattern')).toBeInTheDocument();
    expect(screen.getByText('A test pattern for unit testing')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
  });

  it('should display pattern category', () => {
    render(<PatternReference pattern={mockPattern} />);
    expect(screen.getByText('TEXT_EXTRACTION')).toBeInTheDocument();
  });

  it('should display short keys', () => {
    render(<PatternReference pattern={mockPattern} />);
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('tst')).toBeInTheDocument();
  });

  it('should display example section when expanded on desktop', () => {
    render(<PatternReference pattern={mockPattern} isMobile={false} />);
    
    expect(screen.getByText('Example')).toBeInTheDocument();
    expect(screen.getByText('123 456 789')).toBeInTheDocument();
    expect(screen.getByText('NUMBER NUMBER NUMBER')).toBeInTheDocument();
  });

  it('should display original pattern details when expanded on desktop', () => {
    render(<PatternReference pattern={mockPattern} isMobile={false} />);
    
    expect(screen.getByText('Original Pattern')).toBeInTheDocument();
    expect(screen.getByText('\\d+')).toBeInTheDocument();
    expect(screen.getByText('NUMBER')).toBeInTheDocument();
    expect(screen.getByText('g')).toBeInTheDocument();
  });

  it('should display tags when expanded on desktop', () => {
    render(<PatternReference pattern={mockPattern} isMobile={false} />);
    
    // Find the Tags section button and click to expand
    const tagsButton = screen.getByRole('button', { name: /Tags/i });
    fireEvent.click(tagsButton);
    
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getAllByText('test')).toHaveLength(2); // One in short keys, one in tags
    expect(screen.getByText('numbers')).toBeInTheDocument();
  });

  it('should handle mobile layout with collapsible sections', () => {
    render(<PatternReference pattern={mockPattern} isMobile={true} />);
    
    // Should show pattern name and category
    expect(screen.getByText('Test Pattern')).toBeInTheDocument();
    expect(screen.getByText('TEXT_EXTRACTION')).toBeInTheDocument();
    
    // Details should be hidden initially on mobile
    expect(screen.queryByText('123 456 789')).not.toBeInTheDocument();
    
    // Click to expand details
    const toggleButton = screen.getByRole('button', { name: 'Toggle details' });
    fireEvent.click(toggleButton);
    
    // Now expand the Example section to see details
    const exampleButton = screen.getByRole('button', { name: /Example/i });
    fireEvent.click(exampleButton);
    
    // Details should now be visible
    expect(screen.getByText('123 456 789')).toBeInTheDocument();
  });

  it('should handle pattern without example', () => {
    const patternWithoutExample = { ...mockPattern, example: undefined };
    render(<PatternReference pattern={patternWithoutExample} />);
    
    expect(screen.getByText('Test Pattern')).toBeInTheDocument();
    expect(screen.queryByText('Example')).not.toBeInTheDocument();
  });

  it('should handle pattern without flags', () => {
    const patternWithoutFlags = { ...mockPattern, flags: undefined };
    render(<PatternReference pattern={patternWithoutFlags} />);
    
    expect(screen.getByText('Original Pattern')).toBeInTheDocument();
    expect(screen.getByText('\\d+')).toBeInTheDocument();
    expect(screen.getByText('NUMBER')).toBeInTheDocument();
    expect(screen.queryByText('Flags:')).not.toBeInTheDocument();
  });

  it('should handle pattern without tags', () => {
    const patternWithoutTags = { ...mockPattern, tags: [] };
    render(<PatternReference pattern={patternWithoutTags} />);
    
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });

  it('should handle pattern without short keys', () => {
    const patternWithoutShortKeys = { ...mockPattern, shortKeys: [] };
    render(<PatternReference pattern={patternWithoutShortKeys} />);
    
    expect(screen.getByText('Test Pattern')).toBeInTheDocument();
    expect(screen.queryByText('test')).not.toBeInTheDocument();
  });

  it('should toggle collapsible sections', () => {
    render(<PatternReference pattern={mockPattern} isMobile={false} />);
    
    // Find the Example section button
    const exampleButton = screen.getByRole('button', { name: /Example/i });
    
    // Example should be expanded by default on desktop
    expect(screen.getByText('123 456 789')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(exampleButton);
    
    // Example should be hidden
    expect(screen.queryByText('123 456 789')).not.toBeInTheDocument();
    
    // Click to expand again
    fireEvent.click(exampleButton);
    
    // Example should be visible again
    expect(screen.getByText('123 456 789')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes for collapsible sections', () => {
    render(<PatternReference pattern={mockPattern} />);
    
    const exampleButton = screen.getByRole('button', { name: /Example/i });
    expect(exampleButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click to collapse
    fireEvent.click(exampleButton);
    expect(exampleButton).toHaveAttribute('aria-expanded', 'false');
  });
});