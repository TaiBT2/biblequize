// Tiny React app: only the Tweaks panel. Main UI is static HTML for direct editability.
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark"
}/*EDITMODE-END*/;

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = theme === "light" ? "☀" : "☾";
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

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

// Also set theme on initial load (before React mounts) — read from default
(function bootstrap() {
  try {
    applyTheme(TWEAK_DEFAULTS.theme);
  } catch (e) {}
})();
