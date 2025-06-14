"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Edit, 
  Calendar, 
  AlertTriangle, 
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InjuryDetailModalProps {
  injury: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedInjury: any) => void;
}

interface InjuryDetailModalProps {
  injury: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedInjury: any) => void;
}

export function InjuryDetailModal({ injury, isOpen, onClose }: InjuryDetailModalProps) {
  if (!injury || !isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4">
        <h2 className="text-xl font-bold mb-4">Injury Details - {injury.player}</h2>
        <div className="space-y-4">
          <div>
            <strong>Injury:</strong> {injury.injury}
          </div>
          <div>
            <strong>Body Part:</strong> {injury.bodyPart}
          </div>
          <div>
            <strong>Severity:</strong> {injury.severity}
          </div>
          <div>
            <strong>Status:</strong> {injury.status}
          </div>
          <div>
            <strong>Date:</strong> {injury.dateOccurred}
          </div>
          <div>
            <strong>Progress:</strong> {injury.progress}%
          </div>
        </div>
        <button 
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
} 