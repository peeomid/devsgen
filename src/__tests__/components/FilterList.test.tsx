import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilterList } from '../../components/line-filter/FilterList';
import type { TextFilter, CSVFilter, FilterResult } from '../../types/filters';

// Mock the store
const mockFilters: Record<string, TextFilter | CSVFilter> = {
  'filter1': {
    id: 'filter1',
    pattern: 'error',
    type: 'include',
    caseSensitive: false,
    useRegex: false,
    isActive: true,
    created: new Date('2024-01-01')
  },
  'filter2': {
    id: 'filter2',
    pattern: 'warning',
    type: 'exclude',
    caseSensitive: true,
    useRegex: true,
    isActive: false,
    created: new Date('2024-01-02')
  },
  'filter3': {
    id: 'filter3',
    pattern: 'John',
    type: 'include',
    caseSensitive: false,
    useRegex: false,
    scope: 'column',
    columnIndex: 0,
    columnName: 'Name',
    isActive: true,
    created: new Date('2024-01-03')
  } as CSVFilter
};

const mockResults: Record<string, FilterResult> = {
  'filter1': {
    filterId: 'filter1',
    matchedLines: [1, 3, 5],
    totalMatches: 3,
    processingTime: 45
  }
};

vi.mock('../../stores/lineFilterStore', () => ({
  lineFilterActions: {
    toggleFilter: vi.fn(),
    removeFilter: vi.fn(),
    applyFilter: vi.fn().mockResolvedValue(undefined),
    applyAllActiveFilters: vi.fn().mockResolvedValue(undefined)
  },
  activeFilters: { get: () => mockFilters },
  filterResults: { get: () => mockResults },
  isFiltering: { get: () => false }
}));

// Mock @nanostores/react
vi.mock('@nanostores/react', () => ({
  useStore: vi.fn((store) => {
    if (store === require('../../stores/lineFilterStore').activeFilters) return mockFilters;
    if (store === require('../../stores/lineFilterStore').filterResults) return mockResults;
    if (store === require('../../stores/lineFilterStore').isFiltering) return false;
    return null;
  })
}));

