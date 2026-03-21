import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
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

// Health check endpoint
app.get("/make-server-cfc8313f/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    }
  });
});

// ==================== AUTHENTICATION ROUTES ====================

// Sign up new user
app.post("/make-server-cfc8313f/auth/signup", async (c) => {
  try {
    console.log('Signup request received');
    const body = await c.req.json();
    const { email, password, name, role, aadhaar, phone, organization } = body;

    console.log('Signup data:', { email, name, role });

    if (!email || !password || !name || !role) {
      console.error('Missing required fields:', { email: !!email, password: !!password, name: !!name, role: !!role });
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create user with Supabase Auth
    console.log('Creating user in Supabase Auth...');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        role, // 'citizen' or 'organization'
        aadhaar: aadhaar || null,
        phone: phone || null,
        organization: organization || null,
        created_at: new Date().toISOString(),
      },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true,
    });

    if (error) {
      console.error('Supabase Auth error:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('User created successfully:', data.user.id);

    // Store additional user data in KV store
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

    console.log('Signup complete');
    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role,
      }
    });
  } catch (err) {
    console.error('Signup error (caught):', err);
    return c.json({ error: `Internal server error during signup: ${err.message || err}` }, 500);
  }
});

// Get user profile
app.get("/make-server-cfc8313f/auth/profile", async (c) => {
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
  } catch (err) {
    console.error('Profile fetch error:', err);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user profile
app.put("/make-server-cfc8313f/auth/profile", async (c) => {
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
  } catch (err) {
    console.error('Profile update error:', err);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ==================== CRIME ALERTS ROUTES ====================

// Create new crime alert
app.post("/make-server-cfc8313f/alerts", async (c) => {
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
  } catch (err) {
    console.error('Alert creation error:', err);
    return c.json({ error: 'Failed to create alert' }, 500);
  }
});

// Get alerts (with optional filtering)
app.get("/make-server-cfc8313f/alerts", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const state = c.req.query('state');
    const district = c.req.query('district');
    const severity = c.req.query('severity');

    // Get all alerts
    const allAlerts = await kv.getByPrefix('alert:');
    
    let alerts = allAlerts;

    // Filter by state
    if (state) {
      alerts = alerts.filter((alert: any) => alert.state === state);
    }

    // Filter by district
    if (district) {
      alerts = alerts.filter((alert: any) => alert.district === district);
    }

    // Filter by severity
    if (severity) {
      alerts = alerts.filter((alert: any) => alert.severity === severity);
    }

    // Sort by created_at (newest first)
    alerts.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, alerts });
  } catch (err) {
    console.error('Alerts fetch error:', err);
    return c.json({ error: 'Failed to fetch alerts' }, 500);
  }
});

// Update alert status
app.put("/make-server-cfc8313f/alerts/:id", async (c) => {
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
  } catch (err) {
    console.error('Alert update error:', err);
    return c.json({ error: 'Failed to update alert' }, 500);
  }
});

// ==================== EVIDENCE ROUTES ====================

// Store evidence metadata
app.post("/make-server-cfc8313f/evidence", async (c) => {
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
  } catch (err) {
    console.error('Evidence creation error:', err);
    return c.json({ error: 'Failed to store evidence' }, 500);
  }
});

// Get all evidence
app.get("/make-server-cfc8313f/evidence", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization') || '');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const category = c.req.query('category');
    const type = c.req.query('type');

    let evidence = await kv.getByPrefix('evidence:');

    // Filter by category
    if (category) {
      evidence = evidence.filter((item: any) => item.category === category);
    }

    // Filter by type
    if (type) {
      evidence = evidence.filter((item: any) => item.type === type);
    }

    // Sort by created_at (newest first)
    evidence.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, evidence });
  } catch (err) {
    console.error('Evidence fetch error:', err);
    return c.json({ error: 'Failed to fetch evidence' }, 500);
  }
});

// ==================== CCTV FEEDS ROUTES ====================

// Register CCTV feed
app.post("/make-server-cfc8313f/cctv/feeds", async (c) => {
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
  } catch (err) {
    console.error('CCTV feed registration error:', err);
    return c.json({ error: 'Failed to register CCTV feed' }, 500);
  }
});

// Get CCTV feeds
app.get("/make-server-cfc8313f/cctv/feeds", async (c) => {
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
    
    // Sort by created_at (newest first)
    feeds.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, feeds });
  } catch (err) {
    console.error('CCTV feeds fetch error:', err);
    return c.json({ error: 'Failed to fetch CCTV feeds' }, 500);
  }
});

// Record detection event
app.post("/make-server-cfc8313f/cctv/detections", async (c) => {
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
  } catch (err) {
    console.error('Detection recording error:', err);
    return c.json({ error: 'Failed to record detection' }, 500);
  }
});

// ==================== THREAT INTELLIGENCE ROUTES ====================

// Check IP with threat intelligence APIs
app.post("/make-server-cfc8313f/threat/check-ip", async (c) => {
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

    // Check AbuseIPDB if API key is available
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

    // Store check result
    const checkId = `threat:ip:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(checkId, { userId: user.id, ...results });

    return c.json({ success: true, results });
  } catch (err) {
    console.error('IP check error:', err);
    return c.json({ error: 'Failed to check IP' }, 500);
  }
});

// Check file hash with VirusTotal
app.post("/make-server-cfc8313f/threat/check-hash", async (c) => {
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

      // Store check result
      const checkId = `threat:hash:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      await kv.set(checkId, { userId: user.id, ...results });

      return c.json({ success: true, results });
    } catch (err) {
      console.error('VirusTotal error:', err);
      return c.json({ error: 'Failed to check hash with VirusTotal' }, 500);
    }
  } catch (err) {
    console.error('Hash check error:', err);
    return c.json({ error: 'Failed to check hash' }, 500);
  }
});

// ==================== STATISTICS ROUTES ====================

// Get dashboard statistics
app.get("/make-server-cfc8313f/stats", async (c) => {
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
  } catch (err) {
    console.error('Stats fetch error:', err);
    return c.json({ error: 'Failed to fetch statistics' }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);
