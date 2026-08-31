import { createClient } from '@supabase/supabase-js';
import { verifyAdmin, unauthorizedResponse } from './_auth.js';
import { setCorsHeaders } from '../_lib/supabase.js';

// GET /api/admin/llm-config  — Read LLM config
// PUT /api/admin/llm-config  — Write LLM config
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
    try {
      const { data, error } = await serviceSupabase
        .from('llm_config')
        .select('config_key, config_value');

      if (error) throw error;

      const config = {};
      for (const row of data) {
        config[row.config_key] = row.config_value;
      }

      // Ensure max_tokens is a number for the frontend
      if (config.max_tokens) {
        config.max_tokens = parseInt(config.max_tokens);
      }

      setCorsHeaders(res).json(config);
    } catch (err) {
      console.error('LLM config read error:', err);
      setCorsHeaders(res);
      res.status(500).json({ error: 'Failed to read LLM config' });
    }

  } else if (req.method === 'PUT') {
    const configData = req.body;
    if (!configData || typeof configData !== 'object') {
      setCorsHeaders(res);
      return res.status(400).json({ error: 'Config data required' });
    }

    try {
      const records = Object.entries(configData).map(([config_key, config_value]) => ({
        config_key,
        config_value: String(config_value),
      }));

      const { error } = await serviceSupabase
        .from('llm_config')
        .upsert(records, { onConflict: 'config_key' });

      if (error) throw error;

      setCorsHeaders(res).json({ success: true });
    } catch (err) {
      console.error('LLM config write error:', err);
      setCorsHeaders(res);
      res.status(500).json({ error: 'Failed to save LLM config' });
    }

  } else {
    setCorsHeaders(res);
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
