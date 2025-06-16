import type { NextApiRequest, NextApiResponse } from 'next';
import type { Exercise } from '@/types/exercise';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Exercise[] | { message: string }>
) {
  if (req.method === 'GET') {
    // TODO: Connect to a database or service
    const exercises: Exercise[] = [];
    res.status(200).json(exercises);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
} 