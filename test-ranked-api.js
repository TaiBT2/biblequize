const axios = require('axios');

async function testRankedAPI() {
  try {
    console.log('Testing ranked API endpoints...');
    
    // Test 1: Get ranked status
    console.log('\n1. Testing GET /api/me/ranked-status');
    const statusResponse = await axios.get('http://localhost:8081/api/me/ranked-status', {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail but we can see the endpoint
      }
    });
    console.log('Status response:', statusResponse.data);
  } catch (error) {
    console.log('Status error (expected):', error.response?.status, error.response?.statusText);
  }

  try {
    // Test 2: Create ranked session
    console.log('\n2. Testing POST /api/ranked/sessions');
    const sessionResponse = await axios.post('http://localhost:8081/api/ranked/sessions', {
      book: 'Genesis',
      difficulty: 'easy'
    }, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('Session response:', sessionResponse.data);
  } catch (error) {
    console.log('Session error (expected):', error.response?.status, error.response?.statusText);
  }

  try {
    // Test 3: Submit answer
    console.log('\n3. Testing POST /api/ranked/sessions/test-session/answer');
    const answerResponse = await axios.post('http://localhost:8081/api/ranked/sessions/test-session/answer', {
      questionId: 'test-question',
      selectedAnswer: 1,
      isCorrect: true
    }, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('Answer response:', answerResponse.data);
  } catch (error) {
    console.log('Answer error (expected):', error.response?.status, error.response?.statusText);
  }

  try {
    // Test 4: Get leaderboard
    console.log('\n4. Testing GET /api/leaderboard/daily');
    const leaderboardResponse = await axios.get('http://localhost:8081/api/leaderboard/daily');
    console.log('Leaderboard response:', leaderboardResponse.data);
  } catch (error) {
    console.log('Leaderboard error:', error.response?.status, error.response?.statusText);
  }
}

testRankedAPI();
