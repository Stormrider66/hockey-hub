import React from 'react';
import { useGetPlayersPaginatedQuery } from '@/store/api/trainingApiPaginated';
import { usePagination } from '@/hooks/usePagination';
import { usePageSize } from '@/hooks/usePaginationPreferences';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users, Heart, AlertCircle } from '@/components/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface PaginatedPlayerListProps {
  teamId?: string;
  onPlayerSelect?: (player: any) => void;
  selectedPlayerIds?: string[];
  showMedicalStatus?: boolean;
  className?: string;
}

export function PaginatedPlayerList({
  teamId,
  onPlayerSelect,
  selectedPlayerIds = [],
  showMedicalStatus = true,
  className,
}: PaginatedPlayerListProps) {
  const [search, setSearch] = React.useState('');
  const [wellness, setWellness] = React.useState<string>('');
  const [position, setPosition] = React.useState<string>('');
  
  const debouncedSearch = useDebounce(search, 300);
  const [pageSize, setPageSize] = usePageSize(20, 'player-list');
  
  const pagination = usePagination({
    initialPageSize: pageSize,
    pageSizeOptions: [10, 20, 50, 100],
  });

  const { data, isLoading, isFetching, error } = useGetPlayersPaginatedQuery({
    page: pagination.pageIndex + 1, // API uses 1-based pagination
    pageSize: pagination.pageSize,
    teamId,
    search: debouncedSearch,
    wellness: wellness || undefined,
    position: position || undefined,
  });

  // Update pagination when data changes
  React.useEffect(() => {
    if (data?.pagination) {
      pagination.gotoPage(data.pagination.page - 1); // Convert to 0-based
    }
  }, [data?.pagination.page]);

  React.useEffect(() => {
    setPageSize(pagination.pageSize);
  }, [pagination.pageSize, setPageSize]);

  const handlePageChange = (newPage: number) => {
    pagination.gotoPage(newPage - 1); // Convert to 0-based
  };

  const getWellnessColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'limited':
        return 'text-yellow-600 bg-yellow-50';
      case 'injured':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const PlayerSkeleton = () => (
    <div className="flex items-center space-x-4 p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    </div>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Players
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select value={wellness} onValueChange={setWellness}>
              <SelectTrigger>
                <SelectValue placeholder="All wellness status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All wellness status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
                <SelectItem value="injured">Injured</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="All positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All positions</SelectItem>
                <SelectItem value="forward">Forward</SelectItem>
                <SelectItem value="defense">Defense</SelectItem>
                <SelectItem value="goalie">Goalie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Player List */}
        <div className="space-y-2 mb-6">
          {isLoading && !data ? (
            <>
              <PlayerSkeleton />
              <PlayerSkeleton />
              <PlayerSkeleton />
            </>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load players</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No players found</p>
            </div>
          ) : (
            data?.data.map((player) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer",
                  selectedPlayerIds.includes(player.id)
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:bg-gray-50",
                  isFetching && "opacity-60"
                )}
                onClick={() => onPlayerSelect?.(player)}
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={player.avatarUrl || player.avatar} />
                    <AvatarFallback>
                      {player.firstName?.[0]}{player.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium">
                      {player.firstName} {player.lastName}
                      {player.jerseyNumber && (
                        <span className="ml-2 text-sm text-gray-500">
                          #{player.jerseyNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {player.position || 'No position'}
                      {player.team && ` • ${player.team}`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {showMedicalStatus && player.wellness && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1",
                        getWellnessColor(player.wellness.status)
                      )}
                    >
                      <Heart className="h-3 w-3" />
                      {player.wellness.status}
                    </Badge>
                  )}
                  
                  {player.medicalRestrictions && player.medicalRestrictions.length > 0 && (
                    <Badge variant="outline" className="text-orange-600 bg-orange-50">
                      {player.medicalRestrictions.length} restriction(s)
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <DataTablePagination
            currentPage={data.pagination.page}
            pageSize={data.pagination.pageSize}
            totalItems={data.pagination.total}
            totalPages={data.pagination.totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={(newSize) => pagination.setPageSize(newSize)}
            itemName="player"
            itemNamePlural="players"
          />
        )}
      </CardContent>
    </Card>
  );
}