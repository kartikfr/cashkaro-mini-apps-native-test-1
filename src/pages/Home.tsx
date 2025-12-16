import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Percent, Gift, Star, TrendingUp, Zap, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchDynamicPage, fetchEarnings } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Types for API response
interface Banner {
  type: string;
  id: number;
  attributes: {
    image_url: string;
  };
  links: {
    self: string;
  };
}

interface PageElement {
  id: string;
  title?: string;
  viewallurl?: string;
  viewallurltext?: string;
  col: number;
  row: number;
  size_x: number;
  size_y: number;
  stacking_type?: string;
  data: string | any[];
}

interface HomePageData {
  type: string;
  id: string;
  attributes: {
    title: string;
    unique_identifier: string;
    remove_header_footer: boolean;
    page_elements: PageElement[];
  };
}

interface SeoContent {
  type: string;
  id: number;
  attributes: {
    meta_tags: string;
    google_remarketing_code?: string;
    fb_remarketting_code?: string;
  };
}

interface EarningsData {
  total_earnings?: number;
  pending_amount?: number;
  confirmed_amount?: number;
  total_orders?: number;
}

const Home: React.FC = () => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageData, setPageData] = useState<HomePageData | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [seoContent, setSeoContent] = useState<SeoContent | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Parse stringified JSON data from page_elements
  const parsePageElementData = (data: string | any[]): Banner[] => {
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === 'string' && data.trim()) {
      try {
        const parsed = JSON.parse(data);
        return parsed.data || [];
      } catch (e) {
        console.error('[Home] Failed to parse page element data:', e);
        return [];
      }
    }
    return [];
  };

  useEffect(() => {
    const loadHomepage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('[Home] Fetching dynamic page...');
        const response = await fetchDynamicPage();
        console.log('[Home] Dynamic page response:', JSON.stringify(response, null, 2));
        
        // Parse the response
        if (response?.data) {
          const dataArray = Array.isArray(response.data) ? response.data : [response.data];
          
          // Find home_page or dynamic_page type
          const homePage = dataArray.find(
            (item: any) => item.type === 'home_page' || item.type === 'dynamic_page'
          );
          
          if (homePage) {
            setPageData(homePage);
            
            // Extract banners from page_elements
            const pageElements = homePage.attributes?.page_elements || [];
            const allBanners: Banner[] = [];
            
            pageElements.forEach((element: PageElement) => {
              const elementBanners = parsePageElementData(element.data);
              allBanners.push(...elementBanners.filter((b: any) => b.type === 'banner'));
            });
            
            setBanners(allBanners);
            console.log('[Home] Extracted banners:', allBanners.length);
          }
        }

        // Parse SEO content from included
        if (response?.included) {
          const seo = response.included.find((item: any) => item.type === 'seo_content');
          if (seo) {
            setSeoContent(seo);
            // Apply SEO meta tags to document head
            applyMetaTags(seo.attributes?.meta_tags);
          }
        }
      } catch (err) {
        console.error('[Home] Failed to load homepage:', err);
        setError(err instanceof Error ? err.message : 'Failed to load homepage');
      }

      // Fetch earnings if user is authenticated
      if (isAuthenticated && accessToken) {
        try {
          console.log('[Home] Fetching earnings...');
          const earningsResponse = await fetchEarnings(accessToken);
          console.log('[Home] Earnings response:', JSON.stringify(earningsResponse, null, 2));
          
          if (earningsResponse?.data?.attributes) {
            setEarnings(earningsResponse.data.attributes);
          }
        } catch (err) {
          console.error('[Home] Failed to load earnings:', err);
        }
      }

      setIsLoading(false);
    };

    loadHomepage();
  }, [isAuthenticated, accessToken]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Apply SEO meta tags to document
  const applyMetaTags = (metaTagsHtml: string) => {
    if (!metaTagsHtml) return;
    
    // Parse and apply title
    const titleMatch = metaTagsHtml.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      document.title = titleMatch[1];
    }

    // Parse meta tags
    const metaRegex = /<meta\s+([^>]+)>/gi;
    let match;
    while ((match = metaRegex.exec(metaTagsHtml)) !== null) {
      const attrs = match[1];
      const nameMatch = attrs.match(/name="([^"]+)"/i);
      const propertyMatch = attrs.match(/property="([^"]+)"/i);
      const contentMatch = attrs.match(/content\s*=\s*"([^"]+)"/i);
      
      if (contentMatch) {
        const existingMeta = document.querySelector(
          nameMatch ? `meta[name="${nameMatch[1]}"]` : 
          propertyMatch ? `meta[property="${propertyMatch[1]}"]` : null
        );
        
        if (existingMeta) {
          existingMeta.setAttribute('content', contentMatch[1]);
        } else {
          const meta = document.createElement('meta');
          if (nameMatch) meta.setAttribute('name', nameMatch[1]);
          if (propertyMatch) meta.setAttribute('property', propertyMatch[1]);
          meta.setAttribute('content', contentMatch[1]);
          document.head.appendChild(meta);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                Hello, {user?.firstName || 'there'}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Find the best cashback offers today
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stores, deals, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl"
            />
          </div>
        </header>

        {/* Hero Banner Carousel */}
        {banners.length > 0 && (
          <section className="mb-6 animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              {/* Main Banner */}
              <a 
                href={banners[currentBannerIndex]?.links?.self || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={banners[currentBannerIndex]?.attributes?.image_url}
                  alt={`Banner ${currentBannerIndex + 1}`}
                  className="w-full h-40 md:h-56 lg:h-64 object-cover transition-opacity duration-500"
                />
              </a>

              {/* Banner Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentBannerIndex 
                        ? 'bg-white w-6' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
                    aria-label="Previous banner"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <button
                    onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
                    aria-label="Next banner"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentBannerIndex 
                      ? 'border-primary scale-105' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={banner.attributes?.image_url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-16 h-10 md:w-24 md:h-14 object-cover"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Stats Banner */}
        <div className="bg-gradient-primary rounded-2xl p-6 mb-6 text-primary-foreground shadow-glow animate-fade-in">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold">
                ₹{earnings?.total_earnings?.toLocaleString() || earnings?.confirmed_amount?.toLocaleString() || '0'}
              </p>
              <p className="text-xs md:text-sm text-primary-foreground/80">Total Earnings</p>
            </div>
            <div className="border-l border-r border-primary-foreground/20">
              <p className="text-2xl md:text-3xl font-bold">
                ₹{earnings?.pending_amount?.toLocaleString() || '0'}
              </p>
              <p className="text-xs md:text-sm text-primary-foreground/80">Pending</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold">{earnings?.total_orders || 0}</p>
              <p className="text-xs md:text-sm text-primary-foreground/80">Orders</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2 md:gap-3 mb-6">
          {[
            { icon: Percent, label: 'Top Offers', color: 'bg-primary/10 text-primary' },
            { icon: Zap, label: 'Flash Deals', color: 'bg-accent/10 text-accent' },
            { icon: Gift, label: 'Rewards', color: 'bg-success/10 text-success' },
            { icon: Star, label: 'Favorites', color: 'bg-warning/10 text-warning' },
          ].map((action, index) => (
            <button
              key={index}
              className="card-elevated p-3 md:p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="text-[10px] md:text-xs font-medium text-foreground text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* All Banners Grid */}
        {banners.length > 0 && (
          <section className="mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Top Offers
              </h2>
              <button className="text-primary text-sm font-medium flex items-center hover:underline">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {banners.map((banner) => (
                <a
                  key={banner.id}
                  href={banner.links?.self || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <img
                    src={banner.attributes?.image_url}
                    alt={`Offer ${banner.id}`}
                    className="w-full h-24 md:h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white text-xs font-medium flex items-center gap-1">
                      Shop Now <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
            <p className="text-destructive font-medium">Error loading content</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        {/* Show message if no banners */}
        {banners.length === 0 && !error && (
          <div className="text-center py-8 card-elevated rounded-xl">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No offers available</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for amazing deals!</p>
          </div>
        )}

        {/* SEO Info (Dev Only) */}
        {seoContent && (
          <details className="card-elevated p-4 mt-6">
            <summary className="cursor-pointer font-medium text-foreground text-sm">
              📊 Page Info ({banners.length} banners loaded)
            </summary>
            <div className="mt-3 text-xs text-muted-foreground">
              <p><strong>Page ID:</strong> {pageData?.attributes?.unique_identifier}</p>
              <p><strong>SEO ID:</strong> {seoContent.id}</p>
            </div>
          </details>
        )}
      </div>
    </AppLayout>
  );
};

export default Home;
