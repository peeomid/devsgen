import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JSONInput from '../../components/json-viewer/JSONInput';

// Mock the store
vi.mock('../../stores/jsonViewerStore', () => ({
  jsonViewerActions: {
    loadJSONFromFile: vi.fn(),
    loadJSONFromText: vi.fn(),
    setDragover: vi.fn()
  },
  processingStatus: { get: () => 'idle' },
  processingProgress: { get: () => 0 },
  processingError: { get: () => null },
  isDragover: { get: () => false }
}));

vi.mock('@nanostores/react', () => ({
  useStore: (store: any) => store.get()
}));

describe('JSONInput Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component', () => {
    render(<JSONInput />);
    
    expect(screen.getByText('Load JSON Data')).toBeInTheDocument();
    expect(screen.getByText('Upload a JSON file or paste JSON directly')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste your JSON data here/)).toBeInTheDocument();
  });

  it('should show file upload area', () => {
    render(<JSONInput />);
    
    expect(screen.getByText('Drop JSON file or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Supports .json and .jsonl files')).toBeInTheDocument();
  });

  it('should validate JSON input', async () => {
    const user = userEvent.setup();
    render(<JSONInput />);
    
    const textarea = screen.getByPlaceholderText(/Paste your JSON data here/);
    
    // Test valid JSON
    await user.type(textarea, '{"name": "test", "value": 123}');
    
    await waitFor(() => {
      expect(screen.getByText(/Valid JSON/)).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid JSON', async () => {
    const user = userEvent.setup();
    render(<JSONInput />);
    
    const textarea = screen.getByPlaceholderText(/Paste your JSON data here/);
    
    // Test invalid JSON
    await user.type(textarea, '{"name": "test", "value":}');
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
    });
  });

  it('should enable process button only for valid JSON', async () => {
    const user = userEvent.setup();
    render(<JSONInput />);
    
    const textarea = screen.getByPlaceholderText(/Paste your JSON data here/);
    const processButton = screen.getByRole('button', { name: /Load JSON/ });
    
    // Initially disabled
    expect(processButton).toBeDisabled();
    
    // Enable after valid JSON
    await user.type(textarea, '{"valid": true}');
    
    await waitFor(() => {
      expect(processButton).toBeEnabled();
    });
  });

  it('should show JSON type and size information', async () => {
    const user = userEvent.setup();
    render(<JSONInput />);
    
    const textarea = screen.getByPlaceholderText(/Paste your JSON data here/);
    
    // Test array JSON
    await user.type(textarea, '[1, 2, 3]');
    
    await waitFor(() => {
      expect(screen.getByText(/Array/)).toBeInTheDocument();
    });
    
    // Clear and test object JSON
    await user.clear(textarea);
    await user.type(textarea, '{"test": "object"}');
    
    await waitFor(() => {
      expect(screen.getByText(/Object/)).toBeInTheDocument();
    });
  });

  it('should show large file warning', async () => {
    const user = userEvent.setup();
    render(<JSONInput />);
    
    const textarea = screen.getByPlaceholderText(/Paste your JSON data here/);
    
    // Create a large JSON string (> 10MB)
    const largeObject: any = {};
    for (let i = 0; i < 100000; i++) {
      largeObject[`key_${i}`] = `value_${i}_with_lots_of_text_to_make_it_large`;
    }
    const largeJSON = JSON.stringify(largeObject);
    
    await user.type(textarea, largeJSON);
    
    await waitFor(() => {
      expect(screen.getByText(/Large JSON File Detected/)).toBeInTheDocument();
    });
  });

  it('should handle file input', async () => {
    const { jsonViewerActions } = await import('../../stores/jsonViewerStore');
    render(<JSONInput />);
    
    const fileInput = screen.getByRole('button', { name: /Drop JSON file or click to browse/ });
    const hiddenInput = fileInput.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    const testFile = new File(['{"test": "file"}'], 'test.json', { type: 'application/json' });
    
    await userEvent.upload(hiddenInput, testFile);
    
    expect(jsonViewerActions.loadJSONFromFile).toHaveBeenCalledWith(testFile);
  });

  it('should handle drag and drop', async () => {
    const { jsonViewerActions } = await import('../../stores/jsonViewerStore');
    render(<JSONInput />);
    
    const dropArea = screen.getByRole('button', { name: /Drop JSON file or click to browse/ });
    const testFile = new File(['{"test": "drop"}'], 'test.json', { type: 'application/json' });
    
    const dataTransfer = {
      files: [testFile],
      types: ['Files']
    };
    
    // Simulate drag over
    fireEvent.dragOver(dropArea, { dataTransfer });
    expect(jsonViewerActions.setDragover).toHaveBeenCalledWith(true);
    
    // Simulate drop
    fireEvent.drop(dropArea, { dataTransfer });
    expect(jsonViewerActions.setDragover).toHaveBeenCalledWith(false);
    expect(jsonViewerActions.loadJSONFromFile).toHaveBeenCalledWith(testFile);
  });

  it('should clear text input', async () => {
    const user = userEvent.setup();
    render(<JSONInput />);
    
    const textarea = screen.getByPlaceholderText(/Paste your JSON data here/);
    
    await user.type(textarea, '{"test": "clear"}');
    
    const clearButton = screen.getByRole('button', { name: /Clear/ });
    await user.click(clearButton);
    
    expect(textarea).toHaveValue('');
  });
});