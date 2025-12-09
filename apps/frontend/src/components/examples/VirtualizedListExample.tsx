'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
import { VirtualizedTable } from '@/components/ui/VirtualizedTable';
import { generateTestPlayers, generateTestPlayerReadiness } from '@/utils/generateTestData';
import { Badge } from '@/components/ui/badge';
import { Users, RefreshCw } from 'lucide-react';

/**
 * Example component demonstrating VirtualizedList usage with large datasets
 */
export const VirtualizedListExample: React.FC = () => {
  const [players, setPlayers] = useState(() => generateTestPlayers({ count: 1000 }));
  const [playerReadiness, setPlayerReadiness] = useState(() => generateTestPlayerReadiness(1000));
  const [selectedTab, setSelectedTab] = useState<'list' | 'table'>('list');

  const handleRefreshData = () => {
    setPlayers(generateTestPlayers({ count: 1000 }));
    setPlayerReadiness(generateTestPlayerReadiness(1000));
  };

  // Example render function for list items
  const renderPlayer = ({ item, style }: { item: any; style: React.CSSProperties }) => {
    return (
      <div style={style} className="px-4">
        <Card className="mb-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  #{item.jerseyNumber} • {item.position} • {item.team}
                </p>
              </div>
              <Badge variant={item.wellness.status === 'healthy' ? 'default' : 'destructive'}>
                {item.wellness.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      header: 'Player Name',
      width: 200,
    },
    {
      key: 'jerseyNumber',
      header: 'Jersey #',
      width: 80,
      align: 'center' as const,
    },
    {
      key: 'position',
      header: 'Position',
      width: 120,
    },
    {
      key: 'team',
      header: 'Team',
      width: 150,
    },
    {
      key: 'wellness',
      header: 'Status',
      width: 100,
      render: (value: any) => (
        <Badge variant={value.status === 'healthy' ? 'default' : 'destructive'}>
          {value.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Virtual Scrolling Example</CardTitle>
              <CardDescription>
                Demonstrating performance with 1000+ players
              </CardDescription>
            </div>
            <Button onClick={handleRefreshData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Tab Selection */}
            <div className="flex gap-2">
              <Button
                variant={selectedTab === 'list' ? 'default' : 'outline'}
                onClick={() => setSelectedTab('list')}
              >
                List View
              </Button>
              <Button
                variant={selectedTab === 'table' ? 'default' : 'outline'}
                onClick={() => setSelectedTab('table')}
              >
                Table View
              </Button>
            </div>

            {/* Display stats */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Showing {players.length} players</span>
            </div>

            {/* Virtualized content */}
            {selectedTab === 'list' ? (
              <VirtualizedList
                items={players}
                height={600}
                itemHeight={90}
                renderItem={renderPlayer}
                overscan={5}
              />
            ) : (
              <VirtualizedTable
                items={players}
                columns={columns}
                height={600}
                rowHeight={48}
                stickyHeader={true}
                sortColumn="name"
                sortDirection="asc"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};