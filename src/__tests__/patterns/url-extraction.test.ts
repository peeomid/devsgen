import { describe, it, expect, beforeEach } from 'vitest'
import { RegexService } from '../../services/RegexService'
import builtInPatterns from '../../data/built-in-patterns.json'
import type { Pattern } from '../../types/pattern'

describe('URL Extraction Pattern', () => {
  let regexService: RegexService
  
  beforeEach(() => {
    regexService = new RegexService()
  })
  
  it('should correctly load the URL extraction pattern from JSON', () => {
    const urlPattern = builtInPatterns.find(p => p.id === 'extract-urls') as Pattern
    
    expect(urlPattern).toBeDefined()
    expect(urlPattern.searchRegex).toBe('(https?://[^\\s,;!()]+)')
    expect(urlPattern.replaceRegex).toBe('$1\n')
    expect(urlPattern.flags).toBe('g')
  })
  
  it('should extract URLs correctly with newlines', () => {
    const input = 'Visit https://example.com and https://test.com for more information.'
    const expected = 'https://example.com\nhttps://test.com\n'
    
    const result = regexService.extractMatches(
      input,
      '(https?://[^\\s,;!()]+)',
      'g'
    )
    
    expect(result).toBe(expected)
  })
  
  it('should register and use the URL pattern correctly', () => {
    const urlPattern = builtInPatterns.find(p => p.id === 'extract-urls') as Pattern
    expect(urlPattern).toBeDefined()
    
    regexService.registerPattern(urlPattern.id, urlPattern.searchRegex, urlPattern.replaceRegex, urlPattern.flags)
    
    const input = 'Visit https://example.com and https://test.com for more information.'
    const expected = 'https://example.com\nhttps://test.com\n'
    
    const result = regexService.transform('extract-urls', input)
    
    expect(result).toBe(expected)
  })
  
  it('should handle multiple URLs in different contexts', () => {
    const input = 'Check out https://google.com , also try http://yahoo.com and visit https://github.com/user/repo'
    const expected = 'https://google.com\nhttp://yahoo.com\nhttps://github.com/user/repo\n'
    
    const result = regexService.extractMatches(
      input,
      '(https?://[^\\s,;!()]+)',
      'g'
    )
    
    expect(result).toBe(expected)
  })
})