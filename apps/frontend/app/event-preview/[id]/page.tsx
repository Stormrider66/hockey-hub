'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EventPreviewPage } from '@/features/schedule/components/EventPreviewPage';

export default function EventPreview() {
  const params = useParams();
  const id = params?.id as string;

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Invalid event ID</p>
      </div>
    );
  }

  return <EventPreviewPage eventId={id} />;
}