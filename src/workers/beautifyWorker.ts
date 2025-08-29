import { beautify } from '../lib/beautify/beautify.ts';
import type { WorkerRequest, WorkerMessage } from '../types/beautify.ts';

const CHUNK_SIZE = 5000; // Characters per chunk for progress reporting

let currentRequestId: string | null = null;
let cancelled = false;

self.onmessage = function(e: MessageEvent<WorkerRequest | { type: 'cancel'; id: string }>) {
  const message = e.data;

  if ('type' in message && message.type === 'cancel') {
    if (currentRequestId === message.id) {
      cancelled = true;
    }
    return;
  }

  const request = message as WorkerRequest;
  
  // Cancel any existing request
  if (currentRequestId && currentRequestId !== request.id) {
    cancelled = true;
  }

  currentRequestId = request.id;
  cancelled = false;

  processRequest(request);
};

async function processRequest(request: WorkerRequest) {
  const { id, text, options } = request;

  try {
    const textLength = text.length;
    
    // For small texts, process directly
    if (textLength <= CHUNK_SIZE) {
      if (cancelled) return;
      
      const result = beautify(text, options);
      
      if (!cancelled) {
        const response: WorkerMessage = {
          id,
          type: 'result',
          result
        };
        self.postMessage(response);
      }
      return;
    }

    // For larger texts, process in chunks with progress updates
    const totalChunks = Math.ceil(textLength / CHUNK_SIZE);
    let processedChunks = 0;

    // Send initial progress
    sendProgress(id, 0, totalChunks);

    // Process the full text (chunking is mainly for progress reporting)
    // In a more sophisticated implementation, we could process incrementally
    const result = await processWithProgress(text, options, (progress) => {
      if (cancelled) return;
      processedChunks = Math.floor(progress * totalChunks);
      sendProgress(id, processedChunks, totalChunks);
    });

    if (!cancelled) {
      sendProgress(id, totalChunks, totalChunks);
      
      const response: WorkerMessage = {
        id,
        type: 'result',
        result
      };
      self.postMessage(response);
    }

  } catch (error) {
    if (!cancelled) {
      const response: WorkerMessage = {
        id,
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
      self.postMessage(response);
    }
  }
}

async function processWithProgress(
  text: string, 
  options: any, 
  onProgress: (progress: number) => void
): Promise<any> {
  // Simulate progress for demonstration
  // In a real implementation, you might process tokens incrementally
  
  onProgress(0.1); // Tokenization start
  await sleep(10);
  
  if (cancelled) throw new Error('Cancelled');
  
  onProgress(0.3); // Tokenization complete
  await sleep(10);
  
  if (cancelled) throw new Error('Cancelled');
  
  onProgress(0.7); // Formatting in progress
  await sleep(10);
  
  if (cancelled) throw new Error('Cancelled');
  
  // Do the actual work
  const result = beautify(text, options);
  
  onProgress(0.9); // Almost done
  await sleep(5);
  
  onProgress(1.0); // Complete
  
  return result;
}

function sendProgress(id: string, processed: number, total: number) {
  const response: WorkerMessage = {
    id,
    type: 'progress',
    processed,
    total
  };
  self.postMessage(response);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export {}; // Make this a module