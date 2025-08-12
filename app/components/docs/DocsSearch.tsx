'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface SearchResult {
  title: string;
  description: string;
  url: string;
  category: string;
  excerpt?: string;
  tags?: string[];
}

export default function DocsSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/docs/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Ensure selected item is visible in the scrollable results
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex, results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center w-full max-w-sm px-3 py-2 text-sm border rounded-md bg-background"
        aria-label="Search documentation"
      >
        <Search className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-muted-foreground">Search documentation...</span>
        <div className="ml-auto flex gap-1">
          <kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="z-50 w-full max-w-lg overflow-hidden rounded-lg border bg-background shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search documentation..."
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              <kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
            
            {isLoading && (
              <div className="p-4 text-center">
                <div className="flex justify-center items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                  <span className="text-sm">Searching...</span>
                </div>
              </div>
            )}
            
            {!isLoading && results.length > 0 && (
              <div
                ref={resultsRef}
                className="max-h-[300px] overflow-y-auto p-2"
                onKeyDown={handleKeyDown}
              >
                {results.map((result, index) => (
                  <div
                    key={result.url}
                    onClick={() => handleSelectResult(result)}
                    className={`cursor-pointer rounded-md px-4 py-2 text-sm ${
                      selectedIndex === index
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.title}</span>
                      <span className="text-xs text-muted-foreground">{result.category}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">
                      {result.description}
                    </p>
                    {result.excerpt && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1 italic">
                        {result.excerpt}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!isLoading && query && results.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 