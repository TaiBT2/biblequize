// Tiny React app: handles the Tweaks panel + theme button on Home/Leaderboard.
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light"
}/*EDITMODE-END*/;

// Read persisted preference from localStorage (set by toggle on any page)
function readSavedTheme() {
  try {
    const v = localStorage.getItem("bq-theme");
    if (v === "light" || v === "dark") return v;
  } catch (e) {}
  return TWEAK_DEFAULTS.theme;
}

function applyTheme(theme) {
  const t = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", t);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = t === "light" ? "☀" : "☾";
  try { localStorage.setItem("bq-theme", t); } catch (e) {}
}

function App() {
  // Seed state from localStorage so the panel and other pages stay in sync.
  const initial = { ...TWEAK_DEFAULTS, theme: readSavedTheme() };
  const [t, setTweak] = useTweaks(initial);

  useEffect(() => {
    applyTheme(t.theme);
  }, [t.theme]);

  // Hook up the in-page theme button (works even when panel is closed)
  useEffect(() => {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const handler = () => {
      const next = t.theme === "light" ? "dark" : "light";
      setTweak("theme", next);
    };
    btn.addEventListener("click", handler);
    return () => btn.removeEventListener("click", handler);
  }, [t.theme, setTweak]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Giao diện">
        <TweakRadio
          label="Chế độ"
          value={t.theme}
          onChange={(v) => setTweak("theme", v)}
          options={[
            { value: "dark", label: "Tối" },
            { value: "light", label: "Sáng" },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<App />);
