// Test script to check if points are updating correctly
const axios = require('axios');

async function testPointsUpdate() {
  try {
    console.log('🧪 Testing Points Update System...\n');
    
    // Test 1: Check current ranked status
    console.log('1. Checking current ranked status...');
    try {
      const statusResponse = await axios.get('http://localhost:8081/api/me/ranked-status', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Status API working:', statusResponse.data);
    } catch (error) {
      console.log('❌ Status API error:', error.response?.status, error.response?.statusText);
    }

    // Test 2: Check leaderboard
    console.log('\n2. Checking leaderboard...');
    try {
      const leaderboardResponse = await axios.get('http://localhost:8081/api/leaderboard/daily');
      console.log('✅ Leaderboard API working:', leaderboardResponse.data);
    } catch (error) {
      console.log('❌ Leaderboard API error:', error.response?.status, error.response?.statusText);
    }

    // Test 3: Simulate ranked session creation
    console.log('\n3. Testing ranked session creation...');
    try {
      const sessionResponse = await axios.post('http://localhost:8081/api/ranked/sessions', {
        book: 'Genesis',
        difficulty: 'easy'
      }, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Session creation working:', sessionResponse.data);
      
      const sessionId = sessionResponse.data.sessionId;
      
      // Test 4: Simulate answer submission
      console.log('\n4. Testing answer submission...');
      try {
        const answerResponse = await axios.post(`http://localhost:8081/api/ranked/sessions/${sessionId}/answer`, {
          questionId: 'test-question-1',
          selectedAnswer: 1,
          isCorrect: true
        }, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        console.log('✅ Answer submission working:', answerResponse.data);
        
        // Test 5: Check if points updated
        console.log('\n5. Checking if points updated...');
        const updatedStatusResponse = await axios.get('http://localhost:8081/api/me/ranked-status', {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        console.log('✅ Updated status:', updatedStatusResponse.data);
        
      } catch (error) {
        console.log('❌ Answer submission error:', error.response?.status, error.response?.statusText);
      }
      
    } catch (error) {
      console.log('❌ Session creation error:', error.response?.status, error.response?.statusText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPointsUpdate();
