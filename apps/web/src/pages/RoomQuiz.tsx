import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStomp } from '../hooks/useStomp';

type Question = {
  id: string;
  content: string;
  options: string[];
  correctAnswer?: number[]; // hidden
};

type PlayerScore = {
  playerId: string;
  username: string;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  accuracy: number;
};

const RoomQuiz: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { connected, send } = useStomp({
    roomId,
    onMessage: (msg) => {
      switch (msg.type) {
        case 'QUESTION_START': {
          const data = msg.data as { questionIndex: number; totalQuestions: number; question: Question; timeLimit: number };
          setQuestionIndex(data.questionIndex);
          setTotalQuestions(data.totalQuestions);
          setQuestion(data.question);
          setSelected(null);
          setTimeLeft(data.timeLimit);
          break;
        }
        case 'SCORE_UPDATE': {
          setScores((prev) => {
            const upd = [...prev];
            const d = msg.data as PlayerScore;
            const i = upd.findIndex(x => x.playerId === d.playerId);
            if (i >= 0) upd[i] = d; else upd.push(d);
            return upd.sort((a,b) => b.score - a.score);
          });
          break;
        }
        case 'LEADERBOARD_UPDATE': {
          const arr = msg.data as PlayerScore[];
          setScores(arr.sort((a,b) => b.score - a.score));
          break;
        }
        case 'QUIZ_END': {
          navigate(`/room/${roomId}/lobby`, { replace: true });
          break;
        }
      }
    }
  });

  useEffect(() => {
    if (!timeLeft) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const canAnswer = useMemo(() => connected && question && timeLeft > 0 && !submitting, [connected, question, timeLeft, submitting]);

  const submitAnswer = async (idx: number) => {
    if (!roomId || !question || !canAnswer) return;
    setSelected(idx);
    setSubmitting(true);
    try {
      send(`/app/room/${roomId}/answer`, {
        questionIndex,
        answerIndex: idx,
        reactionTimeMs: 1000 * Math.max(0, (question ? timeLeft : 0)),
      });
    } finally {
      setTimeout(() => setSubmitting(false), 400);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-black/40 border border-purple-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-purple-200">Câu {questionIndex + 1}/{totalQuestions}</div>
            <div className="text-purple-200">⏱ {timeLeft}s</div>
          </div>
          <div className="text-white text-xl font-semibold mb-5 min-h-[64px]">
            {question?.content || 'Đang chờ câu hỏi...'}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(question?.options ?? []).map((opt, i) => (
              <button
                key={i}
                disabled={!canAnswer}
                onClick={() => submitAnswer(i)}
                className={`p-4 rounded-lg border transition text-left ${selected===i ? 'border-yellow-400 bg-yellow-500/10' : 'border-purple-500/30 bg-black/30 hover:bg-black/50'} text-white`}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span> {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-black/40 border border-purple-500/30 rounded-xl p-4">
          <div className="text-purple-200 font-semibold mb-3">🏆 Bảng điểm</div>
          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {scores.map((s, idx) => (
              <div key={s.playerId} className={`flex items-center justify-between p-3 rounded border ${idx===0 ? 'border-yellow-400' : 'border-purple-500/30'} bg-black/30`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${idx===0 ? 'bg-yellow-500/20' : 'bg-purple-700/30'} border ${idx===0 ? 'border-yellow-500/60' : 'border-purple-500/40'} flex items-center justify-center text-sm`}>{idx+1}</div>
                  <div className="text-white font-medium">{s.username}</div>
                </div>
                <div className="text-right text-purple-200 text-sm">
                  <div>Điểm: <b className="text-white">{s.score}</b></div>
                  <div>Đúng: {s.correctAnswers}/{s.totalAnswered}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomQuiz;


