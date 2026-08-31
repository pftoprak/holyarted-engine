import { createClient } from '@supabase/supabase-js';
import { verifyAdmin, unauthorizedResponse } from './_auth.js';
import { setCorsHeaders } from '../_lib/supabase.js';

// GET /api/admin/content?category=showcase  — Read content
// PUT /api/admin/content                    — Write content
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  const user = await verifyAdmin(req);
  if (!user) return unauthorizedResponse(res);

  const serviceSupabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (req.method === 'GET') {
    const category = req.query.category;
    if (!category) {
      setCorsHeaders(res);
      return res.status(400).json({ error: 'category query param required' });
    }

    try {
      const { data, error } = await serviceSupabase
        .from('numerology_content')
        .select('num_key, content')
        .eq('category', category)
        .order('num_key');

      if (error) throw error;

      // Return as { "1": "text...", "2": "text..." } for backward compat
      const result = {};
      for (const row of data) {
        result[row.num_key] = row.content;
      }

      setCorsHeaders(res).json(result);
    } catch (err) {
      console.error('Content read error:', err);
      setCorsHeaders(res);
      res.status(500).json({ error: 'Failed to read content' });
    }

  } else if (req.method === 'PUT') {
    const { category, data: contentData } = req.body;
    if (!category || !contentData) {
      setCorsHeaders(res);
      return res.status(400).json({ error: 'category and data required' });
    }

    try {
      const records = Object.entries(contentData).map(([num_key, content]) => ({
        category,
        num_key,
        content: String(content),
      }));

      const { error } = await serviceSupabase
        .from('numerology_content')
        .upsert(records, { onConflict: 'category,num_key' });

      if (error) throw error;

      setCorsHeaders(res).json({ success: true });
    } catch (err) {
      console.error('Content write error:', err);
      setCorsHeaders(res);
      res.status(500).json({ error: 'Failed to save content' });
    }

  } else {
    setCorsHeaders(res);
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
