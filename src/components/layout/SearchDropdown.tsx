import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Tag, FolderOpen, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchCategories } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  type: string;
  attributes: {
    name: string;
    image_url?: string;
    slug?: string;
  };
  links?: {
    self?: string;
    offers?: string;
  };
  relationships?: {
    subcategories?: {
      data: Category[];
    };
  };
}

interface SearchResult {
  type: 'category' | 'offer';
  id: string;
  name: string;
  image?: string;
  slug: string;
  parentCategory?: string;
}

const SearchDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetchCategories(1, 1000);
        if (response?.data && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('[Search] Failed to load categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Flatten categories and subcategories for searching
  const flattenCategories = useCallback((cats: Category[], parent?: string): SearchResult[] => {
    const results: SearchResult[] = [];
    
    cats.forEach(cat => {
      const slug = cat.attributes?.slug || cat.id;
      
      results.push({
        type: 'category',
        id: cat.id,
        name: cat.attributes?.name || '',
        image: cat.attributes?.image_url,
        slug: slug,
        parentCategory: parent,
      });

      // Add subcategories recursively
      const subcats = cat.relationships?.subcategories?.data;
      if (subcats && Array.isArray(subcats)) {
        results.push(...flattenCategories(subcats, cat.attributes?.name));
      }
    });
    
    return results;
  }, []);

  // Filter results based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const allResults = flattenCategories(categories);
    const query = searchQuery.toLowerCase().trim();
    
    return allResults
      .filter(result => 
        result.name.toLowerCase().includes(query)
      )
      .slice(0, 10); // Limit to 10 results
  }, [searchQuery, categories, flattenCategories]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleResultClick(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, searchResults, selectedIndex]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setSearchQuery('');
    
    // Navigate to category detail page
    // Normalize slug by removing numeric suffixes like _01
    const normalizedSlug = result.slug.replace(/_\d+$/, '');
    navigate(`/category/${normalizedSlug}`);
  };

  // Handle input focus
  const handleFocus = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Clear search
  const handleClear = () => {
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for any brand or product"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-10 h-11 rounded-full bg-secondary/50 border-0"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found for "{searchQuery}"</p>
              <p className="text-xs mt-1">Try searching for a different term</p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5" />
                Categories ({searchResults.length})
              </div>
              
              {searchResults.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    selectedIndex === index 
                      ? 'bg-accent' 
                      : 'hover:bg-accent/50'
                  )}
                >
                  {/* Result Image */}
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt={result.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>';
                        }}
                      />
                    ) : (
                      <Tag className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Result Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{result.name}</p>
                    {result.parentCategory && (
                      <p className="text-xs text-muted-foreground truncate">
                        in {result.parentCategory}
                      </p>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <svg 
                    className="w-4 h-4 text-muted-foreground" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
