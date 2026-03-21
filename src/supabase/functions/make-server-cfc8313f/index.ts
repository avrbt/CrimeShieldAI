import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ==================== KV STORE (Inline) ====================
// This provides a simple key-value interface using Supabase database

const kvClient = () => createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

const KV_TABLE = "kv_store_cfc8313f";

const kv = {
  async set(key: string, value: any): Promise<void> {
    const supabase = kvClient();
    const { error } = await supabase.from(KV_TABLE).upsert({
      key,
      value
    });
    if (error) {
      console.error('KV set error:', error);
      throw new Error(error.message);
    }
  },

  async get(key: string): Promise<any> {
    const supabase = kvClient();
    const { data, error } = await supabase.from(KV_TABLE).select("value").eq("key", key).maybeSingle();
    if (error) {
      console.error('KV get error:', error);
      throw new Error(error.message);
    }
    return data?.value;
  },

  async getByPrefix(prefix: string): Promise<any[]> {
    const supabase = kvClient();
    const { data, error } = await supabase.from(KV_TABLE).select("key, value").like("key", prefix + "%");
    if (error) {
      console.error('KV getByPrefix error:', error);
      throw new Error(error.message);
    }
    return data?.map((d) => d.value) ?? [];
  }
};

// ==================== MAIN APP ====================

const app = new Hono();

// Initialize Supabase client for auth operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Debug middleware - log all requests
app.use('*', async (c, next) => {
  console.log('=== Incoming Request ===');
  console.log('Method:', c.req.method);
  console.log('Path:', c.req.path);
  console.log('Headers:', Object.fromEntries(c.req.header()));
  await next();
  console.log('=== Request Complete ===');
});

// Middleware to verify authentication
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return user;
}

// ==================== HEALTH CHECK ====================

app.get("/health", (c) => {
  const hasSupabaseUrl = !!Deno.env.get('SUPABASE_URL');
  const hasServiceKey = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log('Health check:', { hasSupabaseUrl, hasServiceKey });
  
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl,
      hasServiceKey,
    }
  });
});

// ==================== AUTHENTICATION ROUTES ====================

// Sign up new user
app.post("/auth/signup", async (c) => {
  try {
    console.log('=== SIGNUP REQUEST START ===');
    
    const body = await c.req.json();
    const { email, password, name, role, aadhaar, phone, organization } = body;

    console.log('Signup data received:', { email, name, role, hasPassword: !!password });

    // Validate required fields
    if (!email || !password || !name || !role) {
      console.error('Missing required fields:', { 
        hasEmail: !!email, 
        hasPassword: !!password, 
        hasName: !!name, 
        hasRole: !!role 
      });
      return c.json({ error: 'Missing required fields: email, password, name, and role are required' }, 400);
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceKey,
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING'
    });

    if (!supabaseUrl || !serviceKey) {
      console.error('CRITICAL: Missing environment variables!');
      return c.json({ 
        error: 'Server configuration error: Environment variables not set. Please contact administrator.' 
      }, 500);
    }

    // Create user with Supabase Auth
    console.log('Creating user in Supabase Auth...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        role,
        aadhaar: aadhaar || null,
        phone: phone || null,
        organization: organization || null,
        created_at: new Date().toISOString(),
      },
      email_confirm: true,
    });

    if (error) {
      console.error('Supabase Auth error:', error);
      return c.json({ error: error.message || 'Failed to create user' }, 400);
    }

    console.log('User created successfully:', data.user.id);

    // Store additional user data in KV store
    try {
      console.log('Storing user data in KV store...');
      await kv.set(`user:${data.user.id}`, {
        id: data.user.id,
        email,
        name,
        role,
        aadhaar,
        phone,
        organization,
        created_at: new Date().toISOString(),
        verified: true,
      });
      console.log('User data stored in KV store');
    } catch (kvError) {
      console.error('KV store error (non-fatal):', kvError);
      // Continue anyway - the user is created in auth
    }

    console.log('=== SIGNUP REQUEST SUCCESS ===');
    
    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role,
      }
    });
  } catch (err: any) {
    console.error('=== SIGNUP REQUEST FAILED ===');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    return c.json({ 
      error: `Internal server error: ${err.message || 'Unknown error'}` 
    }, 500);
  }
});

