import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploader } from '../../components/line-filter/FileUploader';

// Mock the store
vi.mock('../../stores/lineFilterStore', () => ({
  lineFilterActions: {
    loadFile: vi.fn().mockResolvedValue(undefined)
  },
  processingStatus: { get: () => 'idle' },
  processingProgress: { get: () => 0 },
  processingError: { get: () => null }
}));

// Mock @nanostores/react
vi.mock('@nanostores/react', () => ({
  useStore: vi.fn((store) => {
    if (store === require('../../stores/lineFilterStore').processingStatus) return 'idle';
    if (store === require('../../stores/lineFilterStore').processingProgress) return 0;
    if (store === require('../../stores/lineFilterStore').processingError) return null;
    return null;
  })
}));

// Mock FileParserService
vi.mock('../../services/FileParserService', () => ({
  FileParserService: {
    getMaxFileSize: () => 5 * 1024 * 1024,
    getMaxLines: () => 10000
  }
}));

describe('FileUploader', () => {
  const mockLoadFile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    require('../../stores/lineFilterStore').lineFilterActions.loadFile = mockLoadFile;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the file uploader component', () => {
    render(<FileUploader />);
    
    expect(screen.getByText(/drop file or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/supports .txt, .csv, .tsv, .log files/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum file size: 5mb/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum lines: 10,000/i)).toBeInTheDocument();
  });

  it('should handle file selection via input', async () => {
    render(<FileUploader />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(mockLoadFile).toHaveBeenCalledWith(file);
    });
  });

  it('should handle drag and drop', async () => {
    render(<FileUploader />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const dropArea = screen.getByText(/drop file or click to browse/i).closest('div');
    
    // Simulate drag over
    fireEvent.dragOver(dropArea!, {
      dataTransfer: {
        files: [file]
      }
    });
    
    expect(screen.getByText(/drop file here/i)).toBeInTheDocument();
    
    // Simulate drop
    fireEvent.drop(dropArea!, {
      dataTransfer: {
        files: [file]
      }
    });
    
    await waitFor(() => {
      expect(mockLoadFile).toHaveBeenCalledWith(file);
    });
  });

  it('should show drag over state', () => {
    render(<FileUploader />);
    
    const dropArea = screen.getByText(/drop file or click to browse/i).closest('div');
    
    fireEvent.dragOver(dropArea!);
    
    expect(screen.getByText(/drop file here/i)).toBeInTheDocument();
    expect(dropArea).toHaveClass('border-blue-400', 'bg-blue-50');
  });

  it('should reset drag over state on drag leave', () => {
    render(<FileUploader />);
    
    const dropArea = screen.getByText(/drop file or click to browse/i).closest('div');
    
    fireEvent.dragOver(dropArea!);
    expect(screen.getByText(/drop file here/i)).toBeInTheDocument();
    
    fireEvent.dragLeave(dropArea!);
    expect(screen.getByText(/drop file or click to browse/i)).toBeInTheDocument();
  });

  it('should show uploading state', () => {
    // Mock uploading state
    vi.mocked(require('@nanostores/react').useStore).mockImplementation((store) => {
      if (store === require('../../stores/lineFilterStore').processingStatus) return 'uploading';
      if (store === require('../../stores/lineFilterStore').processingProgress) return 50;
      return null;
    });

    render(<FileUploader />);
    
    expect(screen.getByText(/uploading\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    // Should show progress bar
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle('width: 50%');
  });

  it('should show processing state', () => {
    // Mock processing state
    vi.mocked(require('@nanostores/react').useStore).mockImplementation((store) => {
      if (store === require('../../stores/lineFilterStore').processingStatus) return 'parsing';
      if (store === require('../../stores/lineFilterStore').processingProgress) return 75;
      return null;
    });

    render(<FileUploader />);
    
    expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should show error state', () => {
    // Mock error state
    vi.mocked(require('@nanostores/react').useStore).mockImplementation((store) => {
      if (store === require('../../stores/lineFilterStore').processingError) return 'File too large';
      return null;
    });

    render(<FileUploader />);
    
    expect(screen.getByText('File too large')).toBeInTheDocument();
  });

  it('should disable interactions when uploading', () => {
    // Mock uploading state
    vi.mocked(require('@nanostores/react').useStore).mockImplementation((store) => {
      if (store === require('../../stores/lineFilterStore').processingStatus) return 'uploading';
      return null;
    });

    render(<FileUploader />);
    
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    const dropArea = screen.getByText(/uploading\.\.\./i).closest('div');
    
    expect(input).toBeDisabled();
    expect(dropArea).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should handle file input click', () => {
    render(<FileUploader />);
    
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    
    const dropArea = screen.getByText(/drop file or click to browse/i).closest('div');
    fireEvent.click(dropArea!);
    
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should not trigger click when uploading', () => {
    // Mock uploading state
    vi.mocked(require('@nanostores/react').useStore).mockImplementation((store) => {
      if (store === require('../../stores/lineFilterStore').processingStatus) return 'uploading';
      return null;
    });

    render(<FileUploader />);
    
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    
    const dropArea = screen.getByText(/uploading\.\.\./i).closest('div');
    fireEvent.click(dropArea!);
    
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(<FileUploader className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should prevent default on drag events', () => {
    render(<FileUploader />);
    
    const dropArea = screen.getByText(/drop file or click to browse/i).closest('div');
    
    const dragOverEvent = new Event('dragover', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');
    
    fireEvent(dropArea!, dragOverEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle load file errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLoadFile.mockRejectedValue(new Error('Upload failed'));
    
    render(<FileUploader />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('File upload failed:', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });
});