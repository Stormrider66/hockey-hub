import type { NextApiRequest, NextApiResponse } from 'next';
import type { Program } from '@/types/program';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Program[] | { message: string }>
) {
  if (req.method === 'GET') {
    // TODO: Connect to a database or service
    const programs: Program[] = [];
    res.status(200).json(programs);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
} 