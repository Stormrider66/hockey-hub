import React, { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useAppSelector } from '../../store/hooks';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

interface Props {
  socket: Socket | null;
}

interface PlayerMetric {
  id: string;
  name: string;
  heartRate?: number;
  watts?: number;
}

// Extracted demo metrics for dependency consistency in useEffect
const demoMetrics: PlayerMetric[] = [
  { id: 'player-1', name: 'Player One', heartRate: 128, watts: 220 },
  { id: 'player-2', name: 'Player Two', heartRate: 142, watts: 260 },
  { id: 'player-3', name: 'Player Three', heartRate: 116, watts: 200 },
];

export default function TeamMetrics({ socket }: Props) {
  const metricType = useAppSelector((state) => state.trainingSessionViewer.metricType);
  const [metrics, setMetrics] = useState<PlayerMetric[]>([]);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    // If no socket connection, populate demo metrics
    if (!socket) {
      setMetrics(demoMetrics);
      return;
    }

    function onConnect() {
      setConnected(true);
    }

    function onDisconnect() {
      setConnected(false);
      setMetrics(demoMetrics);
    }

    function onMetricsUpdate(payload: { players: PlayerMetric[] }) {
      setMetrics(payload.players);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('metrics_update', onMetricsUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('metrics_update', onMetricsUpdate);
    };
  }, [socket]);

  const displayValue = (m: PlayerMetric) => {
    return metricType === 'heartRate' ? m.heartRate ?? '-' : m.watts ?? '-';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Live {metricType === 'heartRate' ? 'Heart Rate' : 'Watts'}</CardTitle>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <p className="text-muted-foreground">Waiting for metrics…</p>
        ) : (
          <div className="space-y-2">
            {metrics
              .slice() // clone
              .sort((a, b) => (Number(displayValue(b)) as number) - (Number(displayValue(a)) as number))
              .map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-md px-3 py-1.5 bg-muted/50"
                >
                  <span>{player.name}</span>
                  <span className="font-mono">
                    {displayValue(player)} {metricType === 'heartRate' ? 'bpm' : 'W'}
                  </span>
                </div>
              ))}
          </div>
        )}
        {!connected && (
          <p className="mt-2 text-red-500 text-sm">Socket offline. Showing demo data.</p>
        )}
      </CardContent>
    </Card>
  );
} 