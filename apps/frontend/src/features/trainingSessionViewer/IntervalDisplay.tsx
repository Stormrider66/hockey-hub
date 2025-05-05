import React, { useEffect, useState, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setDisplayMode, toggleFullScreen } from './trainingSessionViewerSlice';
import { Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  socket: Socket | null;
}

export default function IntervalDisplay({ socket }: Props) {
  const dispatch = useAppDispatch();
  const storeIntervals = useAppSelector((s) => s.trainingSessionViewer.intervals);
  const fullScreen = useAppSelector((s) => s.trainingSessionViewer.fullScreen);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Socket flow: update remaining when event arrives
  useEffect(() => {
    if (!socket) return;

    function handleInterval({ seconds }: { seconds: number }) {
      setRemaining(seconds);
    }

    socket.on('interval', handleInterval);

    return () => {
      socket.off('interval', handleInterval);
    };
  }, [socket]);

  // Demo mode: run internal countdown using intervals from store if no socket
  useEffect(() => {
    if (socket || storeIntervals.length === 0) return;

    function startNext() {
      if (index >= storeIntervals.length) {
        dispatch(setDisplayMode('player-list'));
        return;
      }
      setRemaining(storeIntervals[index].duration);
    }

    startNext();
  }, [index, socket, storeIntervals, dispatch]);

  // countdown tick
  useEffect(() => {
    if (remaining <= 0) return;

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIndex((i) => i + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [remaining]);

  if (remaining === 0) {
    return <p className="text-gray-500">Preparing next interval…</p>;
  }

  const current = storeIntervals[index] ?? { phase: 'work', duration: remaining };
  const progress = current.duration ? ((current.duration - remaining) / current.duration) * 100 : 0;

  return (
    <div className={`flex flex-col items-center gap-4 ${fullScreen ? 'fixed inset-0 bg-background z-50' : ''}`}>
      <div className="self-end p-2">
        <Button variant="ghost" size="icon" onClick={() => dispatch(toggleFullScreen())}>
          {fullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </Button>
      </div>
      <p className="text-2xl capitalize">{current.phase}</p>
      <div className="text-6xl font-bold">{remaining}</div>
      <div className="w-full max-w-md h-2 bg-muted rounded">
        <div
          className={`${current.phase === 'work' ? 'bg-green-600' : 'bg-yellow-600'} h-full rounded`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
} 