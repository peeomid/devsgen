// JSON Filter Web Worker
// Import JSONPath library
importScripts('/jsonpath-plus.js');

let storedJSON = null;
let parsedJSON = null;
let fileId = null;

// Message handler
self.onmessage = function(event) {
  const { type, data, requestId } = event.data;

  try {
    switch (type) {
      case 'setJSON':
        handleSetJSON(data, requestId);
        break;
      case 'filter':
        handleFilter(data, requestId);
        break;
      case 'searchValue':
        handleSearchValue(data, requestId);
        break;
      case 'searchPath':
        handleSearchPath(data, requestId);
        break;
      case 'unifiedSearch':
        handleUnifiedSearch(data, requestId);
        break;
      case 'clear':
        handleClear(requestId);
        break;
      default:
        sendError(requestId, `Unknown message type: ${type}`);
    }
  } catch (error) {
    sendError(requestId, error.message);
  }
};

function handleSetJSON(data, requestId) {
  try {
    sendProgress(requestId, 10, 'Receiving JSON data');
    
    const { json, fileId: newFileId } = data;
    storedJSON = json;
    fileId = newFileId;
    
    sendProgress(requestId, 50, 'Parsing JSON');
    
    // Parse JSON with basic validation
    try {
      parsedJSON = JSON.parse(json);
    } catch (error) {
      throw new Error(`JSON parsing failed: ${error.message}. Please ensure your JSON is properly formatted.`);
    }
    
    sendProgress(requestId, 100, 'JSON ready');
    
    sendComplete(requestId, {
      success: true,
      fileId: newFileId,
      size: json.length
    });
  } catch (error) {
    sendError(requestId, `Failed to set JSON: ${error.message}`);
  }
}

function handleFilter(data, requestId) {
  try {
    if (!parsedJSON) {
      throw new Error('No JSON data loaded');
    }

    sendProgress(requestId, 10, 'Starting filter operation');

    const { filterSets } = data;
    const activeFilters = filterSets.filter(fs => fs.active);

    if (activeFilters.length === 0) {
      sendComplete(requestId, {
        filteredJSON: parsedJSON,
        matchCount: 0,
        matchedPaths: [],
        processingTime: 0
      });
      return;
    }

    const startTime = Date.now();
    
    sendProgress(requestId, 30, 'Applying filters');

    // Simple filtering implementation - will enhance later
    let result = parsedJSON;
    let matchedPaths = [];
    let matchCount = 0;

    for (const filter of activeFilters) {
      sendProgress(requestId, 30 + (activeFilters.indexOf(filter) / activeFilters.length) * 60, `Applying ${filter.name}`);
      
      if (filter.type === 'value') {
        // Value filtering - search for values
        const matches = findValueMatches(result, filter.values);
        matchedPaths = [...matchedPaths, ...matches.paths];
        matchCount += matches.count;
      } else if (filter.type === 'path') {
        // Path filtering - basic implementation for now
        const matches = findPathMatches(result, filter.values);
        matchedPaths = [...matchedPaths, ...matches.paths];
        matchCount += matches.count;
        result = matches.filtered;
      }
    }

    const processingTime = Date.now() - startTime;

    sendProgress(requestId, 100, 'Filter operation complete');

    sendComplete(requestId, {
      filteredJSON: result,
      matchCount,
      matchedPaths: [...new Set(matchedPaths)], // Remove duplicates
      processingTime
    });
  } catch (error) {
    sendError(requestId, `Filter operation failed: ${error.message}`);
  }
}

function handleSearchValue(data, requestId) {
  try {
    if (!parsedJSON) {
      throw new Error('No JSON data loaded');
    }

    sendProgress(requestId, 10, 'Starting value search');

    const { value } = data;
    const startTime = Date.now();
    
    sendProgress(requestId, 30, 'Searching for values');

    const matches = findValueMatches(parsedJSON, [value]);
    
    sendProgress(requestId, 80, 'Building filtered result');

    // For value search, show the original JSON with matched paths highlighted
    const result = {
      filteredJSON: parsedJSON,
      matchCount: matches.count,
      matchedPaths: matches.paths,
      processingTime: Date.now() - startTime
    };

    sendProgress(requestId, 100, 'Value search complete');
    sendComplete(requestId, result);
  } catch (error) {
    sendError(requestId, `Value search failed: ${error.message}`);
  }
}

