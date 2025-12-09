import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

interface SEOPaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  className?: string;
  showFirstLast?: boolean;
  siblingCount?: number;
  boundaryCount?: number;
  // For SEO meta tags
  onPageChange?: (page: number) => void;
}

export function SEOPagination({
  currentPage,
  totalPages,
  baseUrl,
  className,
  showFirstLast = true,
  siblingCount = 1,
  boundaryCount = 1,
  onPageChange,
}: SEOPaginationProps) {
  const router = useRouter();

  // Generate page numbers array with ellipsis
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    
    // Always show first pages
    for (let i = 1; i <= Math.min(boundaryCount, totalPages); i++) {
      pages.push(i);
    }
    
    // Calculate range around current page
    const leftSibling = Math.max(currentPage - siblingCount, boundaryCount + 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages - boundaryCount);
    
    // Add ellipsis if needed
    if (leftSibling > boundaryCount + 1) {
      pages.push('...');
    }
    
    // Add pages around current page
    for (let i = leftSibling; i <= rightSibling; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    // Add ellipsis if needed
    if (rightSibling < totalPages - boundaryCount) {
      pages.push('...');
    }
    
    // Always show last pages
    for (let i = Math.max(totalPages - boundaryCount + 1, rightSibling + 1); i <= totalPages; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const getPageUrl = (page: number) => {
    if (page === 1) {
      return baseUrl;
    }
    return `${baseUrl}?page=${page}`;
  };

  const handlePageClick = (page: number) => {
    onPageChange?.(page);
    router.push(getPageUrl(page));
  };

  const pageNumbers = generatePageNumbers();

  return (
    <>
      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            pagination: {
              '@type': 'SiteNavigationElement',
              name: 'Pagination',
              url: getPageUrl(currentPage),
              hasPart: Array.from({ length: totalPages }, (_, i) => ({
                '@type': 'WebPage',
                url: getPageUrl(i + 1),
                position: i + 1,
              })),
            },
          }),
        }}
      />

      <nav aria-label="Pagination Navigation" className={className}>
        <Pagination>
          <PaginationContent>
            {/* Previous Page */}
            {currentPage > 1 && (
              <PaginationItem>
                <Link href={getPageUrl(currentPage - 1)} passHref legacyBehavior>
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageClick(currentPage - 1);
                    }}
                    aria-label={`Go to page ${currentPage - 1}`}
                  />
                </Link>
              </PaginationItem>
            )}

            {/* Page Numbers */}
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <PaginationItem key={pageNumber}>
                  {isActive ? (
                    <PaginationLink
                      isActive
                      aria-current="page"
                      aria-label={`Current page, page ${pageNumber}`}
                    >
                      {pageNumber}
                    </PaginationLink>
                  ) : (
                    <Link href={getPageUrl(pageNumber)} passHref legacyBehavior>
                      <PaginationLink
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageClick(pageNumber);
                        }}
                        aria-label={`Go to page ${pageNumber}`}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </Link>
                  )}
                </PaginationItem>
              );
            })}

            {/* Next Page */}
            {currentPage < totalPages && (
              <PaginationItem>
                <Link href={getPageUrl(currentPage + 1)} passHref legacyBehavior>
                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageClick(currentPage + 1);
                    }}
                    aria-label={`Go to page ${currentPage + 1}`}
                  />
                </Link>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </nav>

      {/* SEO Meta Tags Helper */}
      <SEOPaginationMeta
        currentPage={currentPage}
        totalPages={totalPages}
        baseUrl={baseUrl}
      />
    </>
  );
}

// Helper component for SEO meta tags
export function SEOPaginationMeta({
  currentPage,
  totalPages,
  baseUrl,
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}) {
  const getPageUrl = (page: number) => {
    if (page === 1) return baseUrl;
    return `${baseUrl}?page=${page}`;
  };

  return (
    <>
      {currentPage > 1 && (
        <link rel="prev" href={getPageUrl(currentPage - 1)} />
      )}
      {currentPage < totalPages && (
        <link rel="next" href={getPageUrl(currentPage + 1)} />
      )}
      <link rel="canonical" href={getPageUrl(currentPage)} />
    </>
  );
}

// Accessible pagination with keyboard navigation
export function AccessiblePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        if (currentPage > 1) {
          onPageChange(currentPage - 1);
        }
        break;
      case 'ArrowRight':
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1);
        }
        break;
      case 'Home':
        onPageChange(1);
        break;
      case 'End':
        onPageChange(totalPages);
        break;
    }
  };

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value;
    if (value) {
      const page = parseInt(value, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        onPageChange(page);
      }
    }
  };

  return (
    <div
      className={cn("flex items-center gap-4", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="navigation"
      aria-label="Pagination"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Go to first page"
          className="p-2 disabled:opacity-50"
        >
          First
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
          className="p-2 disabled:opacity-50"
        >
          Previous
        </button>
      </div>

      <form onSubmit={handleGoToPage} className="flex items-center gap-2">
        <label htmlFor="page-input" className="sr-only">
          Go to page
        </label>
        <span>Page</span>
        <input
          ref={inputRef}
          id="page-input"
          type="number"
          min="1"
          max={totalPages}
          defaultValue={currentPage}
          className="w-16 px-2 py-1 text-center border rounded"
          aria-label={`Current page ${currentPage} of ${totalPages}`}
        />
        <span>of {totalPages}</span>
        <button type="submit" className="sr-only">
          Go to page
        </button>
      </form>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
          className="p-2 disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Go to last page"
          className="p-2 disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  );
}