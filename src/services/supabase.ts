/**
 * Supabase Integration Service
 * Connects with Supabase backend when environment variables or user settings are supplied.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string; version?: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'Supabase URL and Anon Key are required' };
  }

  // Normalize URL
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }

  try {
    // Ping Supabase PostgREST endpoint
    const response = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (response.ok || response.status === 200 || response.status === 404) {
      return {
        success: true,
        message: 'Successfully connected to Supabase PostgREST API!'
      };
    } else {
      return {
        success: false,
        message: `Supabase responded with status ${response.status}: ${response.statusText}`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Could not reach Supabase endpoint: ${err?.message || 'Check URL and CORS settings'}`
    };
  }
}