function handleSearchPath(data, requestId) {
  try {
    if (!parsedJSON) {
      throw new Error('No JSON data loaded');
    }

    sendProgress(requestId, 10, 'Starting path search');

    const { path } = data;
    const startTime = Date.now();
    
    sendProgress(requestId, 30, 'Searching for path');

    const matches = findPathMatches(parsedJSON, [path]);
    
    sendProgress(requestId, 80, 'Building filtered result');

    const result = {
      filteredJSON: matches.filtered,
      matchCount: matches.count,
      matchedPaths: matches.paths,
      processingTime: Date.now() - startTime
    };

    sendProgress(requestId, 100, 'Path search complete');
    sendComplete(requestId, result);
  } catch (error) {
    sendError(requestId, `Path search failed: ${error.message}`);
  }
}

function handleUnifiedSearch(data, requestId) {
  try {
    if (!parsedJSON) {
      throw new Error('No JSON data loaded');
    }

    sendProgress(requestId, 10, 'Starting unified search');

    const { query, searchType, pathScope } = data;
    const startTime = Date.now();
    
    sendProgress(requestId, 30, 'Performing search');

    let allMatches = [];
    let totalCount = 0;

    // Scope the search to a specific path if provided
    let searchTarget = parsedJSON;
    let baseScope = '';
    
    if (pathScope) {
      try {
        // Use JSONPath to get the scoped object
        const scopedResults = JSONPath({
          path: '$.' + pathScope,
          json: parsedJSON,
          resultType: 'all'
        });
        
        if (scopedResults.length > 0) {
          searchTarget = scopedResults[0].value;
          baseScope = pathScope;
        }
      } catch (error) {
        console.warn('Path scope error, searching entire JSON:', error);
      }
    }

    sendProgress(requestId, 50, 'Analyzing matches');

    // Search based on type
    if (searchType === 'both' || searchType === 'values') {
      const valueMatches = findValueMatches(searchTarget, [query], baseScope);
      allMatches.push(...valueMatches.paths);
      totalCount += valueMatches.count;
    }

    if (searchType === 'both' || searchType === 'properties') {
      const propertyMatches = findPropertyMatches(searchTarget, query, baseScope);
      allMatches.push(...propertyMatches.paths);
      totalCount += propertyMatches.count;
    }

    sendProgress(requestId, 80, 'Building filtered result');

    // Remove duplicates and build filtered JSON showing only matches + parents
    const uniquePaths = [...new Set(allMatches)];
    const filteredJSON = buildFilteredTreeFromPaths(parsedJSON, uniquePaths);

    const result = {
      filteredJSON: filteredJSON,
      matchCount: totalCount,
      matchedPaths: uniquePaths,
      processingTime: Date.now() - startTime
    };

    sendProgress(requestId, 100, 'Unified search complete');
    sendComplete(requestId, result);
  } catch (error) {
    sendError(requestId, `Unified search failed: ${error.message}`);
  }
}

function handleClear(requestId) {
  storedJSON = null;
  parsedJSON = null;
  fileId = null;
  
  sendComplete(requestId, { success: true });
}

// Helper functions for filtering
function findValueMatches(obj, values, currentPath = '') {
  let paths = [];
  let count = 0;

  function traverse(current, path) {
    if (typeof current === 'string') {
      for (const value of values) {
        if (current.toLowerCase().includes(value.toLowerCase())) {
          paths.push(path);
          count++;
          break;
        }
      }
    } else if (typeof current === 'object' && current !== null) {
      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          traverse(item, `${path}[${index}]`);
        });
      } else {
        Object.keys(current).forEach(key => {
          const newPath = path ? `${path}.${key}` : key;
          traverse(current[key], newPath);
        });
      }
    }
  }

  traverse(obj, currentPath);
  return { paths, count };
}

function findPathMatches(obj, pathPatterns) {
  let filtered = {};
  let paths = [];
  let count = 0;

  try {
    // Check if JSONPath is available
    if (typeof JSONPath === 'undefined') {
      throw new Error('JSONPath library not loaded');
    }

    // Use JSONPath library for pattern matching
    for (const pattern of pathPatterns) {
      // Convert simple dot notation to JSONPath if needed
      let jsonPath = pattern;
      if (!jsonPath.startsWith('$')) {
        if (jsonPath.includes('[*]')) {
          jsonPath = '$.' + jsonPath;
        } else if (jsonPath.includes('*')) {
          jsonPath = '$.' + jsonPath.replace(/\*/g, '*');
        } else {
          jsonPath = '$.' + jsonPath;
        }
      }

      // Use JSONPath to find matches
      const results = JSONPath({
        path: jsonPath,
        json: obj,
        resultType: 'all'
      });

      for (const result of results) {
        const path = result.pointer.replace(/^\//, '').replace(/\//g, '.');
        paths.push(path);
        count++;
        
        // Build filtered object with matched values
        setValueByPath(filtered, path, result.value);
      }
    }

    // If no matches, return empty object
    if (count === 0) {
      filtered = {};
    }

  } catch (error) {
    // Fallback to original object if JSONPath fails
    console.warn('JSONPath error:', error);
    filtered = obj;
  }

  return { filtered, paths, count };
}

function findWildcardMatches(obj, pattern) {
  // Very basic wildcard implementation
  let paths = [];
  let count = 0;

  function traverse(current, currentPath) {
    if (typeof current === 'object' && current !== null) {
      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          const newPath = `${currentPath}[${index}]`;
          if (matchesPattern(newPath, pattern)) {
            paths.push(newPath);
            count++;
          }
          traverse(item, newPath);
        });
      } else {
        Object.keys(current).forEach(key => {
          const newPath = currentPath ? `${currentPath}.${key}` : key;
          if (matchesPattern(newPath, pattern)) {
            paths.push(newPath);
            count++;
          }
          traverse(current[key], newPath);
        });
      }
    }
  }

  traverse(obj, '');
  return { paths, count };
}

