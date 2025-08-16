// Line Filter Web Worker
// Handles filtering operations without blocking the main UI thread

let currentData = null;
let currentDataType = null;

self.onmessage = function(e) {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'setData':
      setData(payload);
      break;
    case 'filter':
      performFilter(payload);
      break;
    case 'clear':
      clearData();
      break;
    default:
      sendError(`Unknown message type: ${type}`);
  }
};

function setData(payload) {
  try {
    currentData = payload.data;
    currentDataType = payload.dataType;
    
    self.postMessage({
      type: 'dataSet',
      payload: {
        success: true,
        lineCount: currentData ? currentData.length : 0,
        dataType: currentDataType
      }
    });
  } catch (error) {
    sendError(`Failed to set data: ${error.message}`);
  }
}

function performFilter(payload) {
  try {
    const {
      filterId,
      pattern,
      patterns,
      filterType,
      caseSensitive,
      useRegex,
      columnIndex,
      scope
    } = payload;
    
    if (!currentData) {
      sendError('No data loaded for filtering');
      return;
    }
    
    const startTime = performance.now();
    const matchedLines = [];
    const totalLines = currentData.length;
    let processedLines = 0;
    
    // Create matchers array for OR logic support
    const patternsToUse = patterns && patterns.length > 0 ? patterns : [pattern];
    let matchers = [];
    
    if (useRegex) {
      try {
        const flags = caseSensitive ? 'g' : 'gi';
        matchers = patternsToUse.map(p => new RegExp(p, flags));
      } catch (regexError) {
        sendError(`Invalid regex pattern: ${regexError.message}`);
        return;
      }
    } else {
      matchers = patternsToUse.map(p => caseSensitive ? p : p.toLowerCase());
    }
    
    // Process lines in chunks to allow for progress updates
    const chunkSize = 500;
    let currentIndex = 0;
    
    function processChunk() {
      const endIndex = Math.min(currentIndex + chunkSize, totalLines);
      
      for (let i = currentIndex; i < endIndex; i++) {
        const line = currentData[i];
        let textToSearch = '';
        
        if (currentDataType === 'csv') {
          if (scope === 'column' && typeof columnIndex === 'number') {
            // Search specific column
            textToSearch = line.data && line.data[columnIndex] ? line.data[columnIndex] : '';
          } else {
            // Search all columns (original content)
            textToSearch = line.originalContent || '';
          }
        } else {
          // Text data
          textToSearch = line.content || '';
        }
        
        let isMatch = false;
        
        // Test against all patterns (OR logic)
        if (useRegex) {
          isMatch = matchers.some(matcher => {
            if (matcher instanceof RegExp) {
              const result = matcher.test(textToSearch);
              // Reset regex for next test
              matcher.lastIndex = 0;
              return result;
            }
            return false;
          });
        } else {
          const searchText = caseSensitive ? textToSearch : textToSearch.toLowerCase();
          isMatch = matchers.some(matcher => searchText.includes(matcher));
        }
        
        // Apply include/exclude logic
        const shouldInclude = (filterType === 'include' && isMatch) || 
                             (filterType === 'exclude' && !isMatch);
        
        if (shouldInclude) {
          matchedLines.push(line.lineNumber);
        }
        
        processedLines++;
      }
      
      // Send progress update
      const progress = Math.round((processedLines / totalLines) * 100);
      self.postMessage({
        type: 'progress',
        payload: {
          filterId,
          progress,
          processedLines,
          totalLines
        }
      });
      
      currentIndex = endIndex;
      
      if (currentIndex < totalLines) {
        // Continue processing in next chunk
        setTimeout(processChunk, 0);
      } else {
        // Filtering complete
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        self.postMessage({
          type: 'complete',
          payload: {
            filterId,
            matchedLines,
            totalMatches: matchedLines.length,
            processingTime: Math.round(processingTime)
          }
        });
      }
    }
    
    // Start processing
    processChunk();
    
  } catch (error) {
    sendError(`Filter operation failed: ${error.message}`);
  }
}

function clearData() {
  currentData = null;
  currentDataType = null;
  
  self.postMessage({
    type: 'dataCleared',
    payload: { success: true }
  });
}

function sendError(message) {
  self.postMessage({
    type: 'error',
    payload: { error: message }
  });
}

// Handle worker errors
self.onerror = function(error) {
  sendError(`Worker error: ${error.message}`);
};

// Initial ready message
self.postMessage({
  type: 'ready',
  payload: { message: 'Filter worker ready' }
});