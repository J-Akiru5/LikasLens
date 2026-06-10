const fs = require('fs');
const path = require('path');

function mdToHtml(md, title, devColor, devEmoji) {
  const metaMatch = md.match(/^> \*\*Sprint:\*\*(.*?)$/m);
  const sprint = metaMatch ? metaMatch[1].trim() : '';
  const timelineMatch = md.match(/^> \*\*Timeline:\*\*(.*?)$/m);
  const timeline = timelineMatch ? timelineMatch[1].trim() : '';
  const hoursMatch = md.match(/^> \*\*Total Hours:\*\*(.*?)$/m);
  const hours = hoursMatch ? hoursMatch[1].trim() : '';
  const assignedMatch = md.match(/^> \*\*Assigned To:\*\*(.*?)$/m);
  const assigned = assignedMatch ? assignedMatch[1].trim() : '';
  const focusMatch = md.match(/^> \*\*Focus:\*\*(.*?)$/m);
  const focus = focusMatch ? focusMatch[1].trim() : '';
  const statusMatch = md.match(/^> \*\*Status:\*\*(.*?)$/m);
  const status = statusMatch ? statusMatch[1].trim() : '';

  let taskCounter = 0;

  let html = `<!DOCTYPE html>
<html lang="en" data-theme="civic">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
:root {
  --primary: #1B4332;
  --secondary: #2DE1C2;
  --accent: #FFB703;
  --background: #F8F9FA;
  --foreground: #081C15;
  --panel: #F8F9FA;
  --panel-border: rgba(8, 28, 21, 0.2);
  --muted-text: rgba(8, 28, 21, 0.85);
  --dev-accent: ${devColor};
  --shadow-color: #1B4332;
}
[data-theme="ghost"] {
  --primary: #2DE1C2;
  --secondary: #2DE1C2;
  --accent: #FFB703;
  --background: #081C15;
  --foreground: #F8F9FA;
  --panel: rgba(8, 28, 21, 0.9);
  --panel-border: rgba(45, 225, 194, 0.35);
  --muted-text: rgba(248, 249, 250, 0.85);
  --shadow-color: #2DE1C2;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Inter', sans-serif;
  background: var(--background);
  color: var(--foreground);
  line-height: 1.6;
  transition: background 0.4s ease, color 0.4s ease;
}
h1, h2, h3, h4, h5, h6 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
code, pre, .font-data { font-family: 'Space Mono', monospace; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }

/* Theme Toggle */
.theme-toggle {
  position: fixed; top: 1rem; right: 1rem; z-index: 1000;
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--panel); border: 4px solid var(--foreground);
  box-shadow: 4px 4px 0px var(--shadow-color);
  padding: 0.5rem 1rem; cursor: pointer;
  font-family: 'Montserrat', sans-serif; font-weight: 700;
  font-size: 0.75rem; text-transform: uppercase;
  color: var(--foreground); transition: all 0.3s ease;
}
.theme-toggle:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px var(--shadow-color); }
.theme-toggle .dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--accent); transition: background 0.3s ease;
}
[data-theme="ghost"] .theme-toggle .dot { background: var(--secondary); animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Hero */
.hero {
  background: var(--primary);
  color: #F8F9FA;
  padding: 3rem 0;
  border-bottom: 4px solid var(--foreground);
}
.hero .icon { font-size: 3rem; margin-bottom: 0.5rem; }
.hero h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; }
.hero .accent-line { color: var(--dev-accent); font-size: 1rem; font-weight: 700; margin-bottom: 1rem; }
.hero-meta {
  display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem;
}
.hero-meta .meta-chip {
  background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3);
  padding: 0.35rem 0.75rem; font-size: 0.8rem; font-weight: 600;
  font-family: 'Space Mono', monospace;
}

/* Progress Bar */
.progress-container {
  background: var(--panel);
  border: 4px solid var(--foreground);
  box-shadow: 8px 8px 0px var(--shadow-color);
  padding: 1.5rem;
  margin: 2rem 0;
  position: sticky;
  top: 0;
  z-index: 50;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.progress-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: 0.85rem;
  color: var(--foreground);
}
.progress-pct {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--dev-accent);
}
.progress-track {
  height: 12px;
  background: rgba(8, 28, 21, 0.1);
  border: 2px solid var(--foreground);
  overflow: hidden;
}
[data-theme="ghost"] .progress-track {
  background: rgba(255, 255, 255, 0.1);
}
.progress-fill {
  height: 100%;
  background: var(--dev-accent);
  transition: width 0.4s ease;
  width: 0%;
}
.progress-detail {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  color: var(--muted-text);
  margin-top: 0.5rem;
}

/* Brutal Panel */
.brutal-panel {
  background: var(--panel);
  border: 4px solid var(--foreground);
  box-shadow: 8px 8px 0px var(--shadow-color);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
}
.brutal-panel:hover { transform: translate(-2px, -2px); box-shadow: 10px 10px 0px var(--shadow-color); }

/* Section Headers */
.section-header {
  font-size: 1.5rem;
  color: var(--primary);
  margin: 2.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 4px solid var(--dev-accent);
  display: inline-block;
}
[data-theme="ghost"] .section-header { color: var(--secondary); }

/* Day Section */
.day-section { margin: 2rem 0; }
.day-header {
  background: var(--dev-accent);
  color: #fff;
  padding: 0.75rem 1.5rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: 1.25rem;
  text-transform: uppercase;
  border: 4px solid var(--foreground);
  margin-bottom: 1.5rem;
  display: flex; align-items: center; gap: 0.75rem;
}
.day-header .day-num {
  background: rgba(255,255,255,0.2);
  padding: 0.25rem 0.6rem;
  font-size: 0.85rem;
}

/* Task Card */
.task-card { margin-bottom: 2rem; }
.task-title {
  font-size: 1.1rem; font-weight: 800;
  color: var(--foreground);
  margin-bottom: 0.5rem;
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
}
.task-title .task-id {
  background: var(--dev-accent); color: #fff;
  padding: 0.15rem 0.5rem; font-size: 0.7rem;
  font-family: 'Space Mono', monospace;
}

/* Interactive Checkboxes */
.task-check {
  appearance: none;
  width: 18px; height: 18px;
  border: 3px solid var(--foreground);
  background: transparent;
  cursor: pointer;
  position: relative;
  vertical-align: middle;
  margin-right: 0.5rem;
  flex-shrink: 0;
}
.task-check:checked {
  background: var(--secondary);
}
.task-check:checked::after {
  content: '\\2713';
  position: absolute;
  top: -2px; left: 2px;
  font-size: 12px;
  font-weight: 900;
  color: var(--foreground);
}
.task-check-label {
  display: flex;
  align-items: center;
  padding: 0.35rem 0;
  font-size: 0.9rem;
  cursor: pointer;
}
.task-check-label.done {
  text-decoration: line-through;
  opacity: 0.7;
}

/* Tags */
.tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: 'Space Mono', monospace;
  text-transform: uppercase;
  border: 2px solid;
  margin-right: 0.25rem;
}
.tag-done { background: rgba(45, 225, 194, 0.2); border-color: #2DE1C2; color: #1B4332; }
.tag-pending { background: rgba(255, 183, 3, 0.15); border-color: #FFB703; color: #b8860b; }
.tag-blocked { background: rgba(220, 53, 69, 0.1); border-color: #dc3545; color: #dc3545; }

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.85rem;
}
th, td {
  border: 2px solid var(--foreground);
  padding: 0.5rem 0.75rem;
  text-align: left;
}
th {
  background: var(--primary);
  color: #F8F9FA;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
}
tr:nth-child(even) { background: rgba(0,0,0,0.02); }
[data-theme="ghost"] tr:nth-child(even) { background: rgba(255,255,255,0.02); }
code {
  background: rgba(0,0,0,0.06);
  padding: 0.15rem 0.4rem;
  font-size: 0.85em;
  border: 1px solid rgba(0,0,0,0.1);
}
[data-theme="ghost"] code {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.15);
}
pre {
  background: var(--foreground);
  color: var(--background);
  padding: 1rem;
  border: 4px solid var(--foreground);
  overflow-x: auto;
  margin: 0.75rem 0;
  font-size: 0.8rem;
}
pre code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
}
.footer {
  margin-top: 4rem;
  padding: 2rem 0;
  border-top: 4px solid var(--foreground);
  text-align: center;
  font-size: 0.8rem;
  color: var(--muted-text);
}
.footer a { color: var(--dev-accent); font-weight: 700; }
@media (max-width: 768px) {
  .hero h1 { font-size: 1.75rem; }
  .hero-meta { flex-direction: column; }
  .brutal-panel { padding: 1rem; }
  table { font-size: 0.75rem; }
  th, td { padding: 0.35rem 0.5rem; }
  .progress-container { position: static; }
}
</style>
</head>
<body>

<button class="theme-toggle" onclick="toggleTheme()">
  <span class="dot"></span>
  <span class="label" id="theme-label">CIVIC</span>
</button>

<div class="hero">
  <div class="container">
    <div class="icon">${devEmoji}</div>
    <h1>${title.replace('LikasLens Sprint \u2014 ', '')}</h1>
    <div class="accent-line">${sprint}</div>
    <div class="hero-meta">
      <span class="meta-chip">\u{1F4C5} ${timeline}</span>
      <span class="meta-chip">\u23F1 ${hours}</span>
      <span class="meta-chip">\u{1F464} ${assigned}</span>
      ${status ? `<span class="meta-chip">${status}</span>` : ''}
    </div>
    <p style="margin-top:1rem;font-size:0.9rem;opacity:0.85">${focus}</p>
  </div>
</div>

<main class="container">

  <div class="progress-container" id="progress-bar">
    <div class="progress-header">
      <span class="progress-title">Sprint Progress</span>
      <span class="progress-pct" id="progress-pct">0%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" id="progress-fill"></div>
    </div>
    <div class="progress-detail">
      <span id="progress-done">0</span> / <span id="progress-total">0</span> tasks completed
    </div>
  </div>

`;

  const lines = md.split('\n');
  let inList = false;
  let inTable = false;
  let tableRows = [];
  let skipMeta = true;
  let sectionCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (skipMeta) {
      if (line.startsWith('>') || line.startsWith('---') || line.trim() === '') continue;
      if (line.startsWith('# ')) { skipMeta = false; }
      else continue;
    }

    if (line.match(/^# Developer/)) continue;

    // Team Roster
    if (line.includes('## Team Roster')) {
      if (inList) { html += '</div>\n'; inList = false; }
      html += '<h2 class="section-header">\u{1F465} Team Roster</h2>\n';
      continue;
    }

    // Completed Work
    if (line.includes('Completed Work')) {
      if (inList) { html += '</div>\n'; inList = false; }
      html += '<div class="brutal-panel"><h3 style="margin-bottom:0.75rem">\u2705 Completed Work</h3>\n';
      inList = true;
      continue;
    }

    // Day headers
    if (line.match(/^## Day \d/)) {
      if (inList) { html += '</div>\n'; inList = false; }
      const dayMatch = line.match(/^## Day \d+ \u2014 (.+)/);
      html += `<div class="day-section"><div class="day-header"><span class="day-num">${line.match(/Day \d/)[0]}</span>${dayMatch ? dayMatch[1] : ''}</div>\n`;
      continue;
    }

    // Task headers
    if (line.match(/^### Task/)) {
      if (inList) { html += '</div>\n'; inList = false; }
      sectionCounter++;
      const taskMatch = line.match(/### Task ([\d.]+): (.+)/);
      if (taskMatch) {
        html += `<div class="task-card"><div class="task-title"><span class="task-id">${taskMatch[1]}</span>${taskMatch[2]}</div>\n`;
      }
      continue;
    }

    // Section headers
    if (line.match(/^## /)) {
      if (inList) { html += '</div>\n'; inList = false; }
      html += `<h2 class="section-header">${line.replace(/^## /, '')}</h2>\n`;
      continue;
    }

    if (line.match(/^### /)) {
      if (inList) { html += '</div>\n'; inList = false; }
      html += `<h3 style="font-size:1.1rem;margin:1.5rem 0 0.75rem">${line.replace(/^### /, '')}</h3>\n`;
      continue;
    }

    if (line.match(/^#### /)) {
      if (inList) { html += '</div>\n'; inList = false; }
      html += `<h4 style="font-size:0.95rem;margin:1rem 0 0.5rem;font-weight:700">${line.replace(/^#### /, '')}</h4>\n`;
      continue;
    }

    // Interactive checkboxes - done
    if (line.match(/^- \[x\]/)) {
      taskCounter++;
      const id = `task-${sectionCounter}-${taskCounter}`;
      const text = line.replace(/^- \[x\] /, '');
      html += `<label class="task-check-label done"><input type="checkbox" class="task-check" data-id="${id}" checked> ${text}</label>\n`;
      if (!inList) inList = true;
      continue;
    }

    // Interactive checkboxes - pending
    if (line.match(/^- \[ \]/)) {
      taskCounter++;
      const id = `task-${sectionCounter}-${taskCounter}`;
      const text = line.replace(/^- \[ \] /, '');
      html += `<label class="task-check-label"><input type="checkbox" class="task-check" data-id="${id}"> ${text}</label>\n`;
      if (!inList) inList = true;
      continue;
    }

    // Status tags
    if (line.includes('\u2705 COMPLETE') || line.includes('\u2705 DONE')) {
      html += `<p><span class="tag tag-done">\u2705 Complete</span></p>\n`;
      continue;
    }
    if (line.includes('\u274C NOT DONE')) {
      html += `<p><span class="tag tag-blocked">\u274C Not Done</span></p>\n`;
      continue;
    }
    if (line.includes('\u26A0\uFE0F PARTIAL') || line.includes('\u26A0\uFE0F TEMPLATE')) {
      html += `<p><span class="tag tag-pending">\u26A0\uFE0F Partial</span></p>\n`;
      continue;
    }

    // Tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      if (!line.match(/^\|\s*-/)) {
        tableRows.push(line);
      }
      continue;
    } else if (inTable) {
      html += '<table>\n';
      for (let r = 0; r < tableRows.length; r++) {
        const cells = tableRows[r].split('|').filter(c => c.trim() !== '');
        const tag = r === 0 ? 'th' : 'td';
        html += '<tr>';
        cells.forEach(c => {
          let content = c.trim()
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>');
          html += `<${tag}>${content}</${tag}>`;
        });
        html += '</tr>\n';
      }
      html += '</table>\n';
      inTable = false;
      tableRows = [];
    }

    // Bold lines
    if (line.match(/^\*\*.+\*\*$/)) {
      html += `<p style="font-weight:700;margin:0.75rem 0 0.25rem">${line.replace(/\*\*/g, '')}</p>\n`;
      continue;
    }

    // List items
    if (line.match(/^- /)) {
      if (inList) { html += '</div>\n'; inList = false; }
      html += `<p style="padding-left:1rem">\u2022 ${line.replace(/^- /, '')}</p>\n`;
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      html += `<p style="padding-left:1rem">${line}</p>\n`;
      continue;
    }

    // Horizontal rules
    if (line.match(/^---+$/)) {
      if (inList) { html += '</div>\n'; inList = false; }
      html += '<hr style="border:none;border-top:4px solid var(--foreground);margin:2rem 0">\n';
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      if (inList) { html += '</div>\n'; inList = false; }
      continue;
    }

    // Regular paragraphs
    let processed = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
    html += `<p>${processed}</p>\n`;
  }

  if (inList) html += '</div>\n';

  html += `
<div class="footer">
  <p>LikasLens Sprint Roadmap \u2014 Generated ${new Date().toISOString().split('T')[0]}</p>
  <p><a href="https://github.com/J-Akiru5/LikasLens">GitHub</a> \u00B7 <a href="/">Home</a></p>
</div>
</main>

<script>
(function() {
  var STORAGE_KEY = 'likaslens-sprint-progress';

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch(e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch(e) {
      console.warn('Could not save progress to localStorage');
    }
  }

  function updateProgress() {
    var checks = document.querySelectorAll('.task-check');
    var checked = document.querySelectorAll('.task-check:checked');
    var total = checks.length;
    var done = checked.length;
    var pct = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('progress-pct').textContent = pct + '%';
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-done').textContent = done;
    document.getElementById('progress-total').textContent = total;

    var fill = document.getElementById('progress-fill');
    if (pct >= 100) {
      fill.style.background = '#4caf50';
    } else if (pct >= 50) {
      fill.style.background = 'var(--dev-accent)';
    } else {
      fill.style.background = 'var(--accent)';
    }
  }

  function init() {
    var state = loadState();
    var checks = document.querySelectorAll('.task-check');

    checks.forEach(function(cb) {
      var id = cb.getAttribute('data-id');

      if (state[id]) {
        cb.checked = true;
      }

      cb.addEventListener('change', function() {
        var currentState = loadState();
        if (this.checked) {
          currentState[id] = true;
          this.parentElement.classList.add('done');
        } else {
          delete currentState[id];
          this.parentElement.classList.remove('done');
        }
        saveState(currentState);
        updateProgress();
      });

      // Set initial done class
      if (cb.checked) {
        cb.parentElement.classList.add('done');
      }
    });

    updateProgress();
  }

  window.toggleTheme = function() {
    var html = document.documentElement;
    var label = document.getElementById('theme-label');
    if (html.getAttribute('data-theme') === 'ghost') {
      html.setAttribute('data-theme', 'civic');
      label.textContent = 'CIVIC';
      localStorage.setItem('likaslens-theme', 'civic');
    } else {
      html.setAttribute('data-theme', 'ghost');
      label.textContent = 'GHOST';
      localStorage.setItem('likaslens-theme', 'ghost');
    }
  };

  var savedTheme = localStorage.getItem('likaslens-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    var label = document.getElementById('theme-label');
    if (label) label.textContent = savedTheme.toUpperCase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
</body>
</html>`;

  return html;
}

const configs = [
  { md: 'sprint-dev1-frontend.md', html: 'sprint-dev1-frontend.html', title: 'LikasLens Sprint \u2014 Developer 1: Design & Frontend', color: '#7b1fa2', emoji: '\uD83C\uDFA8' },
  { md: 'sprint-dev2-ai.md', html: 'sprint-dev2-ai.html', title: 'LikasLens Sprint \u2014 Developer 2: AI Services', color: '#1565c0', emoji: '\uD83E\uDDE0' },
  { md: 'sprint-dev3-backend.md', html: 'sprint-dev3-backend.html', title: 'LikasLens Sprint \u2014 Developer 3: Backend & Infrastructure', color: '#2e7d32', emoji: '\u2699\uFE0F' },
  { md: 'sprint-dev4-integration.md', html: 'sprint-dev4-integration.html', title: 'LikasLens Sprint \u2014 Developer 4: Integration & PWA', color: '#e65100', emoji: '\uD83D\uDE80' },
];

const dir = 'docs/roadmap';
configs.forEach(cfg => {
  const md = fs.readFileSync(path.join(dir, cfg.md), 'utf8');
  const html = mdToHtml(md, cfg.title, cfg.color, cfg.emoji);
  fs.writeFileSync(path.join(dir, cfg.html), html);
  console.log('Generated:', cfg.html, '(' + html.length + ' bytes)');
});
