import React, { useState } from 'react';
import { Terminal, Play, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface APITestResult {
  name: string;
  status: 'idle' | 'testing' | 'success' | 'failed';
  message: string;
  articles?: number;
  error?: string;
  responseTime?: number;
}

export function NewsAPIDebugger() {
  const [testResults, setTestResults] = useState<APITestResult[]>([
    { name: 'APITube.io', status: 'idle', message: 'Not tested yet' },
    { name: 'Currents API', status: 'idle', message: 'Not tested yet' },
    { name: 'NewsData.io', status: 'idle', message: 'Not tested yet' },
    { name: 'NewsAPI', status: 'idle', message: 'Not tested yet' },
  ]);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const updateTestResult = (index: number, updates: Partial<APITestResult>) => {
    setTestResults(prev => prev.map((result, i) => 
      i === index ? { ...result, ...updates } : result
    ));
  };

  const testAPITube = async (): Promise<APITestResult> => {
    const startTime = Date.now();
    try {
      console.log('🧪 Testing APITube.io API...');
      const API_KEY = 'api_live_MpVHDpFp2YPY15T3r4U2lVrchlYnsYWlncsqrxkF';
      
      // Try multiple endpoint patterns
      const endpoints = [
        `https://api.apitube.io/v1/news?q=${encodeURIComponent('crime India')}&apiKey=${API_KEY}`,
        `https://api.apitube.io/news?q=${encodeURIComponent('crime India')}&key=${API_KEY}`,
        `https://apitube.io/api/news?query=${encodeURIComponent('crime India')}&apikey=${API_KEY}`
      ];
      
      for (let i = 0; i < endpoints.length; i++) {
        const url = endpoints[i];
        console.log(`🌐 Trying endpoint ${i + 1}/${endpoints.length}:`, url.split('?')[0]);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;
          
          console.log('📥 Status:', response.status);
          
          if (!response.ok) {
            console.log('⚠️ Endpoint failed, trying next...');
            continue;
          }
          
          const data = await response.json();
          console.log('📊 Response Data:', data);
          
          const articlesArray = data.articles || data.results || data.data || data.news || [];
          
          if (articlesArray && articlesArray.length > 0) {
            return {
              name: 'APITube.io',
              status: 'success',
              message: 'Successfully fetched articles',
              articles: articlesArray.length,
              responseTime
            };
          }
        } catch (endpointError: any) {
          console.log('⚠️ Endpoint error:', endpointError.message);
          if (i === endpoints.length - 1) throw endpointError;
          continue;
        }
      }
      
      return {
        name: 'APITube.io',
        status: 'failed',
        message: 'All endpoints failed',
        error: 'No valid endpoint found. API may not support CORS.',
        responseTime: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('❌ APITube.io Error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'CORS Error: API blocked by browser. Needs backend proxy.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (>5s)';
      }
      
      return {
        name: 'APITube.io',
        status: 'failed',
        message: 'Request failed',
        error: errorMessage,
        responseTime: Date.now() - startTime
      };
    }
  };

  const testCurrentsAPI = async (): Promise<APITestResult> => {
    const startTime = Date.now();
    try {
      console.log('🧪 Testing Currents API...');
      const API_KEY = 'k1F19HfPVDF9Q3AUnAEKx1v09t3hUJ9t0ioEfmTiwlVlpAP_';
      const url = `https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent('crime India')}&language=en&apiKey=${API_KEY}`;
      
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      if (data.status === 'ok' && data.news) {
        return {
          name: 'Currents API',
          status: 'success',
          message: 'Successfully fetched news',
          articles: data.news.length,
          responseTime
        };
      } else {
        return {
          name: 'Currents API',
          status: 'failed',
          message: 'API returned no articles',
          error: data.message || JSON.stringify(data),
          responseTime
        };
      }
    } catch (error: any) {
      return {
        name: 'Currents API',
        status: 'failed',
        message: 'Request failed',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  };

  const testNewsDataIO = async (): Promise<APITestResult> => {
    const startTime = Date.now();
    try {
      console.log('🧪 Testing NewsData.io API...');
      const API_KEY = 'd9ca6bbae24d4bbbb05cae9870f74ed6';
      const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&q=${encodeURIComponent('crime')}&country=in&language=en`;
      
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      if (data.status === 'success' && data.results) {
        return {
          name: 'NewsData.io',
          status: 'success',
          message: 'Successfully fetched results',
          articles: data.results.length,
          responseTime
        };
      } else {
        return {
          name: 'NewsData.io',
          status: 'failed',
          message: 'API returned no articles',
          error: data.message || JSON.stringify(data),
          responseTime
        };
      }
    } catch (error: any) {
      return {
        name: 'NewsData.io',
        status: 'failed',
        message: 'Request failed',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  };

  const testNewsAPI = async (): Promise<APITestResult> => {
    const startTime = Date.now();
    try {
      console.log('🧪 Testing NewsAPI...');
      const API_KEY = 'b3e7a84cdcd446ed8eadb5c56b469518';
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent('crime India')}&language=en&apiKey=${API_KEY}`;
      
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      if (data.status === 'ok' && data.articles) {
        return {
          name: 'NewsAPI',
          status: 'success',
          message: 'Successfully fetched articles',
          articles: data.articles.length,
          responseTime
        };
      } else {
        return {
          name: 'NewsAPI',
          status: 'failed',
          message: 'API returned error',
          error: data.message || data.code || JSON.stringify(data),
          responseTime
        };
      }
    } catch (error: any) {
      return {
        name: 'NewsAPI',
        status: 'failed',
        message: 'Request failed (CORS blocked)',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  };

  const testAll = async () => {
    setIsTestingAll(true);
    console.log('🚀 Starting comprehensive API testing...');
    console.log('═══════════════════════════════════════════════════════');

    // Test APITube.io
    updateTestResult(0, { status: 'testing', message: 'Testing...' });
    const result1 = await testAPITube();
    updateTestResult(0, result1);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test Currents API
    updateTestResult(1, { status: 'testing', message: 'Testing...' });
    const result2 = await testCurrentsAPI();
    updateTestResult(1, result2);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test NewsData.io
    updateTestResult(2, { status: 'testing', message: 'Testing...' });
    const result3 = await testNewsDataIO();
    updateTestResult(2, result3);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test NewsAPI
    updateTestResult(3, { status: 'testing', message: 'Testing...' });
    const result4 = await testNewsAPI();
    updateTestResult(3, result4);

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ API Testing Complete');
    setIsTestingAll(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'testing':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      case 'failed':
        return 'bg-red-500/10 border-red-500/30';
      case 'testing':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="bg-[#0B1D3A] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[#3BE39C]/10 rounded-lg">
              <Terminal className="w-6 h-6 text-[#3BE39C]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">News API Debugger</h1>
              <p className="text-gray-400 text-sm">Test all news API integrations and check console logs</p>
            </div>
          </div>
          
          <button
            onClick={testAll}
            disabled={isTestingAll}
            className="w-full bg-[#3BE39C] hover:bg-[#3BE39C]/90 text-[#0B1D3A] font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingAll ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Testing APIs...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run All Tests
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={result.name}
              className={`border rounded-xl p-6 transition-all duration-300 ${getStatusBg(result.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <h3 className="text-white font-semibold">{result.name}</h3>
                    <p className="text-gray-400 text-sm">{result.message}</p>
                  </div>
                </div>
                {result.responseTime && (
                  <span className="text-xs text-gray-400">
                    {result.responseTime}ms
                  </span>
                )}
              </div>

              {result.articles !== undefined && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Fetched {result.articles} articles</span>
                </div>
              )}

              {result.error && (
                <div className="mt-3 bg-black/30 rounded-lg p-3">
                  <p className="text-xs text-red-400 font-mono break-all">
                    {result.error}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            Debugging Instructions
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Open your browser's Developer Console (F12 or Cmd+Option+I)</li>
            <li>• Click "Run All Tests" to test all APIs simultaneously</li>
            <li>• Check the console for detailed request/response logs</li>
            <li>• Green = Success, Red = Failed, Blue = Testing, Gray = Not tested</li>
            <li>• If all APIs fail, check your internet connection and API keys</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