describe('FilterList', () => {
  const mockToggleFilter = vi.fn();
  const mockRemoveFilter = vi.fn();
  const mockApplyFilter = vi.fn();
  const mockApplyAllActiveFilters = vi.fn();
  const mockOnFilterEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    require('../../stores/lineFilterStore').lineFilterActions.toggleFilter = mockToggleFilter;
    require('../../stores/lineFilterStore').lineFilterActions.removeFilter = mockRemoveFilter;
    require('../../stores/lineFilterStore').lineFilterActions.applyFilter = mockApplyFilter;
    require('../../stores/lineFilterStore').lineFilterActions.applyAllActiveFilters = mockApplyAllActiveFilters;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when no filters exist', () => {
    // Mock empty filters
    vi.mocked(require('@nanostores/react').useStore).mockImplementation((store) => {
      if (store === require('../../stores/lineFilterStore').activeFilters) return {};
      if (store === require('../../stores/lineFilterStore').filterResults) return {};
      return false;
    });

    const { container } = render(<FilterList />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render filter list with active filters', () => {
    render(<FilterList />);
    
    expect(screen.getByText(/active filters \(2\/3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/include "error"/i)).toBeInTheDocument();
    expect(screen.getByText(/exclude "warning"/i)).toBeInTheDocument();
    expect(screen.getByText(/include "john" in name/i)).toBeInTheDocument();
  });

  it('should show filter options', () => {
    render(<FilterList />);
    
    // Check for case sensitive and regex tags
    expect(screen.getByText('Case sensitive')).toBeInTheDocument();
    expect(screen.getByText('Regex')).toBeInTheDocument();
  });

  it('should show filter results', () => {
    render(<FilterList />);
    
    expect(screen.getByText('3 matches')).toBeInTheDocument();
    expect(screen.getByText('(45ms)')).toBeInTheDocument();
  });

  it('should handle filter toggle', () => {
    render(<FilterList />);
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    expect(mockToggleFilter).toHaveBeenCalledWith('filter1');
  });

  it('should handle filter removal', () => {
    render(<FilterList />);
    
    const removeButtons = screen.getAllByTitle('Remove filter');
    fireEvent.click(removeButtons[0]);
    
    expect(mockRemoveFilter).toHaveBeenCalledWith('filter1');
  });

  it('should handle individual filter application', async () => {
    render(<FilterList />);
    
    const applyButtons = screen.getAllByTitle('Apply filter');
    fireEvent.click(applyButtons[0]);
    
    await waitFor(() => {
      expect(mockApplyFilter).toHaveBeenCalledWith('filter1');
    });
  });

  it('should handle apply all filters', async () => {
    render(<FilterList />);
    
    const applyAllButton = screen.getByText('Apply All');
    fireEvent.click(applyAllButton);
    
    await waitFor(() => {
      expect(mockApplyAllActiveFilters).toHaveBeenCalled();
    });
  });

  it('should handle clear all filters', () => {
    const mockClearFilters = vi.fn();
    require('../../stores/lineFilterStore').lineFilterActions.clearFilters = mockClearFilters;
    
    render(<FilterList />);
    
    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);
    
    expect(mockClearFilters).toHaveBeenCalled();
  });

  it('should call onFilterEdit when edit button is clicked', () => {
    render(<FilterList onFilterEdit={mockOnFilterEdit} />);
    
    const editButtons = screen.getAllByTitle('Edit filter');
    fireEvent.click(editButtons[0]);
    
    expect(mockOnFilterEdit).toHaveBeenCalledWith('filter1');
  });

  it('should not show edit buttons when onFilterEdit is not provided', () => {
    render(<FilterList />);
    
    const editButtons = screen.queryAllByTitle('Edit filter');
    expect(editButtons).toHaveLength(0);
  });

  it('should disable apply buttons when filtering', () => {
    // Mock filtering state
    vi.mocked(require('@nanostores/react').useStore).mockImplementation((store) => {
      if (store === require('../../stores/lineFilterStore').activeFilters) return mockFilters;
      if (store === require('../../stores/lineFilterStore').filterResults) return mockResults;
      if (store === require('../../stores/lineFilterStore').isFiltering) return true;
      return null;
    });

    render(<FilterList />);
    
    const applyButtons = screen.getAllByTitle('Apply filter');
    const applyAllButton = screen.getByText('Apply All');
    
    applyButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
    expect(applyAllButton).toBeDisabled();
  });

  it('should show filtering indicator when filtering', () => {
    // Mock filtering state
    vi.mocked(require('@nanostores/react').useStore).mockImplementation((store) => {
      if (store === require('../../stores/lineFilterStore').activeFilters) return mockFilters;
      if (store === require('../../stores/lineFilterStore').filterResults) return mockResults;
      if (store === require('../../stores/lineFilterStore').isFiltering) return true;
      return null;
    });

    render(<FilterList />);
    
    expect(screen.getByText('Applying filters...')).toBeInTheDocument();
  });

  it('should handle errors during filter application', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockApplyFilter.mockRejectedValue(new Error('Filter failed'));
    
    render(<FilterList />);
    
    const applyButtons = screen.getAllByTitle('Apply filter');
    fireEvent.click(applyButtons[0]);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to apply filter:', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle errors during apply all filters', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockApplyAllActiveFilters.mockRejectedValue(new Error('Apply all failed'));
    
    render(<FilterList />);
    
    const applyAllButton = screen.getByText('Apply All');
    fireEvent.click(applyAllButton);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to apply filters:', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should not show Apply All button when no active filters', () => {
    // Mock filters with no active ones
    const inactiveFilters = {
      'filter1': { ...mockFilters.filter1, isActive: false },
      'filter2': { ...mockFilters.filter2, isActive: false }
    };
    
    vi.mocked(require('@nanostores/react').useStore).mockImplementation((store) => {
      if (store === require('../../stores/lineFilterStore').activeFilters) return inactiveFilters;
      if (store === require('../../stores/lineFilterStore').filterResults) return {};
      return false;
    });

    render(<FilterList />);
    
    expect(screen.queryByText('Apply All')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<FilterList className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should display correct filter display names for CSV filters', () => {
    render(<FilterList />);
    
    expect(screen.getByText(/include "john" in name/i)).toBeInTheDocument();
  });

  it('should display correct filter display names for text filters', () => {
    render(<FilterList />);
    
    expect(screen.getByText(/include "error"/i)).toBeInTheDocument();
    expect(screen.getByText(/exclude "warning"/i)).toBeInTheDocument();
  });

  it('should show only apply button for active filters', () => {
    render(<FilterList />);
    
    // filter1 and filter3 are active, filter2 is not
    const applyButtons = screen.getAllByTitle('Apply filter');
    expect(applyButtons).toHaveLength(2);
  });
});