// Get user profile
app.get("/auth/profile", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    
    return c.json({ 
      success: true, 
      profile: profile || {
        id: user.id,
        email: user.email,
        ...user.user_metadata,
      }
    });
  } catch (err: any) {
    console.error('Profile fetch error:', err);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user profile
app.put("/auth/profile", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const existingProfile = await kv.get(`user:${user.id}`) || {};
    
    const updatedProfile = {
      ...existingProfile,
      ...body,
      id: user.id,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`user:${user.id}`, updatedProfile);

    return c.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ==================== CRIME ALERTS ROUTES ====================

app.post("/alerts", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { type, severity, description, location, latitude, longitude, state, district } = body;

    const alertId = `alert:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const alert = {
      id: alertId,
      userId: user.id,
      type,
      severity,
      description,
      location,
      latitude,
      longitude,
      state,
      district,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    await kv.set(alertId, alert);

    return c.json({ success: true, alert });
  } catch (err: any) {
    console.error('Alert creation error:', err);
    return c.json({ error: 'Failed to create alert' }, 500);
  }
});

app.get("/alerts", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const state = c.req.query('state');
    const district = c.req.query('district');
    const severity = c.req.query('severity');

    let alerts = await kv.getByPrefix('alert:');

    if (state) {
      alerts = alerts.filter((alert: any) => alert.state === state);
    }

    if (district) {
      alerts = alerts.filter((alert: any) => alert.district === district);
    }

    if (severity) {
      alerts = alerts.filter((alert: any) => alert.severity === severity);
    }

    alerts.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, alerts });
  } catch (err: any) {
    console.error('Alerts fetch error:', err);
    return c.json({ error: 'Failed to fetch alerts' }, 500);
  }
});

app.put("/alerts/:id", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const alertId = c.req.param('id');
    const body = await c.req.json();
    
    const existingAlert = await kv.get(alertId);
    if (!existingAlert) {
      return c.json({ error: 'Alert not found' }, 404);
    }

    const updatedAlert = {
      ...existingAlert,
      ...body,
      updated_at: new Date().toISOString(),
    };

    await kv.set(alertId, updatedAlert);

    return c.json({ success: true, alert: updatedAlert });
  } catch (err: any) {
    console.error('Alert update error:', err);
    return c.json({ error: 'Failed to update alert' }, 500);
  }
});

// ==================== EVIDENCE ROUTES ====================

app.post("/evidence", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { title, type, category, description, location, imageUrl, tags } = body;

    const evidenceId = `evidence:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const evidence = {
      id: evidenceId,
      userId: user.id,
      title,
      type,
      category,
      description,
      location,
      imageUrl,
      tags: tags || [],
      status: 'active',
      created_at: new Date().toISOString(),
    };

    await kv.set(evidenceId, evidence);

    return c.json({ success: true, evidence });
  } catch (err: any) {
    console.error('Evidence creation error:', err);
    return c.json({ error: 'Failed to store evidence' }, 500);
  }
});

app.get("/evidence", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');
    const type = c.req.query('type');

    let evidence = await kv.getByPrefix('evidence:');

    if (category) {
      evidence = evidence.filter((item: any) => item.category === category);
    }

    if (type) {
      evidence = evidence.filter((item: any) => item.type === type);
    }

    evidence.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, evidence });
  } catch (err: any) {
    console.error('Evidence fetch error:', err);
    return c.json({ error: 'Failed to fetch evidence' }, 500);
  }
});

// ==================== CCTV FEEDS ROUTES ====================

