import { NextApiRequest, NextApiResponse } from 'next';
import spec from '@/lib/swagger-spec.json';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(spec);
}
