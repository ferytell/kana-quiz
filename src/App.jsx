import { useState, useEffect, useRef, useCallback } from "react";
import { hiragana, katakana, groupLabels, fonts } from "./kanaData";
import "./App.css";

const ALL_GROUPS = Object.keys(groupLabels);

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArr(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [activeFont, setActiveFont] = useState(() => localStorage.getItem("font") || "default");

  const [enabledHiraganaGroups, setEnabledHiraganaGroups] = useState(() => {
    const s = localStorage.getItem("hiraganaGroups");
    return s ? JSON.parse(s) : ["vowels", "k", "s", "t", "n"];
  });
  const [enabledKatakanaGroups, setEnabledKatakanaGroups] = useState(() => {
    const s = localStorage.getItem("katakanaGroups");
    return s ? JSON.parse(s) : [];
  });

  const [current, setCurrent] = useState(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | correct | wrong
  const [wrongAnswer, setWrongAnswer] = useState("");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => parseInt(localStorage.getItem("bestStreak") || "0"));
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  const inputRef = useRef(null);

  const getPool = useCallback(() => {
    const pool = [];
    hiragana.forEach(k => { if (enabledHiraganaGroups.includes(k.group)) pool.push(k); });
    katakana.forEach(k => { if (enabledKatakanaGroups.includes(k.group)) pool.push(k); });
    return pool;
  }, [enabledHiraganaGroups, enabledKatakanaGroups]);

  const nextCard = useCallback(() => {
    const pool = getPool();
    if (pool.length === 0) { setCurrent(null); return; }
    const font = fonts.find(f => f.id === activeFont) || fonts[0];
    const card = pickRandom(pool);
    setCurrent({ ...card, fontFamily: font.family });
    setInput("");
    setStatus("idle");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [getPool, activeFont]);

  useEffect(() => {
    nextCard();
  }, [enabledHiraganaGroups, enabledKatakanaGroups]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("font", activeFont);
  }, [activeFont]);

  useEffect(() => {
    localStorage.setItem("hiraganaGroups", JSON.stringify(enabledHiraganaGroups));
  }, [enabledHiraganaGroups]);

  useEffect(() => {
    localStorage.setItem("katakanaGroups", JSON.stringify(enabledKatakanaGroups));
  }, [enabledKatakanaGroups]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!current || status !== "idle") return;
    const answer = input.trim().toLowerCase();
    const correct = current.romaji.toLowerCase();
    setTotalAnswered(t => t + 1);
    if (answer === correct) {
      setStatus("correct");
      const newStreak = streak + 1;
      setStreak(newStreak);
      setTotalCorrect(t => t + 1);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
        localStorage.setItem("bestStreak", String(newStreak));
      }
      setTimeout(() => nextCard(), 500);
    } else {
      setStatus("wrong");
      setWrongAnswer(answer);
      setStreak(0);
    }
  };

  const handleWrongRetry = () => {
    setInput("");
    setStatus("idle");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const toggleGroup = (type, group) => {
    if (type === "hiragana") {
      setEnabledHiraganaGroups(prev =>
        prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
      );
    } else {
      setEnabledKatakanaGroups(prev =>
        prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
      );
    }
  };

  const toggleAll = (type, val) => {
    if (type === "hiragana") setEnabledHiraganaGroups(val ? [...ALL_GROUPS] : []);
    else setEnabledKatakanaGroups(val ? [...ALL_GROUPS] : []);
  };

  const pool = getPool();
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">かな</span>
          <span className="title">Kana Quiz</span>
        </div>
        <div className="header-right">
          <div className="font-picker">
            {fonts.map(f => (
              <button
                key={f.id}
                className={`font-btn ${activeFont === f.id ? "active" : ""}`}
                onClick={() => { setActiveFont(f.id); }}
                title={f.label}
                style={{ fontFamily: f.family }}
              >
                あ
              </button>
            ))}
          </div>
          <button className="theme-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title="Toggle theme">
            {theme === "dark" ? "☀" : "☽"}
          </button>
        </div>
      </header>

      <main className="main">
        <div className="quiz-panel">
          <div className="stats-row">
            <div className="stat"><span className="stat-val">{streak}</span><span className="stat-label">Streak</span></div>
            <div className="stat"><span className="stat-val">{bestStreak}</span><span className="stat-label">Best</span></div>
            <div className="stat"><span className="stat-val">{accuracy !== null ? accuracy + "%" : "—"}</span><span className="stat-label">Accuracy</span></div>
            <div className="stat"><span className="stat-val">{pool.length}</span><span className="stat-label">Pool</span></div>
          </div>

          {pool.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">？</div>
              <p>Select some characters below to start!</p>
            </div>
          ) : (
            <>
              <div className={`kana-display ${status}`}>
                {current && (
                  <span className="kana-char" style={{ fontFamily: current.fontFamily }}>
                    {current.kana}
                  </span>
                )}
                {status === "correct" && <div className="feedback correct-feedback">✓</div>}
                {status === "wrong" && (
                  <div className="feedback wrong-feedback">
                    <span>✗ You typed: <strong>{wrongAnswer}</strong></span>
                    <span className="correct-hint">Correct: <strong>{current?.romaji}</strong></span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="input-form">
                <input
                  ref={inputRef}
                  className={`kana-input ${status}`}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type romaji..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  disabled={status === "correct"}
                />
                {status === "wrong" ? (
                  <button type="button" className="submit-btn retry" onClick={handleWrongRetry}>Try again</button>
                ) : (
                  <button type="submit" className="submit-btn" disabled={!input.trim() || status === "correct"}>Check</button>
                )}
              </form>
            </>
          )}
        </div>

        <div className="selector-panel">
          <div className="selector-section">
            <div className="section-header">
              <h2>Hiragana <span className="kana-label">ひらがな</span></h2>
              <div className="toggle-all-btns">
                <button onClick={() => toggleAll("hiragana", true)}>All</button>
                <button onClick={() => toggleAll("hiragana", false)}>None</button>
              </div>
            </div>
            <div className="group-list">
              {ALL_GROUPS.map(group => {
                const chars = hiragana.filter(k => k.group === group);
                const checked = enabledHiraganaGroups.includes(group);
                return (
                  <label key={group} className={`group-item ${checked ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleGroup("hiragana", group)}
                    />
                    <div className="group-kana">
                      {chars.slice(0, 5).map(k => (
                        <span key={k.kana} className="preview-kana">{k.kana}</span>
                      ))}
                    </div>
                    <span className="group-label">{groupLabels[group]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="selector-section">
            <div className="section-header">
              <h2>Katakana <span className="kana-label">カタカナ</span></h2>
              <div className="toggle-all-btns">
                <button onClick={() => toggleAll("katakana", true)}>All</button>
                <button onClick={() => toggleAll("katakana", false)}>None</button>
              </div>
            </div>
            <div className="group-list">
              {ALL_GROUPS.map(group => {
                const chars = katakana.filter(k => k.group === group);
                const checked = enabledKatakanaGroups.includes(group);
                return (
                  <label key={group} className={`group-item ${checked ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleGroup("katakana", group)}
                    />
                    <div className="group-kana">
                      {chars.slice(0, 5).map(k => (
                        <span key={k.kana} className="preview-kana">{k.kana}</span>
                      ))}
                    </div>
                    <span className="group-label">{groupLabels[group]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