app.post("/cctv/feeds", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'organization') {
      return c.json({ error: 'Only organizations can register CCTV feeds' }, 403);
    }

    const body = await c.req.json();
    const { name, location, latitude, longitude, status, streamUrl } = body;

    const feedId = `cctv:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const feed = {
      id: feedId,
      organizationId: user.id,
      name,
      location,
      latitude,
      longitude,
      status: status || 'active',
      streamUrl: streamUrl || null,
      created_at: new Date().toISOString(),
    };

    await kv.set(feedId, feed);

    return c.json({ success: true, feed });
  } catch (err: any) {
    console.error('CCTV feed registration error:', err);
    return c.json({ error: 'Failed to register CCTV feed' }, 500);
  }
});

app.get("/cctv/feeds", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.role !== 'organization') {
      return c.json({ error: 'Only organizations can access CCTV feeds' }, 403);
    }

    const feeds = await kv.getByPrefix('cctv:');
    
    feeds.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, feeds });
  } catch (err: any) {
    console.error('CCTV feeds fetch error:', err);
    return c.json({ error: 'Failed to fetch CCTV feeds' }, 500);
  }
});

app.post("/cctv/detections", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { feedId, detectionType, confidence, timestamp, metadata } = body;

    const detectionId = `detection:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const detection = {
      id: detectionId,
      feedId,
      detectionType,
      confidence,
      timestamp: timestamp || new Date().toISOString(),
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    await kv.set(detectionId, detection);

    return c.json({ success: true, detection });
  } catch (err: any) {
    console.error('Detection recording error:', err);
    return c.json({ error: 'Failed to record detection' }, 500);
  }
});

// ==================== THREAT INTELLIGENCE ROUTES ====================

app.post("/threat/check-ip", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { ip } = body;

    if (!ip) {
      return c.json({ error: 'IP address is required' }, 400);
    }

    const results: any = {
      ip,
      checked_at: new Date().toISOString(),
    };

    const abuseIPDBKey = Deno.env.get('ABUSEIPDB_API_KEY');
    if (abuseIPDBKey) {
      try {
        const abuseResponse = await fetch(
          `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`,
          {
            headers: {
              'Key': abuseIPDBKey,
              'Accept': 'application/json',
            },
          }
        );
        const abuseData = await abuseResponse.json();
        results.abuseipdb = abuseData;
      } catch (err) {
        console.error('AbuseIPDB error:', err);
        results.abuseipdb = { error: 'Failed to check AbuseIPDB' };
      }
    }

    const checkId = `threat:ip:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(checkId, { userId: user.id, ...results });

    return c.json({ success: true, results });
  } catch (err: any) {
    console.error('IP check error:', err);
    return c.json({ error: 'Failed to check IP' }, 500);
  }
});

app.post("/threat/check-hash", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { hash } = body;

    if (!hash) {
      return c.json({ error: 'File hash is required' }, 400);
    }

    const virusTotalKey = Deno.env.get('VIRUSTOTAL_API_KEY');
    if (!virusTotalKey) {
      return c.json({ error: 'VirusTotal API key not configured' }, 503);
    }

    try {
      const vtResponse = await fetch(
        `https://www.virustotal.com/api/v3/files/${hash}`,
        {
          headers: {
            'x-apikey': virusTotalKey,
          },
        }
      );
      const vtData = await vtResponse.json();

      const results = {
        hash,
        virustotal: vtData,
        checked_at: new Date().toISOString(),
      };

      const checkId = `threat:hash:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      await kv.set(checkId, { userId: user.id, ...results });

      return c.json({ success: true, results });
    } catch (err: any) {
      console.error('VirusTotal error:', err);
      return c.json({ error: 'Failed to check hash with VirusTotal' }, 500);
    }
  } catch (err: any) {
    console.error('Hash check error:', err);
    return c.json({ error: 'Failed to check hash' }, 500);
  }
});

// ==================== STATISTICS ROUTES ====================

app.get("/stats", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const alerts = await kv.getByPrefix('alert:');
    const evidence = await kv.getByPrefix('evidence:');
    const detections = await kv.getByPrefix('detection:');

    const stats = {
      total_alerts: alerts.length,
      active_alerts: alerts.filter((a: any) => a.status === 'active').length,
      total_evidence: evidence.length,
      total_detections: detections.length,
      alerts_by_severity: {
        high: alerts.filter((a: any) => a.severity === 'high').length,
        medium: alerts.filter((a: any) => a.severity === 'medium').length,
        low: alerts.filter((a: any) => a.severity === 'low').length,
      },
    };

    return c.json({ success: true, stats });
  } catch (err: any) {
    console.error('Stats fetch error:', err);
    return c.json({ error: 'Failed to fetch statistics' }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);
