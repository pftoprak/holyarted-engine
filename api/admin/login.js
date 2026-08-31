import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, resolveSupabaseUrl } from '../_lib/supabase.js';

// Admin login using Supabase Auth (email/password)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  try {
    const url = resolveSupabaseUrl(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
    );
    const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setCorsHeaders(res);
      return res.status(401).json({ error: error.message });
    }

    // Verify user has admin role
    const serviceSupabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      setCorsHeaders(res);
      return res.status(403).json({ error: 'Bu hesap admin yetkisine sahip değil.' });
    }

    setCorsHeaders(res).json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    setCorsHeaders(res);
    res.status(500).json({ error: 'Login failed' });
  }
}
