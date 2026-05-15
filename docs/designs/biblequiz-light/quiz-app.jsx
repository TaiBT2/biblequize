// Quiz interactive flow — meditative Bible question screen.
const { useState, useEffect, useMemo, useRef } = React;

/* ─────────────────────────────────────────────────────────
   QUESTION BANK
   ───────────────────────────────────────────────────────── */
const QUESTIONS = [
  {
    q: "Sách đầu tiên của Kinh Thánh là sách nào?",
    ref: "Cựu Ước · Sáng Thế Ký",
    choices: ["Xuất Ê-díp-tô Ký", "Sáng Thế Ký", "Lê-vi Ký", "Sáng Đời"],
    answer: 1,
    verse: "Ban đầu Đức Chúa Trời dựng nên trời đất.",
    cite: "Sáng Thế Ký 1:1",
  },
  {
    q: "Ai đã được Chúa dẫn ra khỏi Ai Cập để vào Đất Hứa?",
    ref: "Cựu Ước · Xuất Ê-díp-tô Ký",
    choices: ["Áp-ra-ham", "Đa-vít", "Môi-se", "Sa-lô-môn"],
    answer: 2,
    verse: "Đức Giê-hô-va sẽ vì các ngươi mà chiến đấu; còn các ngươi cứ yên lặng.",
    cite: "Xuất Ê-díp-tô Ký 14:14",
  },
  {
    q: "Câu Kinh Thánh nổi tiếng nhất nói về tình yêu của Đức Chúa Trời nằm ở sách nào?",
    ref: "Tân Ước · Phúc Âm",
    choices: ["Ma-thi-ơ", "Mác", "Lu-ca", "Giăng"],
    answer: 3,
    verse: "Vì Đức Chúa Trời yêu thương thế gian, đến nỗi đã ban Con một của Ngài...",
    cite: "Giăng 3:16",
  },
  {
    q: "Có tất cả bao nhiêu sách trong Kinh Thánh trọn bộ?",
    ref: "Tổng quan · Cựu Ước + Tân Ước",
    choices: ["46 sách", "66 sách", "73 sách", "77 sách"],
    answer: 1,
    verse: "Lời Chúa là ngọn đèn cho chân tôi, ánh sáng cho đường lối tôi.",
    cite: "Thi Thiên 119:105",
  },
  {
    q: "Ai là vị vua đã viết phần lớn các bài Thi Thiên?",
    ref: "Cựu Ước · Thi Thiên",
    choices: ["Sa-lô-môn", "Sau-lơ", "Đa-vít", "Ê-xê-chia"],
    answer: 2,
    verse: "Đức Giê-hô-va là Đấng chăn giữ tôi: tôi sẽ chẳng thiếu thốn gì.",
    cite: "Thi Thiên 23:1",
  },
];

const ENCOURAGE_GOOD = [
  "Tuyệt vời!",
  "Chính xác!",
  "Lời Chúa đã thấm.",
  "Đúng rồi, tiếp tục nhé.",
  "Hay quá!",
];
const ENCOURAGE_BAD = [
  "Không sao, học tiếp nào.",
  "Cùng nhau khám phá tiếp.",
  "Đừng nản — mỗi câu là một bước.",
  "Hãy ghi nhớ đáp án này.",
];

/* ─────────────────────────────────────────────────────────
   COMPONENTS
   ───────────────────────────────────────────────────────── */

function Motes() {
  const dots = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    left: (i * 7.3 + 5) % 100,
    delay: (i * 1.8) % 18,
    duration: 14 + (i % 6) * 2,
    size: 2 + (i % 3),
  })), []);
  return (
    <div className="motes" aria-hidden="true">
      {dots.map((d, i) => (
        <span key={i} className="mote" style={{
          left: `${d.left}%`,
          animationDelay: `${d.delay}s`,
          animationDuration: `${d.duration}s`,
          width: `${d.size}px`, height: `${d.size}px`,
        }} />
      ))}
    </div>
  );
}

function Halo() {
  return (
    <div className="halo" aria-hidden="true">
      <svg viewBox="0 0 200 80" fill="none" stroke="currentColor">
        {/* light rays from a sun/cross above */}
        <g strokeWidth="1.2">
          <line x1="100" y1="80" x2="20" y2="40"/>
          <line x1="100" y1="80" x2="50" y2="10"/>
          <line x1="100" y1="80" x2="100" y2="-10"/>
          <line x1="100" y1="80" x2="150" y2="10"/>
          <line x1="100" y1="80" x2="180" y2="40"/>
          <line x1="100" y1="80" x2="0" y2="80"/>
          <line x1="100" y1="80" x2="200" y2="80"/>
        </g>
        {/* tiny cross at top */}
        <g strokeWidth="2" strokeLinecap="round" opacity="0.8">
          <line x1="100" y1="14" x2="100" y2="42"/>
          <line x1="88" y1="24" x2="112" y2="24"/>
        </g>
        {/* center radiance */}
        <circle cx="100" cy="24" r="3" fill="currentColor"/>
      </svg>
    </div>
  );
}

