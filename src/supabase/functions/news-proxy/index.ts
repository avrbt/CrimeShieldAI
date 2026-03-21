// Supabase Edge Function: News Proxy to bypass CORS
// This allows APITube.io to work from the browser

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface NewsRequest {
  location: string;
  query?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Parse request
    const { location, query }: NewsRequest = await req.json();
    
    console.log('📡 News proxy request for:', location);
    
    // Get API key from environment (set in Supabase dashboard)
    const APITUBE_KEY = Deno.env.get('APITUBE_API_KEY') || 'api_live_MpVHDpFp2YPY15T3r4U2lVrchlYnsYWlncsqrxkF';
    
    // Build search query
    const searchQuery = query || `crime police safety ${location} India`;
    
    // Make server-side request (no CORS issues here)
    const apiUrl = `https://api.apitube.io/v1/news?q=${encodeURIComponent(searchQuery)}&language=en&apiKey=${APITUBE_KEY}`;
    
    console.log('🌐 Fetching from APITube.io...');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'API request failed',
          status: response.status,
          message: errorText 
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    const data = await response.json();
    console.log('✅ Successfully fetched news');
    
    // Return data with CORS headers
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

// To deploy this function:
// 1. Make sure you have Supabase CLI installed
// 2. Run: supabase functions deploy news-proxy
// 3. Set environment variable: 
//    supabase secrets set APITUBE_API_KEY=api_live_MpVHDpFp2YPY15T3r4U2lVrchlYnsYWlncsqrxkF
// 4. Update LocationCrimeNews.tsx to use this endpoint

// Usage in LocationCrimeNews.tsx:
/*
const response = await fetch('https://YOUR_SUPABASE_URL/functions/v1/news-proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    location: displayArea 
  })
});

const data = await response.json();
if (data.articles) {
  // Process articles
}
*/
