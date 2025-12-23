'use client';

import React, { use } from 'react';
import { EventPreviewPage } from '@/features/schedule/components/EventPreviewPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventPreview({ params }: PageProps) {
  const { id } = use(params);

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Invalid event ID</p>
      </div>
    );
  }

  return <EventPreviewPage eventId={id} />;
}