function matchesPattern(path, pattern) {
  // Simple pattern matching - replace * with regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '[^.\\[\\]]*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

function getValueByPath(obj, path) {
  try {
    return path.split('.').reduce((current, key) => {
      if (key.includes('[') && key.includes(']')) {
        // Array access
        const [arrayKey, indexStr] = key.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        return current[arrayKey][index];
      }
      return current[key];
    }, obj);
  } catch (error) {
    return undefined;
  }
}

function setValueByPath(obj, path, value) {
  try {
    const keys = path.split('.');
    let current = obj;
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key.includes('[') && key.includes(']')) {
        // Array access
        const [arrayKey, indexStr] = key.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        
        if (!current[arrayKey]) current[arrayKey] = [];
        if (!current[arrayKey][index]) current[arrayKey][index] = {};
        current = current[arrayKey][index];
      } else {
        if (!current[key]) current[key] = {};
        current = current[key];
      }
    }
    
    // Set the final value
    const finalKey = keys[keys.length - 1];
    if (finalKey.includes('[') && finalKey.includes(']')) {
      const [arrayKey, indexStr] = finalKey.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      if (!current[arrayKey]) current[arrayKey] = [];
      current[arrayKey][index] = value;
    } else {
      current[finalKey] = value;
    }
  } catch (error) {
    console.warn('Error setting value by path:', error);
  }
}

// Communication helpers
function sendProgress(requestId, progress, stage) {
  self.postMessage({
    type: 'progress',
    payload: {
      requestId,
      progress,
      stage
    }
  });
}

function sendComplete(requestId, result) {
  self.postMessage({
    type: 'complete',
    payload: {
      requestId,
      ...result
    }
  });
}

function sendError(requestId, error) {
  self.postMessage({
    type: 'error',
    payload: {
      requestId,
      error
    }
  });
}

// Additional helper functions for unified search
function findPropertyMatches(obj, query, currentPath = '') {
  let paths = [];
  let count = 0;
  const queryLower = query.toLowerCase();

  function traverse(current, path) {
    if (typeof current === 'object' && current !== null) {
      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          traverse(item, `${path}[${index}]`);
        });
      } else {
        Object.keys(current).forEach(key => {
          // Check if property name matches query
          if (key.toLowerCase().includes(queryLower)) {
            const newPath = path ? `${path}.${key}` : key;
            paths.push(newPath);
            count++;
          }
          
          const newPath = path ? `${path}.${key}` : key;
          traverse(current[key], newPath);
        });
      }
    }
  }

  traverse(obj, currentPath);
  return { paths, count };
}

function buildFilteredTreeFromPaths(originalJSON, matchedPaths) {
  if (!matchedPaths || matchedPaths.length === 0) {
    return {};
  }

  // Build a set of all paths we need to include (matches + their parents)
  const pathsToInclude = new Set();
  
  matchedPaths.forEach(path => {
    // Add the matched path
    pathsToInclude.add(path);
    
    // Add all parent paths
    const segments = path.split(/[.\[\]]/g).filter(Boolean);
    let currentPath = '';
    
    segments.forEach((segment, index) => {
      if (index === 0) {
        currentPath = segment;
      } else {
        // Check if previous segment was an array
        const prevSegment = segments[index - 1];
        if (/^\d+$/.test(segment)) {
          // This is an array index
          currentPath += `[${segment}]`;
        } else {
          // This is an object property
          currentPath += `.${segment}`;
        }
      }
      pathsToInclude.add(currentPath);
    });
  });

  // For now, return the original JSON to avoid breaking existing functionality
  // This can be enhanced later to build a truly filtered tree
  return originalJSON;
}