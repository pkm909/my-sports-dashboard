const dashboard = document.querySelector('#dashboard');
const statusEl = document.querySelector('#status');
const updatedEl = document.querySelector('#updated');
const refresh = document.querySelector('#refresh');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

const num = x => x === undefined || x === null || x === '' ? '—' : String(x);

function ordinal(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n);
  const mod100 = x % 100;
  if (mod100 >= 11 && mod100 <= 13) return x + 'th';
  return x + ({1:'st',2:'nd',3:'rd'}[x % 10] || 'th');
}

function prettyCategory(s) {
  return String(s || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function renderLeague(conf, teams) {
  return `<section class="league">
    <div class="league-head">
      <div class="league-title"><span class="mark">${conf.icon}</span><h2>${esc(conf.league)}</h2></div>
      <div class="league-note">Current season</div>
    </div>
    <div class="teams">
      ${teams.map(t => `<article class="team ${teams.length === 1 ? 'single' : ''}">
        <div class="team-header">
          <div class="team-top">
            <img class="logo" src="${esc(t.logo || '')}" alt="" onerror="this.style.visibility='hidden'">
            <div class="team-name"><h3>${esc(t.name)}</h3><p>${esc(t.abbr)}${t.rank !== undefined ? ` · ${esc(ordinal(t.rank))}${t.group ? ` · ${esc(t.group)}` : ''}` : ''}</p></div>
          </div>
        </div>
        <div class="record"><span class="big">${esc(t.record || '—')}</span><span class="label">record</span></div>
        <div class="mini-grid">
          ${t.rank !== undefined ? `<div class="mini"><b>#${esc(t.rank)}</b><span>Standings</span></div>` : ''}
          ${t.points !== undefined ? `<div class="mini"><b>${esc(t.points)}</b><span>Points</span></div>` : ''}
          ${t.gb !== undefined ? `<div class="mini"><b>${esc(t.gb)}</b><span>GB</span></div>` : ''}
          ${t.streak !== undefined ? `<div class="mini"><b>${esc(t.streak)}</b><span>Streak</span></div>` : ''}
        </div>
        <div class="leaders-title">Team stat leaders</div>
        <div class="leaders">
          ${t.leaders?.length
            ? t.leaders.map(l => `<div class="leader"><span class="cat">${esc(prettyCategory(l.name))}</span><span class="value">${esc(l.athlete)} · ${esc(num(l.value))}</span></div>`).join('')
            : '<div class="leader"><span class="cat">Stats</span><span class="value">Unavailable</span></div>'}
        </div>
      </article>`).join('')}
    </div>
  </section>`;
}

async function load() {
  refresh.disabled = true;
  statusEl.textContent = 'Loading the latest sports snapshot…';
  dashboard.innerHTML = '<div class="league skeleton"></div>'.repeat(4);

  try {
    const response = await fetch(`data.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`data.json returned HTTP ${response.status}`);
    const data = await response.json();

    dashboard.innerHTML = data.leagues.map(conf => renderLeague(conf, conf.teams)).join('');

    const stamp = data.updatedAt ? new Date(data.updatedAt) : new Date();
    updatedEl.textContent = `Updated ${stamp.toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'})}`;
    statusEl.textContent = 'Live dashboard · data refreshes automatically';
  } catch (e) {
    dashboard.innerHTML = `<div class="error">
      <b>Unable to load the sports data.</b><br>
      ${esc(e.message)}<br><br>
      The data service may still be updating. Try Refresh again in a moment.
    </div>`;
    statusEl.textContent = 'Data feed unavailable';
  } finally {
    refresh.disabled = false;
  }
}

refresh.addEventListener('click', load);
load();
setInterval(load, 10 * 60 * 1000);
