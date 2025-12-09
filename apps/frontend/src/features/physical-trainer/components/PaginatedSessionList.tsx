import React from 'react';
import { useGetWorkoutSessionsPaginatedQuery } from '@/store/api/trainingApiPaginated';
import { usePagination } from '@/hooks/usePagination';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { InfiniteScroll } from '@/components/ui/infinite-scroll';
import { LoadMoreButton } from '@/components/ui/load-more-button';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Users, MapPin, Dumbbell } from '@/components/icons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { PaginationPreferences } from '@/types/pagination.types';

interface PaginatedSessionListProps {
  teamId?: string;
  date?: string;
  onSessionSelect?: (session: any) => void;
  paginationStyle?: PaginationPreferences['style'];
  className?: string;
}

export function PaginatedSessionList({
  teamId,
  date,
  onSessionSelect,
  paginationStyle = 'numbers',
  className,
}: PaginatedSessionListProps) {
  const [loadedPages, setLoadedPages] = React.useState<number[]>([1]);
  const currentPage = loadedPages[loadedPages.length - 1] || 1;
  
  const pagination = usePagination({
    initialPageSize: 20,
  });

  // Query for current page
  const { data, isLoading, isFetching } = useGetWorkoutSessionsPaginatedQuery({
    page: paginationStyle === 'numbers' ? pagination.pageIndex + 1 : currentPage,
    pageSize: pagination.pageSize,
    teamId,
    date,
  });

  // For infinite scroll, accumulate data
  const [allSessions, setAllSessions] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    if (data?.data && paginationStyle === 'infinite') {
      if (currentPage === 1) {
        setAllSessions(data.data);
      } else {
        setAllSessions(prev => [...prev, ...data.data]);
      }
    }
  }, [data, currentPage, paginationStyle]);

  const loadMore = React.useCallback(() => {
    if (data?.pagination.hasNext && !isFetching) {
      const nextPage = currentPage + 1;
      setLoadedPages(prev => [...prev, nextPage]);
    }
  }, [data, currentPage, isFetching]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: data?.pagination.hasNext || false,
    isLoading: isFetching,
    onLoadMore: loadMore,
    threshold: 0.8,
  });

  const getWorkoutTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      strength: 'bg-blue-100 text-blue-800',
      conditioning: 'bg-red-100 text-red-800',
      hybrid: 'bg-purple-100 text-purple-800',
      agility: 'bg-orange-100 text-orange-800',
      skill: 'bg-green-100 text-green-800',
      recovery: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const SessionCard = ({ session }: { session: any }) => (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        "border-l-4",
        session.type === 'strength' && "border-l-blue-500",
        session.type === 'conditioning' && "border-l-red-500",
        session.type === 'hybrid' && "border-l-purple-500",
        session.type === 'agility' && "border-l-orange-500"
      )}
      onClick={() => onSessionSelect?.(session)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{session.title}</h3>
          <Badge className={getWorkoutTypeColor(session.type)}>
            {session.type}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(session.scheduledDate), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(session.scheduledDate), 'h:mm a')}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {session.location || 'No location'}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {session.playerIds?.length || 0} players
            </div>
          </div>
          
          {session.exercises && (
            <div className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4" />
              {session.exercises.length} exercises
            </div>
          )}
        </div>
        
        {session.description && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">
            {session.description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const SessionSkeleton = () => (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const displaySessions = paginationStyle === 'infinite' ? allSessions : (data?.data || []);

  if (paginationStyle === 'numbers') {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid gap-4">
          {isLoading ? (
            <>
              <SessionSkeleton />
              <SessionSkeleton />
              <SessionSkeleton />
            </>
          ) : displaySessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workout sessions found</p>
              </CardContent>
            </Card>
          ) : (
            displaySessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          )}
        </div>
        
        {data && data.pagination.totalPages > 1 && (
          <DataTablePagination
            currentPage={data.pagination.page}
            pageSize={data.pagination.pageSize}
            totalItems={data.pagination.total}
            totalPages={data.pagination.totalPages}
            onPageChange={(page) => pagination.gotoPage(page - 1)}
            onPageSizeChange={pagination.setPageSize}
            itemName="session"
            itemNamePlural="sessions"
          />
        )}
      </div>
    );
  }

  if (paginationStyle === 'infinite') {
    return (
      <InfiniteScroll
        className={className}
        hasMore={data?.pagination.hasNext || false}
        isLoading={isFetching}
        next={loadMore}
      >
        <div className="grid gap-4">
          {displaySessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
          {isLoading && currentPage === 1 && (
            <>
              <SessionSkeleton />
              <SessionSkeleton />
              <SessionSkeleton />
            </>
          )}
        </div>
        <div ref={sentinelRef} />
      </InfiniteScroll>
    );
  }

  // Load more style
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-4">
        {isLoading && currentPage === 1 ? (
          <>
            <SessionSkeleton />
            <SessionSkeleton />
            <SessionSkeleton />
          </>
        ) : (
          displaySessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
        )}
      </div>
      
      <LoadMoreButton
        onClick={loadMore}
        isLoading={isFetching}
        hasMore={data?.pagination.hasNext || false}
        itemsCount={displaySessions.length}
        totalCount={data?.pagination.total}
      />
    </div>
  );
}