// JSON Filter Web Worker - Optimized for Performance
// Import JSONPath library (used minimally)
importScripts('/jsonpath-plus.js');

// Access JSONPath from the global object after import
const JSONPathLib = self.JSONPath ? self.JSONPath.JSONPath : null;

// Core data storage
let storedJSON = null;
let parsedJSON = null;
let fileId = null;

// Performance configuration
const SEARCH_CONFIG = {
  maxResults: 1000,
  maxTraversalDepth: 20,
  timeoutMs: 5000,
  progressUpdateInterval: 100 // Update progress every 100 matches
};

// Search result cache for repeated queries
class SearchCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  getCacheKey(query, searchType, pathScope) {
    return `${query}|${searchType}|${pathScope || ''}`;
  }
  
  get(query, searchType, pathScope) {
    const key = this.getCacheKey(query, searchType, pathScope);
    const cached = this.cache.get(key);
    
    if (cached) {
      // Update for LRU
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }
    
    return null;
  }
  
  set(query, searchType, pathScope, result) {
    const key = this.getCacheKey(query, searchType, pathScope);
    
    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
  }
  
  clear() {
    this.cache.clear();
  }
}

const searchCache = new SearchCache();

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

    const { query, searchType, pathScope, maxResults = SEARCH_CONFIG.maxResults } = data;
    
    // Check cache first
    const cached = searchCache.get(query, searchType, pathScope);
    if (cached) {
      sendComplete(requestId, {
        ...cached,
        fromCache: true,
        processingTime: 0
      });
      return;
    }

    const startTime = Date.now();
    sendProgress(requestId, 10, 'Starting optimized search');

    // Scope the search to a specific path if provided
    let searchTarget = parsedJSON;
    let baseScope = '';
    
    if (pathScope) {
      try {
        // For complex paths with wildcards, use custom path evaluation
        if (pathScope.includes('[*]') || pathScope.includes('[]') || pathScope.includes('*')) {
          try {
            // Custom path evaluation for patterns like "batters.batter[*].type"
            const scopedValues = evaluateWildcardPath(parsedJSON, pathScope);
            
            if (scopedValues && scopedValues.length > 0) {
              // Create a virtual array containing all matched values
              searchTarget = { _scoped_array: scopedValues };
              baseScope = pathScope;
            } else {
              // No matches found, return empty results quickly
              searchTarget = {};
              baseScope = pathScope;
            }
          } catch (error) {
            console.warn('Path scope evaluation error:', error, 'searching entire JSON');
            // Fallback to searching entire JSON
            searchTarget = parsedJSON;
            baseScope = '';
          }
        } else {
          // Simple path traversal for dot notation
          const pathParts = pathScope.split('.');
          let current = parsedJSON;
          
          for (const part of pathParts) {
            if (current && typeof current === 'object' && part in current) {
              current = current[part];
            } else {
              current = null;
              break;
            }
          }
          
          if (current !== null) {
            searchTarget = current;
            baseScope = pathScope;
          }
        }
      } catch (error) {
        console.warn('Path scope error, searching entire JSON:', error);
        // Fallback to searching entire JSON
        searchTarget = parsedJSON;
        baseScope = '';
      }
    }

    sendProgress(requestId, 30, 'Performing unified search');

    // OPTIMIZED: Single traversal for both value and property matching
    const searchResult = findMatchesOptimized(
      searchTarget, 
      query, 
      searchType, 
      baseScope, 
      maxResults,
      requestId
    );

    const result = {
      matchCount: searchResult.count,
      matchedPaths: searchResult.paths,
      processingTime: Date.now() - startTime,
      truncated: searchResult.truncated
      // REMOVED: filteredJSON to reduce payload size
    };

    // Cache the result for future queries
    searchCache.set(query, searchType, pathScope, result);

    sendProgress(requestId, 100, 'Search complete');
    sendComplete(requestId, result);
  } catch (error) {
    sendError(requestId, `Unified search failed: ${error.message}`);
  }
}

function handleClear(requestId) {
  // Clear all data and cache
  storedJSON = null;
  parsedJSON = null;
  fileId = null;
  searchCache.clear();
  
  sendComplete(requestId, { success: true });
}

// OPTIMIZED: Unified search function with early exits and limits
function findMatchesOptimized(obj, query, searchType, currentPath = '', maxResults = SEARCH_CONFIG.maxResults, requestId = null) {
  let paths = [];
  let count = 0;
  let traversalDepth = 0;
  let progressCounter = 0;
  const startTime = Date.now();
  const queryLower = query.toLowerCase();
  
  function traverse(current, path, depth = 0) {
    // Multiple early exit conditions for performance
    if (count >= maxResults) return;
    if (depth > SEARCH_CONFIG.maxTraversalDepth) return;
    if (Date.now() - startTime > SEARCH_CONFIG.timeoutMs) return;
    
    // Update progress periodically
    if (requestId && progressCounter++ % SEARCH_CONFIG.progressUpdateInterval === 0) {
      const progress = Math.min(50 + (count / maxResults) * 40, 90);
      sendProgress(requestId, progress, `Found ${count} matches`);
    }
    
    // Check for value matches (strings, numbers converted to strings)
    if ((searchType === 'both' || searchType === 'values')) {
      if (typeof current === 'string' || typeof current === 'number') {
        const stringValue = String(current).toLowerCase();
        if (stringValue.includes(queryLower)) {
          paths.push({ path, type: 'value', value: current });
          count++;
          if (count >= maxResults) return; // Early exit after adding match
        }
      }
    }
    
    // Check for property matches and continue traversal
    if (typeof current === 'object' && current !== null) {
      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          if (count < maxResults) {
            traverse(item, path ? `${path}[${index}]` : `[${index}]`, depth + 1);
          }
        });
      } else {
        Object.keys(current).forEach(key => {
          if (count < maxResults) {
            // Special handling for scoped arrays
            if (key === '_scoped_array' && Array.isArray(current[key])) {
              // Search within the scoped array elements
              current[key].forEach((item, index) => {
                if (count < maxResults) {
                  traverse(item, `scoped[${index}]`, depth + 1);
                }
              });
              return;
            }
            
            // Check property name match
            if ((searchType === 'both' || searchType === 'properties') && 
                key.toLowerCase().includes(queryLower)) {
              const newPath = path ? `${path}.${key}` : key;
              paths.push({ path: newPath, type: 'property', value: key });
              count++;
            }
            
            // Continue traversal if under limits
            if (count < maxResults) {
              const newPath = path ? `${path}.${key}` : key;
              traverse(current[key], newPath, depth + 1);
            }
          }
        });
      }
    }
  }
  
  traverse(obj, currentPath);
  
  return {
    paths: paths.slice(0, maxResults),
    count: Math.min(count, maxResults),
    truncated: count > maxResults
  };
}

