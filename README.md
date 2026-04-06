# かな Kana Quiz

Practice reading Japanese hiragana and katakana characters.

## Features
- Hiragana & katakana quiz with instant feedback
- 6 different Japanese font styles
- Select which character groups to practice
- Streak tracking and accuracy stats
- Dark / light theme (persisted)
- All settings saved to localStorage — no server needed

## Getting Started

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

### Option A — Automatic (GitHub Actions)

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source → GitHub Actions**
3. Edit `vite.config.js` and change `base` to match your repo name:
   ```js
   base: '/YOUR-REPO-NAME/',
   ```
4. Push to `main` — the workflow will build and deploy automatically.

### Option B — Manual

```bash
npm install
npm run build
# Then push the `dist/` folder to the `gh-pages` branch,
# or use: npx gh-pages -d dist
```

## Project Structure

```
src/
  App.jsx       — main component (quiz logic, theme, layout)
  App.css       — all styles with CSS variables for theming
  kanaData.js   — hiragana/katakana data + font definitions
  main.jsx      — React entry point
```

No database required — fully static, works on GitHub Pages.