function SmileReward({ state, xpAmount }) {
  // state: 'idle' | 'show' | 'hide'
  const sparkAngles = useMemo(
    () => Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      const dist = 90 + (i % 3) * 30;
      return {
        sx: Math.cos(a) * dist,
        sy: Math.sin(a) * dist,
        delay: (i % 5) * 0.04,
      };
    }), []
  );

  return (
    <div className="reward" aria-hidden="true">
      <div className={"smile-wrap " + (state === "show" ? "show" : state === "hide" ? "hide" : "")}>
        <div className="smile-halo"></div>
        <div className="sparks">
          {sparkAngles.map((s, i) => (
            <span
              key={i}
              className={"spark" + (state === "show" ? " go" : "")}
              style={{
                "--sx": `${s.sx}px`,
                "--sy": `${s.sy}px`,
                animationDelay: `${s.delay + 0.15}s`,
              }}
            />
          ))}
        </div>
        <div className="smile-face">
          <svg viewBox="0 0 200 200">
            {/* face circle */}
            <circle className="face-circle" cx="100" cy="100" r="90"/>
            {/* blush */}
            <circle className="blush" cx="55" cy="120" r="10"/>
            <circle className="blush" cx="145" cy="120" r="10"/>
            {/* eyes — gentle closed-smile arcs */}
            <path className="eye" d="M 60 88 Q 70 78, 80 88" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path className="eye" d="M 120 88 Q 130 78, 140 88" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
            {/* smile */}
            <path className="smile-curve" d="M 65 125 Q 100 155, 135 125"/>
          </svg>
        </div>
        <div className={"xp-pop" + (state === "show" ? " show" : "")}>
          +{xpAmount} XP
        </div>
      </div>
    </div>
  );
}

function QuizApp() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);     // index of chosen answer
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [rewardState, setRewardState] = useState("idle"); // idle | show | hide
  const [rewardKey, setRewardKey] = useState(0);  // bump to re-mount smile so animations replay
  const [feedback, setFeedback] = useState({ kind: null, text: "" });
  const hideTimer = useRef(null);

  const q = QUESTIONS[idx];
  const isCorrect = picked !== null && picked === q.answer;
  const isWrong = picked !== null && picked !== q.answer;

  function pick(i) {
    if (picked !== null) return;
    setPicked(i);
    setRevealed(true);
    if (i === q.answer) {
      setStreak((s) => s + 1);
      setXpGained(12 + streak); // streak bonus
      setRewardKey((k) => k + 1);  // force remount so animations replay
      setRewardState("show");
      const fb = ENCOURAGE_GOOD[Math.floor(Math.random() * ENCOURAGE_GOOD.length)];
      setFeedback({ kind: "good", text: fb });
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setRewardState("hide"), 1800);
    } else {
      setStreak(0);
      const fb = ENCOURAGE_BAD[Math.floor(Math.random() * ENCOURAGE_BAD.length)];
      setFeedback({ kind: "bad", text: fb });
    }
  }

  function next() {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    if (idx + 1 >= QUESTIONS.length) {
      // restart for demo
      setIdx(0);
    } else {
      setIdx(idx + 1);
    }
    setPicked(null);
    setRevealed(false);
    setRewardState("idle");
    setFeedback({ kind: null, text: "" });
  }

  // cleanup pending timer on unmount
  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  // keyboard 1-4 / Enter
  useEffect(() => {
    function onKey(e) {
      if (revealed && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); return; }
      if (!revealed) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= q.choices.length) pick(n - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const progressPct = ((idx + (revealed ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="quiz-shell">
      <Motes />

      <div className="quiz-top">
        <button className="close" aria-label="Đóng" onClick={() => window.location.href = "Home.html"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>

        <div className="q-progress">
          <span className="label">Câu {idx + 1} / {QUESTIONS.length}</span>
          <div className="track"><i style={{ width: `${progressPct}%` }} /></div>
        </div>

        <div className="q-streak" title="Streak hiện tại">
          <span className="flame">🔥</span>
          <span>{streak}</span>
        </div>

        <button id="theme-toggle" className="close" aria-label="Đổi chế độ sáng/tối" style={{fontSize: "18px"}}>☾</button>
      </div>

      <div className="quiz-stage">
        <div className="question-zone">
          <Halo />
          <div className="q-eyebrow">{q.ref}</div>
          <h1 className="question" key={idx}>{q.q}</h1>

          <div className="answers">
            {q.choices.map((c, i) => {
              const cls =
                picked === null ? "answer" :
                i === q.answer ? "answer correct" :
                i === picked ? "answer wrong" :
                "answer dimmed";
              return (
                <button
                  key={i}
                  className={cls}
                  disabled={picked !== null}
                  onClick={() => pick(i)}
                >
                  <span className="key">{String.fromCharCode(65 + i)}</span>
                  <span>{c}</span>
                  {revealed && i === q.answer && (
                    <svg className="icon-after" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="3" strokeLinecap="round">
                      <path d="M4 12l5 5L20 6"/>
                    </svg>
                  )}
                  {revealed && i === picked && i !== q.answer && (
                    <svg className="icon-after" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ruby)" strokeWidth="3" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className={"reveal-card" + (isWrong ? " show" : "")}>
            <div className="label">Câu trả lời đúng</div>
            <div className="verse">"{q.verse}"</div>
            <div className="cite">— {q.cite}</div>
          </div>
        </div>
      </div>

      <div className="quiz-bottom">
        <div className={"feedback-line " + (feedback.kind ? "show " + feedback.kind : "")}>
          {feedback.text}
        </div>
        {!revealed ? (
          <button className="skip-btn" onClick={() => pick(-1)}>Bỏ qua</button>
        ) : (
          <button className={"continue-btn show"} onClick={next}>
            {idx + 1 >= QUESTIONS.length ? "Hoàn thành" : "Tiếp tục"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </button>
        )}
      </div>

      <SmileReward key={rewardKey} state={rewardState} xpAmount={xpGained} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("quiz-root")).render(<QuizApp />);
