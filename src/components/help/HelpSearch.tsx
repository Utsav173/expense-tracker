'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { helpSections } from '@/content/help';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  subsectionId?: string;
  subsectionTitle?: string;
  matchType: 'title' | 'subsection';
}

export default function HelpSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerms = query.toLowerCase().split(' ');
    const filtered: SearchResult[] = [];

    helpSections.forEach((section) => {
      // Check section title
      if (searchTerms.every((term) => section.title.toLowerCase().includes(term))) {
        filtered.push({
          sectionId: section.id,
          sectionTitle: section.title,
          matchType: 'title'
        });
      }

      // Check subsections
      section.subsections?.forEach((subsection) => {
        if (searchTerms.every((term) => subsection.title.toLowerCase().includes(term))) {
          filtered.push({
            sectionId: section.id,
            sectionTitle: section.title,
            subsectionId: subsection.id,
            subsectionTitle: subsection.title,
            matchType: 'subsection'
          });
        }
      });
    });

    setResults(filtered.slice(0, isMobile ? 3 : 8)); // Limit results
    setIsOpen(true);
  }, [query]);

  const handleSelect = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -120; // Increased offset to account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.pushState(null, '', `#${id}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className='relative mx-auto w-full max-w-2xl'>
      <div className='group relative'>
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
          <Icon
            name='search'
            className='text-muted-foreground group-focus-within:text-primary h-5 w-5 transition-colors'
          />
        </div>
        <Input
          type='text'
          placeholder='Search for help topics, guides, or features...'
          className='border-primary/10 bg-background/50 focus-visible:ring-primary/20 focus-visible:border-primary/30 h-14 rounded-2xl pl-11 text-lg shadow-sm backdrop-blur-xl transition-all'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
        />
        {query && (
          <div className='absolute inset-y-0 right-0 flex items-center pr-2'>
            <Button
              variant='ghost'
              size='icon'
              className='hover:bg-muted h-8 w-8 rounded-full'
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
            >
              <Icon name='x' className='text-muted-foreground h-4 w-4' />
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (results.length > 0 || query.trim()) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className='bg-card/95 border-border/50 absolute top-full right-0 left-0 z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border shadow-2xl backdrop-blur-xl'
          >
            {results.length > 0 ? (
              <div className='py-2'>
                <div className='text-muted-foreground px-4 py-2 text-xs font-semibold tracking-wider uppercase'>
                  Search Results
                </div>
                {results.map((result, index) => (
                  <button
                    key={`${result.sectionId}-${result.subsectionId || index}`}
                    className='hover:bg-primary/5 group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors'
                    onClick={() => handleSelect(result.subsectionId || result.sectionId)}
                  >
                    <div className='bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors'>
                      <Icon
                        name={result.matchType === 'title' ? 'bookOpen' : 'fileText'}
                        className='h-4 w-4'
                      />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='text-foreground truncate font-medium'>
                        {result.subsectionTitle || result.sectionTitle}
                      </div>
                      {result.subsectionTitle && (
                        <div className='text-muted-foreground truncate text-xs'>
                          in {result.sectionTitle}
                        </div>
                      )}
                    </div>
                    <Icon
                      name='chevronRight'
                      className='text-muted-foreground/50 group-hover:text-primary/50 h-4 w-4'
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className='text-muted-foreground p-8 text-center'>
                <div className='bg-muted/50 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
                  <Icon name='search' className='h-6 w-6 opacity-50' />
                </div>
                <p>No results found for "{query}"</p>
                <p className='mt-1 text-sm opacity-70'>
                  Try searching for "dashboard", "budget", or "account"
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
