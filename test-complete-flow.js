// Complete test script to verify ranked mode flow
const axios = require('axios');

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete Ranked Mode Flow...\n');
    
    // Step 1: Check initial status
    console.log('1. Checking initial ranked status...');
    const initialStatus = await axios.get('http://localhost:8081/api/me/ranked-status', {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    console.log('✅ Initial status:', {
      pointsToday: initialStatus.data.pointsToday,
      questionsCounted: initialStatus.data.questionsCounted,
      livesRemaining: initialStatus.data.livesRemaining
    });

    // Step 2: Create ranked session
    console.log('\n2. Creating ranked session...');
    const sessionResponse = await axios.post('http://localhost:8081/api/ranked/sessions', {
      book: 'Genesis',
      difficulty: 'easy'
    }, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    const sessionId = sessionResponse.data.sessionId;
    console.log('✅ Session created:', sessionId);

    // Step 3: Submit multiple answers
    console.log('\n3. Submitting answers...');
    const answers = [
      { questionId: 'q1', selectedAnswer: 1, isCorrect: true },
      { questionId: 'q2', selectedAnswer: 2, isCorrect: false },
      { questionId: 'q3', selectedAnswer: 1, isCorrect: true },
      { questionId: 'q4', selectedAnswer: 3, isCorrect: true },
      { questionId: 'q5', selectedAnswer: 2, isCorrect: false }
    ];

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      try {
        const answerResponse = await axios.post(`http://localhost:8081/api/ranked/sessions/${sessionId}/answer`, {
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect: answer.isCorrect
        }, {
          headers: { 'Authorization': 'Bearer test-token' }
        });
        console.log(`✅ Answer ${i + 1} submitted:`, {
          correct: answer.isCorrect,
          livesRemaining: answerResponse.data.livesRemaining,
          questionsCounted: answerResponse.data.questionsCounted,
          pointsToday: answerResponse.data.pointsToday
        });
      } catch (error) {
        console.log(`❌ Answer ${i + 1} failed:`, error.response?.status, error.response?.statusText);
      }
    }

    // Step 4: Check final status
    console.log('\n4. Checking final status...');
    const finalStatus = await axios.get('http://localhost:8081/api/me/ranked-status', {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    console.log('✅ Final status:', {
      pointsToday: finalStatus.data.pointsToday,
      questionsCounted: finalStatus.data.questionsCounted,
      livesRemaining: finalStatus.data.livesRemaining
    });

    // Step 5: Check leaderboard
    console.log('\n5. Checking leaderboard...');
    const leaderboard = await axios.get('http://localhost:8081/api/leaderboard/daily');
    console.log('✅ Leaderboard:', leaderboard.data);

    // Step 6: Check database
    console.log('\n6. Database should show:');
    console.log('- points_counted: 30 (3 correct answers × 10 points)');
    console.log('- questions_counted: 5');
    console.log('- lives_remaining: 998 (1000 - 2 wrong answers)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.statusText);
      console.error('Data:', error.response.data);
    }
  }
}

testCompleteFlow();