// LEGACY: Keep for backward compatibility but optimize
function findValueMatches(obj, values, currentPath = '') {
  // Use the optimized function for single value search
  if (values.length === 1) {
    const result = findMatchesOptimized(obj, values[0], 'values', currentPath);
    return {
      paths: result.paths.map(p => p.path),
      count: result.count
    };
  }
  
  // Fallback for multiple values (rarely used)
  let paths = [];
  let count = 0;
  
  for (const value of values) {
    const result = findMatchesOptimized(obj, value, 'values', currentPath, SEARCH_CONFIG.maxResults - count);
    paths.push(...result.paths.map(p => p.path));
    count += result.count;
    if (count >= SEARCH_CONFIG.maxResults) break;
  }
  
  return { paths, count };
}

// OPTIMIZED: Simplified path matching without JSONPath dependency
function findPathMatches(obj, pathPattern) {
  // Use optimized search for property matching
  const result = findMatchesOptimized(obj, pathPattern, 'properties', '');
  return {
    filtered: {}, // Not used in optimized version
    paths: result.paths.map(p => p.path),
    count: result.count
  };
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
// LEGACY: Keep for backward compatibility
function findPropertyMatches(obj, query, currentPath = '') {
  const result = findMatchesOptimized(obj, query, 'properties', currentPath);
  return {
    paths: result.paths.map(p => p.path),
    count: result.count
  };
}

// REMOVED: This function was doing expensive work but always returning originalJSON
// Keeping minimal version for backward compatibility
function buildFilteredTreeFromPaths(originalJSON, matchedPaths) {
  // OPTIMIZATION: Removed expensive path processing since we always returned originalJSON
  // This saves significant CPU time on large JSON files
  return originalJSON;
}

// Custom wildcard path evaluation function
function evaluateWildcardPath(obj, path) {
  try {
    // Parse path like "batters.batter[*].type" into parts
    const parts = path.split('.');
    let results = [obj];
    
    for (const part of parts) {
      const newResults = [];
      
      for (const current of results) {
        if (current === null || current === undefined) continue;
        
        if (part.includes('[*]')) {
          // Handle array wildcard like "batter[*]"
          const baseProp = part.replace('[*]', '');
          if (baseProp && current[baseProp] && Array.isArray(current[baseProp])) {
            newResults.push(...current[baseProp]);
          } else if (!baseProp && Array.isArray(current)) {
            newResults.push(...current);
          }
        } else if (part === '*') {
          // Handle pure wildcard
          if (Array.isArray(current)) {
            newResults.push(...current);
          } else if (typeof current === 'object') {
            newResults.push(...Object.values(current));
          }
        } else {
          // Handle regular property access
          if (typeof current === 'object' && current !== null && part in current) {
            newResults.push(current[part]);
          }
        }
      }
      
      results = newResults;
    }
    
    return results.filter(val => val !== null && val !== undefined);
  } catch (error) {
    console.warn('Error in evaluateWildcardPath:', error);
    return [];
  }
}

// Helper function to get values by JSONPath-like syntax
function getValuesByPath(obj, path) {
  try {
    // Handle simple cases first
    if (!path.includes('[') && !path.includes('*')) {
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return [];
        }
      }
      return [current];
    }
    
    // Handle complex paths with arrays and wildcards
    const results = [];
    
    function traverse(current, pathParts, index = 0) {
      if (index >= pathParts.length) {
        results.push(current);
        return;
      }
      
      const part = pathParts[index];
      
      if (part === '*' || part.includes('[*]') || part.includes('[]')) {
        // Handle array wildcard
        if (Array.isArray(current)) {
          current.forEach(item => {
            traverse(item, pathParts, index + 1);
          });
        } else if (typeof current === 'object' && current !== null) {
          // Handle object wildcard
          Object.values(current).forEach(value => {
            traverse(value, pathParts, index + 1);
          });
        }
      } else {
        // Regular property access
        if (current && typeof current === 'object' && part in current) {
          traverse(current[part], pathParts, index + 1);
        }
      }
    }
    
    // Parse path: batters.batter[*].type -> ['batters', 'batter', '*', 'type']
    const pathParts = path
      .replace(/\[\*\]/g, '.*')
      .replace(/\[\]/g, '.*')
      .split('.')
      .filter(Boolean);
    
    traverse(obj, pathParts);
    return results;
  } catch (error) {
    console.warn('Error parsing JSONPath:', error);
    return [];
  }
}