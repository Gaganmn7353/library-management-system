/**
 * Quick connection test script
 * Run: node test-connection.js
 */

import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

console.log('🔍 Testing Backend Connection...\n');

// Test 1: Health check
async function testHealth() {
  try {
    console.log('1. Testing /api/health endpoint...');
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('   ✅ Health check passed!');
    console.log('   Response:', response.data);
    return true;
  } catch (error) {
    console.log('   ❌ Health check failed!');
    if (error.code === 'ECONNREFUSED') {
      console.log('   ⚠️  Backend server is not running!');
      console.log('   💡 Start backend with: cd backend && npm run dev');
    } else {
      console.log('   Error:', error.message);
    }
    return false;
  }
}

// Test 2: Login endpoint
async function testLogin() {
  try {
    console.log('\n2. Testing /api/auth/login endpoint...');
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    console.log('   ✅ Login endpoint works!');
    console.log('   Response status:', response.status);
    return true;
  } catch (error) {
    console.log('   ❌ Login endpoint failed!');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data?.message || error.message);
    } else {
      console.log('   Error:', error.message);
    }
    return false;
  }
}

// Run tests
async function runTests() {
  const healthOk = await testHealth();
  
  if (healthOk) {
    await testLogin();
  } else {
    console.log('\n⚠️  Cannot proceed with login test - backend is not running.');
    console.log('\n📋 Next steps:');
    console.log('   1. Make sure PostgreSQL is running');
    console.log('   2. Start backend: cd backend && npm run dev');
    console.log('   3. Wait for "Server is running on port 5000" message');
    console.log('   4. Run this test again: node test-connection.js');
  }
  
  console.log('\n✅ Test complete!');
}

runTests().catch(console.error);

