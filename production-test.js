#!/usr/bin/env node

/**
 * BrainSAIT Platform Production Testing Suite
 * Comprehensive end-to-end testing for production environment
 */

const https = require('https');

const BASE_URL = 'https://brainsait-backend.dr-mf-12298.workers.dev/api/v1';

// Test utilities
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test suite
const tests = [
  {
    name: 'Health Check',
    test: () => makeRequest(`${BASE_URL}/health`),
    validate: (result) => result.status === 200 && result.data.status === 'healthy'
  },
  {
    name: 'Authentication - Invalid Login',
    test: () => makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: { email: 'test@example.com', password: 'wrongpass' }
    }),
    validate: (result) => result.status === 401 && result.data.error === 'Login failed'
  },
  {
    name: 'Users Service Endpoint',
    test: () => makeRequest(`${BASE_URL}/users/profile`),
    validate: (result) => result.status === 200 && result.data.message.includes('Users service')
  },
  {
    name: 'Programs Service Endpoint',
    test: () => makeRequest(`${BASE_URL}/programs`),
    validate: (result) => result.status === 200 && result.data.message.includes('Programs service')
  },
  {
    name: 'SME Service Endpoint',
    test: () => makeRequest(`${BASE_URL}/sme`),
    validate: (result) => result.status === 200 && result.data.message.includes('SME service')
  },
  {
    name: 'Analytics Service Endpoint',
    test: () => makeRequest(`${BASE_URL}/analytics`),
    validate: (result) => result.status === 200 && result.data.message.includes('Analytics service')
  },
  {
    name: 'Mentors Service Endpoint',
    test: () => makeRequest(`${BASE_URL}/mentors`),
    validate: (result) => result.status === 200 && result.data.message.includes('Mentors service')
  },
  {
    name: '404 Error Handling',
    test: () => makeRequest(`${BASE_URL}/nonexistent`),
    validate: (result) => result.status === 404 && result.data.error === 'Not Found'
  },
  {
    name: 'CORS Headers Check',
    test: () => makeRequest(`${BASE_URL}/health`),
    validate: (result) => result.headers['access-control-allow-credentials'] === 'true'
  },
  {
    name: 'Security Headers Check',
    test: () => makeRequest(`${BASE_URL}/health`),
    validate: (result) => {
      const headers = result.headers;
      return headers['x-content-type-options'] === 'nosniff' &&
             headers['x-frame-options'] === 'SAMEORIGIN' &&
             headers['strict-transport-security'];
    }
  }
];

// Run tests
async function runTests() {
  console.log('🚀 Starting BrainSAIT Platform Production Testing...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`⏳ Running: ${test.name}`);
      const startTime = Date.now();
      const result = await test.test();
      const duration = Date.now() - startTime;
      
      if (test.validate(result)) {
        console.log(`✅ PASS: ${test.name} (${duration}ms)`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${test.name} (${duration}ms)`);
        console.log(`   Expected validation failed. Status: ${result.status}`);
        console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.name} - ${error.message}`);
      failed++;
    }
    console.log('');
  }
  
  // Summary
  console.log('=' .repeat(50));
  console.log(`🎯 TEST SUMMARY:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log(`🎉 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🚀 All tests passed! Production platform is ready! 🎉');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }
  
  return { passed, failed };
}

// Execute tests
if (require.main === module) {
  runTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests, makeRequest };