import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simple integration test for the line filter functionality
describe('Line Filter Tool Integration', () => {
  it('should be able to import all required modules', async () => {
    // Test that all our modules can be imported without errors
    const { DatabaseService } = await import('../../services/DatabaseService');
    const { FileParserService } = await import('../../services/FileParserService');
    const { FilterWorkerService } = await import('../../services/FilterWorkerService');
    
    expect(DatabaseService).toBeDefined();
    expect(FileParserService).toBeDefined();
    expect(FilterWorkerService).toBeDefined();
  });

  it('should create service instances', () => {
    const { DatabaseService } = require('../../services/DatabaseService');
    const { FileParserService } = require('../../services/FileParserService');
    const { FilterWorkerService } = require('../../services/FilterWorkerService');
    
    const dbService = new DatabaseService();
    const parserService = new FileParserService();
    const workerService = new FilterWorkerService();
    
    expect(dbService).toBeInstanceOf(DatabaseService);
    expect(parserService).toBeInstanceOf(FileParserService);
    expect(workerService).toBeInstanceOf(FilterWorkerService);
  });

  it('should have correct static methods', () => {
    const { FileParserService } = require('../../services/FileParserService');
    
    expect(FileParserService.getMaxFileSize()).toBe(5 * 1024 * 1024);
    expect(FileParserService.getMaxLines()).toBe(10000);
    expect(FileParserService.getSupportedDelimiters()).toEqual([',', ';', '\t', '|']);
  });

  it('should parse text correctly', () => {
    const { FileParserService } = require('../../services/FileParserService');
    const service = new FileParserService();
    
    const result = service.parseText('line1\nline2\nline3');
    
    expect(result.fileInfo.type).toBe('text');
    expect(result.data.lines).toEqual(['line1', 'line2', 'line3']);
    expect(result.fileInfo.lineCount).toBe(3);
  });

  it('should parse CSV text correctly', () => {
    const { FileParserService } = require('../../services/FileParserService');
    const service = new FileParserService();
    
    const result = service.parseText('name,age\nJohn,25\nJane,30');
    
    expect(result.fileInfo.type).toBe('csv');
    expect(result.data.csvData).toEqual([
      ['name', 'age'],
      ['John', '25'],
      ['Jane', '30']
    ]);
    expect(result.data.headers).toEqual(['name', 'age']);
  });

  it('should detect CSV headers correctly', () => {
    const { FileParserService } = require('../../services/FileParserService');
    const service = new FileParserService();
    
    const headers = service.extractCSVHeaders(['name,age,city', 'John,25,NYC'], ',');
    
    expect(headers).toEqual(['name', 'age', 'city']);
  });

  it('should handle empty input', () => {
    const { FileParserService } = require('../../services/FileParserService');
    const service = new FileParserService();
    
    const result = service.parseText('');
    
    expect(result.fileInfo.lineCount).toBe(0);
    expect(result.data.lines).toEqual([]);
  });

  it('should reject text with too many lines', () => {
    const { FileParserService } = require('../../services/FileParserService');
    const service = new FileParserService();
    
    const manyLines = Array(15000).fill('line').join('\n');
    
    expect(() => service.parseText(manyLines)).toThrow('exceeds the maximum limit of 10000 lines');
  });

  it('should create database service methods', () => {
    const { DatabaseService } = require('../../services/DatabaseService');
    const service = new DatabaseService();
    
    expect(typeof service.storeTextLines).toBe('function');
    expect(typeof service.storeCSVLines).toBe('function');
    expect(typeof service.getTextLines).toBe('function');
    expect(typeof service.clearData).toBe('function');
  });

  it('should create filter worker service methods', () => {
    const { FilterWorkerService } = require('../../services/FilterWorkerService');
    const service = new FilterWorkerService();
    
    expect(typeof service.initialize).toBe('function');
    expect(typeof service.setData).toBe('function');
    expect(typeof service.filter).toBe('function');
    expect(typeof service.terminate).toBe('function');
    expect(typeof service.isReady).toBe('function');
    expect(typeof service.hasData).toBe('function');
  });

  it('should have correct initial states', () => {
    const { FilterWorkerService } = require('../../services/FilterWorkerService');
    const service = new FilterWorkerService();
    
    expect(service.isReady()).toBe(false);
    expect(service.hasData()).toBe(false);
    expect(service.getDataInfo()).toEqual({
      lineCount: 0,
      dataType: null
    });
  });
});