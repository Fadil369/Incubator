#!/usr/bin/env node

/**
 * BrainSAIT Platform Performance & Load Testing
 * Tests platform performance under load conditions
 */

const https = require('https');

const BASE_URL = 'https://brainsait-backend.dr-mf-12298.workers.dev/api/v1';

// Performance test utility
function performanceTest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = process.hrtime.bigint();
    
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
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ 
            status: res.statusCode, 
            data: parsed, 
            duration,
            size: Buffer.byteLength(data, 'utf8')
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: data, 
            duration,
            size: Buffer.byteLength(data, 'utf8')
          });
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

// Concurrent requests test
async function loadTest(url, concurrency = 10, requests = 50) {
  console.log(`🔥 Load Testing: ${concurrency} concurrent connections, ${requests} total requests`);
  
  const results = [];
  const startTime = Date.now();
  
  // Create batches of concurrent requests
  for (let i = 0; i < requests; i += concurrency) {
    const batch = [];
    const batchSize = Math.min(concurrency, requests - i);
    
    for (let j = 0; j < batchSize; j++) {
      batch.push(performanceTest(url));
    }
    
    try {
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      
      // Progress indicator
      process.stdout.write(`\r⏳ Progress: ${results.length}/${requests} requests completed`);
    } catch (error) {
      console.error(`\n❌ Batch failed: ${error.message}`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n✅ Load test completed in ${totalTime}ms`);
  
  return { results, totalTime };
}

// Analyze performance results
function analyzeResults(results) {
  const durations = results.map(r => r.duration);
  const sizes = results.map(r => r.size);
  const successful = results.filter(r => r.status === 200).length;
  const failed = results.length - successful;
  
  durations.sort((a, b) => a - b);
  
  return {
    total: results.length,
    successful,
    failed,
    successRate: (successful / results.length) * 100,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: durations[0],
    maxDuration: durations[durations.length - 1],
    p50: durations[Math.floor(durations.length * 0.5)],
    p95: durations[Math.floor(durations.length * 0.95)],
    p99: durations[Math.floor(durations.length * 0.99)],
    avgSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
    totalSize: sizes.reduce((a, b) => a + b, 0)
  };
}

// Main performance testing function
async function runPerformanceTests() {
  console.log('⚡ Starting BrainSAIT Platform Performance Testing...\n');
  
  const tests = [
    {
      name: 'Health Endpoint Performance',
      url: `${BASE_URL}/health`,
      concurrency: 5,
      requests: 25
    },
    {
      name: 'Authentication Endpoint Load',
      url: `${BASE_URL}/auth/login`,
      method: 'POST',
      body: { email: 'test@example.com', password: 'test' },
      concurrency: 3,
      requests: 15
    },
    {
      name: 'Service Endpoints Performance',
      url: `${BASE_URL}/programs`,
      concurrency: 4,
      requests: 20
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🎯 Testing: ${test.name}`);
    console.log('─'.repeat(50));
    
    try {
      const { results, totalTime } = await loadTest(
        test.url, 
        test.concurrency, 
        test.requests
      );
      
      const analysis = analyzeResults(results);
      
      console.log('\n📊 Performance Metrics:');
      console.log(`   Total Requests: ${analysis.total}`);
      console.log(`   Successful: ${analysis.successful} (${analysis.successRate.toFixed(1)}%)`);
      console.log(`   Failed: ${analysis.failed}`);
      console.log(`   Average Response Time: ${analysis.avgDuration.toFixed(2)}ms`);
      console.log(`   Min Response Time: ${analysis.minDuration.toFixed(2)}ms`);
      console.log(`   Max Response Time: ${analysis.maxDuration.toFixed(2)}ms`);
      console.log(`   50th Percentile: ${analysis.p50.toFixed(2)}ms`);
      console.log(`   95th Percentile: ${analysis.p95.toFixed(2)}ms`);
      console.log(`   99th Percentile: ${analysis.p99.toFixed(2)}ms`);
      console.log(`   Average Response Size: ${(analysis.avgSize / 1024).toFixed(2)}KB`);
      console.log(`   Requests/Second: ${(analysis.total / (totalTime / 1000)).toFixed(2)}`);
      
      // Performance evaluation
      if (analysis.successRate >= 99 && analysis.p95 < 1000) {
        console.log(`   🎉 EXCELLENT PERFORMANCE!`);
      } else if (analysis.successRate >= 95 && analysis.p95 < 2000) {
        console.log(`   ✅ GOOD PERFORMANCE`);
      } else {
        console.log(`   ⚠️  PERFORMANCE NEEDS ATTENTION`);
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Performance testing completed!');
}

// Execute performance tests
if (require.main === module) {
  runPerformanceTests()
    .catch(error => {
      console.error('Performance testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests, loadTest, analyzeResults };