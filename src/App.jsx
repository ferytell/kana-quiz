import { useState, useEffect, useRef, useCallback } from "react";
import { hiragana, katakana, groupLabels, fonts } from "./kanaData";
import "./App.css";

const ALL_GROUPS = Object.keys(groupLabels);
let lastPicked = null;
function pickRandom(arr) {
  let picked;

  do {
    picked = arr[Math.floor(Math.random() * arr.length)];
  } while (picked === lastPicked && arr.length > 1); // Avoid same as last if possible

  lastPicked = picked;
  return picked;
}

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  const [activeFont, setActiveFont] = useState(
    () => localStorage.getItem("font") || "default",
  );

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
  const [bestStreak, setBestStreak] = useState(() =>
    parseInt(localStorage.getItem("bestStreak") || "0"),
  );
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  // Add new state for combination mode
  const [combinationLength, setCombinationLength] = useState(2); // 2 or 3 character combinations
  const [combinationMode, setCombinationMode] = useState(false); // Toggle between single kana and combinations

  // Function to generate a random combination from the pool
  const getRandomCombination = useCallback((pool, length) => {
    if (pool.length === 0) return null;

    // Get random starting point
    const startIndex = Math.floor(Math.random() * pool.length);
    const combination = [];
    let romaji = "";

    for (let i = 0; i < length && startIndex + i < pool.length; i++) {
      const kana = pool[startIndex + i];
      combination.push(kana.kana);
      romaji += kana.romaji;
    }

    // If we couldn't get enough characters, try again from beginning
    if (combination.length < length) {
      return null;
      //return getRandomCombination(pool, length);
    }

    return {
      kana: combination.join(""),
      romaji: romaji,
      isCombination: true,
    };
  }, []);

  const inputRef = useRef(null);

  const getPool = useCallback(() => {
    const pool = [];
    hiragana.forEach((k) => {
      if (enabledHiraganaGroups.includes(k.group)) pool.push(k);
    });
    katakana.forEach((k) => {
      if (enabledKatakanaGroups.includes(k.group)) pool.push(k);
    });
    return pool;
  }, [enabledHiraganaGroups, enabledKatakanaGroups]);

  // Modify nextCard to handle combinations
  const nextCard = useCallback(() => {
    const pool = getPool();
    if (pool.length === 0) {
      setCurrent(null);
      return;
    }

    const font = fonts.find((f) => f.id === activeFont) || fonts[0];
    let card;

    if (combinationMode && combinationLength > 1) {
      // Generate random combination
      card = getRandomCombination(pool, combinationLength);
      if (!card) card = pickRandom(pool);
    } else {
      // Single kana mode
      card = pickRandom(pool);
    }

    setCurrent({ ...card, fontFamily: font.family });
    setInput("");
    setStatus("idle");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [
    getPool,
    activeFont,
    combinationMode,
    combinationLength,
    getRandomCombination,
  ]);

  // Add controls in your UI (add this to the stats-row or header)
  const combinationControls = (
    <div className="combination-controls">
      <label className="combine-toggle">
        <input
          type="checkbox"
          checked={combinationMode}
          onChange={(e) => {
            setCombinationMode(e.target.checked);
            // Reset streak when changing modes
            setStreak(0);
          }}
        />
        Combine Mode
      </label>
      {combinationMode && (
        <select
          value={combinationLength}
          onChange={(e) => setCombinationLength(parseInt(e.target.value))}
          className="combine-length"
        >
          <option value={2}>2 Characters</option>
          <option value={3}>3 Characters</option>
          <option value={4}>4 Characters</option>
        </select>
      )}
    </div>
  );

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
    localStorage.setItem(
      "hiraganaGroups",
      JSON.stringify(enabledHiraganaGroups),
    );
  }, [enabledHiraganaGroups]);

  useEffect(() => {
    localStorage.setItem(
      "katakanaGroups",
      JSON.stringify(enabledKatakanaGroups),
    );
  }, [enabledKatakanaGroups]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!current) return;

    const answer = input.trim().toLowerCase();
    const correct = current.romaji.toLowerCase();

    // Allow retry on wrong answer without resetting status
    if (status === "wrong") {
      // Just check again with current input
      if (answer === correct) {
        setStatus("correct");
        const newStreak = streak + 1;
        setStreak(newStreak);
        setTotalCorrect((t) => t + 1);
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
          localStorage.setItem("bestStreak", String(newStreak));
        }
        setTotalAnswered((t) => t + 1);
        setTimeout(() => nextCard(), 500);
      } else {
        // Still wrong, update wrong answer display
        setWrongAnswer(answer);
        setInput(""); // Clear input for next attempt
      }
      return;
    }

    // Normal submission for idle status
    if (status !== "idle") return;

    setTotalAnswered((t) => t + 1);
    if (answer === correct) {
      setStatus("correct");
      const newStreak = streak + 1;
      setStreak(newStreak);
      setTotalCorrect((t) => t + 1);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
        localStorage.setItem("bestStreak", String(newStreak));
      }
      setTimeout(() => nextCard(), 500);
    } else {
      setStatus("wrong");
      setWrongAnswer(answer);
      setStreak(0);
      setInput(""); // Clear input so user can type new answer
      setTimeout(() => inputRef.current?.focus(), 50); // Keep focus on input
    }
  };

  const handleWrongRetry = () => {
    setInput("");
    setStatus("idle");
    // setTimeout(() => inputRef.current?.focus(), 50);
  };

  const toggleGroup = (type, group) => {
    if (type === "hiragana") {
      setEnabledHiraganaGroups((prev) =>
        prev.includes(group)
          ? prev.filter((g) => g !== group)
          : [...prev, group],
      );
    } else {
      setEnabledKatakanaGroups((prev) =>
        prev.includes(group)
          ? prev.filter((g) => g !== group)
          : [...prev, group],
      );
    }
  };

  const toggleAll = (type, val) => {
    if (type === "hiragana")
      setEnabledHiraganaGroups(val ? [...ALL_GROUPS] : []);
    else setEnabledKatakanaGroups(val ? [...ALL_GROUPS] : []);
  };

  const pool = getPool();
  const accuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">かな</span>
          <span className="title">Kana Quiz</span>
        </div>
        <div className="header-right">
          <div className="font-picker">
            {fonts.map((f) => (
              <button
                key={f.id}
                className={`font-btn ${activeFont === f.id ? "active" : ""}`}
                onClick={() => {
                  setActiveFont(f.id);
                }}
                title={f.label}
                style={{ fontFamily: f.family }}
              >
                あ
              </button>
            ))}
          </div>
          <button
            className="theme-btn"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title="Toggle theme"
          >
            {theme === "dark" ? "☀" : "☽"}
          </button>
        </div>
      </header>

      <main className="main">
        <div className="quiz-panel">
          <div className="stats-row">
            <div className="stat">
              <span className="stat-val">{streak}</span>
              <span className="stat-label">Streak</span>
            </div>
            <div className="stat">
              <span className="stat-val">{bestStreak}</span>
              <span className="stat-label">Best</span>
            </div>
            <div className="stat">
              <span className="stat-val">
                {accuracy !== null ? accuracy + "%" : "—"}
              </span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat">
              <span className="stat-val">{pool.length}</span>
              <span className="stat-label">Pool</span>
            </div>
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
                  <span
                    className="kana-char"
                    style={{ fontFamily: current.fontFamily }}
                  >
                    {current.kana}
                  </span>
                )}
                {status === "correct" && (
                  <div className="feedback correct-feedback">✓</div>
                )}
                {status === "wrong" && (
                  <div className="feedback wrong-feedback">
                    <span>
                      ✗ You typed: <strong>{wrongAnswer}</strong>
                    </span>
                    <span className="correct-hint">
                      Correct: <strong>{current?.romaji}</strong>
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="input-form">
                <input
                  ref={inputRef}
                  className={`kana-input ${status}`}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type romaji..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  disabled={status === "correct"}
                />
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={!input.trim() && status !== "wrong"} // Allow empty input when status is wrong
                >
                  {status === "wrong" ? "Try Again" : "Check"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="selector-panel">
          <div className="selector-section">
            <div className="section-header">
              <h2>
                Combination <span className="kana-label">組み合わせ</span>
              </h2>
            </div>
            <div className="combination-controls">
              <label className="combine-toggle">
                <input
                  type="checkbox"
                  checked={combinationMode}
                  onChange={(e) => {
                    setCombinationMode(e.target.checked);
                    setStreak(0);
                  }}
                />
                <span>Combine</span>
              </label>
              {combinationMode && (
                <select
                  value={combinationLength}
                  onChange={(e) =>
                    setCombinationLength(parseInt(e.target.value))
                  }
                  className="combine-length"
                >
                  <option value={2}>2 chars</option>
                  <option value={3}>3 chars</option>
                  <option value={4}>4 chars</option>
                </select>
              )}
            </div>
          </div>

          <div className="selector-section">
            <div className="section-header">
              <h2>
                Hiragana <span className="kana-label">ひらがな</span>
              </h2>
              <div className="toggle-all-btns">
                <button onClick={() => toggleAll("hiragana", true)}>All</button>
                <button onClick={() => toggleAll("hiragana", false)}>
                  None
                </button>
              </div>
            </div>
            <div className="group-list">
              {ALL_GROUPS.map((group) => {
                const chars = hiragana.filter((k) => k.group === group);
                const checked = enabledHiraganaGroups.includes(group);
                return (
                  <label
                    key={group}
                    className={`group-item ${checked ? "checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleGroup("hiragana", group)}
                    />
                    <div className="group-kana">
                      {chars.slice(0, 5).map((k) => (
                        <span key={k.kana} className="preview-kana">
                          {k.kana}
                        </span>
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
              <h2>
                Katakana <span className="kana-label">カタカナ</span>
              </h2>
              <div className="toggle-all-btns">
                <button onClick={() => toggleAll("katakana", true)}>All</button>
                <button onClick={() => toggleAll("katakana", false)}>
                  None
                </button>
              </div>
            </div>
            <div className="group-list">
              {ALL_GROUPS.map((group) => {
                const chars = katakana.filter((k) => k.group === group);
                const checked = enabledKatakanaGroups.includes(group);
                return (
                  <label
                    key={group}
                    className={`group-item ${checked ? "checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleGroup("katakana", group)}
                    />
                    <div className="group-kana">
                      {chars.slice(0, 5).map((k) => (
                        <span key={k.kana} className="preview-kana">
                          {k.kana}
                        </span>
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
      <footer>
        <p>
          by ferytell{" "}
          <a
            href="https://www.linkedin.com/in/feri-ginanjar-ferytell/"
            target="_blank"
          >
            Linkedin
          </a>
          .
          <a
            href="https://ferytell.github.io/react-portofolio/"
            target="_blank"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
