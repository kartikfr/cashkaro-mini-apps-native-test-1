import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Tag, FolderOpen, X, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchCategories, fetchCategoryOffers, extractEndpointFromUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  type: string;
  attributes: {
    name: string;
    image_url?: string;
    slug?: string;
    unique_identifier?: string;
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

interface Offer {
  id: string;
  type: string;
  attributes: {
    name: string;
    image_url?: string;
    unique_identifier?: string;
    cashback?: {
      amount?: string;
      currency?: string;
    };
    short_description?: string;
  };
}

interface SearchResult {
  type: 'category' | 'offer';
  id: string;
  name: string;
  image?: string;
  navigationPath: string; // Full path for navigation
  parentCategory?: string;
  cashback?: string;
}

const SearchDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch categories and some offers on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories
        const categoriesResponse = await fetchCategories(1, 1000);
        if (categoriesResponse?.data && Array.isArray(categoriesResponse.data)) {
          setCategories(categoriesResponse.data);
        }

        // Fetch popular offers from a common category
        try {
          const offersResponse = await fetchCategoryOffers(
            'home-categories-exclusive/banking-finance-offers',
            1,
            100
          );
          if (offersResponse?.data && Array.isArray(offersResponse.data)) {
            setOffers(offersResponse.data);
          }
        } catch (err) {
          console.error('[Search] Failed to load offers:', err);
        }
      } catch (error) {
        console.error('[Search] Failed to load categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Extract proper slug from category links.self URL
  const extractCategorySlug = (category: Category): string => {
    // Try to get slug from links.self URL first
    if (category.links?.self) {
      const endpoint = extractEndpointFromUrl(category.links.self);
      // Endpoint format: /offers/categories/slug or /offers/category/parent/child
      const match = endpoint.match(/\/offers\/categor(?:y|ies)\/(.+?)(?:\?|$)/);
      if (match) {
        return match[1];
      }
    }
    
    // Fallback to attributes.slug or unique_identifier
    return category.attributes?.unique_identifier || 
           category.attributes?.slug || 
           category.id;
  };

  // Flatten categories and subcategories for searching
  const flattenCategories = useCallback((cats: Category[], parent?: string): SearchResult[] => {
    const results: SearchResult[] = [];
    
    cats.forEach(cat => {
      const slug = extractCategorySlug(cat);
      // Remove numeric suffixes like _01
      const normalizedSlug = slug.replace(/_\d+$/, '');
      
      results.push({
        type: 'category',
        id: cat.id,
        name: cat.attributes?.name || '',
        image: cat.attributes?.image_url,
        navigationPath: `/category/${normalizedSlug}`,
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

  // Convert offers to search results
  const offersToResults = useCallback((offersList: Offer[]): SearchResult[] => {
    return offersList.map(offer => {
      const uniqueId = offer.attributes?.unique_identifier || offer.id;
      const cashback = offer.attributes?.cashback;
      const cashbackText = cashback?.amount 
        ? `${cashback.currency || '₹'}${cashback.amount}` 
        : undefined;

      return {
        type: 'offer' as const,
        id: offer.id,
        name: offer.attributes?.name || '',
        image: offer.attributes?.image_url,
        navigationPath: `/offer/${uniqueId}`,
        cashback: cashbackText,
      };
    });
  }, []);

  // Filter results based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { categories: [], offers: [] };
    
    const query = searchQuery.toLowerCase().trim();
    
    // Search categories
    const allCategories = flattenCategories(categories);
    const filteredCategories = allCategories
      .filter(result => result.name.toLowerCase().includes(query))
      .slice(0, 5);
    
    // Search offers
    const allOffers = offersToResults(offers);
    const filteredOffers = allOffers
      .filter(result => result.name.toLowerCase().includes(query))
      .slice(0, 8);

    return { categories: filteredCategories, offers: filteredOffers };
  }, [searchQuery, categories, offers, flattenCategories, offersToResults]);

  // Combined results for keyboard navigation
  const allResults = useMemo(() => {
    return [...searchResults.categories, ...searchResults.offers];
  }, [searchResults]);

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
    if (!isOpen || allResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          handleResultClick(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, allResults, selectedIndex]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setSearchQuery('');
    navigate(result.navigationPath);
  };

  // Handle input focus
  const handleFocus = () => {
    if (searchQuery.trim() && allResults.length > 0) {
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

  const hasResults = searchResults.categories.length > 0 || searchResults.offers.length > 0;

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
      {isOpen && searchQuery.trim() && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found for "{searchQuery}"</p>
              <p className="text-xs mt-1">Try searching for a different term</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Categories Section */}
              {searchResults.categories.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Categories ({searchResults.categories.length})
                  </div>
                  
                  {searchResults.categories.map((result, index) => (
                    <ResultItem
                      key={`cat-${result.id}`}
                      result={result}
                      isSelected={selectedIndex === index}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    />
                  ))}
                </>
              )}

              {/* Offers Section */}
              {searchResults.offers.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 mt-2">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Offers ({searchResults.offers.length})
                  </div>
                  
                  {searchResults.offers.map((result, index) => {
                    const actualIndex = searchResults.categories.length + index;
                    return (
                      <ResultItem
                        key={`offer-${result.id}`}
                        result={result}
                        isSelected={selectedIndex === actualIndex}
                        onClick={() => handleResultClick(result)}
                        onMouseEnter={() => setSelectedIndex(actualIndex)}
                      />
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Separate component for result items
const ResultItem: React.FC<{
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}> = ({ result, isSelected, onClick, onMouseEnter }) => {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        isSelected ? 'bg-accent' : 'hover:bg-accent/50'
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
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          result.type === 'category' ? (
            <FolderOpen className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Tag className="w-5 h-5 text-muted-foreground" />
          )
        )}
      </div>

      {/* Result Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{result.name}</p>
        <div className="flex items-center gap-2">
          {result.parentCategory && (
            <p className="text-xs text-muted-foreground truncate">
              in {result.parentCategory}
            </p>
          )}
          {result.cashback && (
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              {result.cashback} Cashback
            </span>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      <svg 
        className="w-4 h-4 text-muted-foreground flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

export default SearchDropdown;
