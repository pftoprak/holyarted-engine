import { setCorsHeaders } from '@holyarted/api-shared/supabase.js';
import { streamGenerateComposite } from '@holyarted/api-shared/llm-composite.js';
import { withLogging, rateLimitMiddleware } from '@holyarted/api-shared';

export const config = { maxDuration: 60 };

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    setCorsHeaders(res);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const isLimited = await rateLimitMiddleware(req, res);
  if (isLimited) return;

  const { compositeData } = req.body;
  if (!compositeData) {
    setCorsHeaders(res);
    return res.status(400).json({ error: 'Missing compositeData' });
  }
  await streamGenerateComposite(res, compositeData);
}

export default withLogging(handler);
