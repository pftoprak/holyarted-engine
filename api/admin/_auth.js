import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, resolveSupabaseUrl } from '../_lib/supabase.js';

// Verify the Supabase JWT from the Authorization header and check admin role
export async function verifyAdmin(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;

  const token = auth.substring(7);

  try {
    // Create a Supabase client authenticated with the user's token
    const url = resolveSupabaseUrl(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
    );
    const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const serviceSupabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') return null;

    return user;
  } catch {
    return null;
  }
}

export function unauthorizedResponse(res) {
  setCorsHeaders(res);
  return res.status(401).json({ error: 'Unauthorized' });
}
