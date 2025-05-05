import dynamic from 'next/dynamic';

// Dynamically import viewer to disable SSR for socket usage
const TrainingSessionViewer = dynamic(() => import('../../src/features/trainingSessionViewer/TrainingSessionViewer'), { ssr: false });

export default function TrainingSessionPage() {
  return <TrainingSessionViewer />;
} 