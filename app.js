const API='https://site.api.espn.com/apis';
const TEAMS=[
  {league:'MLB',sport:'baseball',key:'mlb',icon:'⚾',teams:[{abbr:'BOS',name:'Boston Red Sox'},{abbr:'SF',name:'San Francisco Giants'}]},
  {league:'NFL',sport:'football',key:'nfl',icon:'🏈',teams:[{abbr:'SF',name:'San Francisco 49ers'}]},
  {league:'NHL',sport:'hockey',key:'nhl',icon:'🏒',teams:[{abbr:'SJ',name:'San Jose Sharks'}]},
  {league:'MLS',sport:'soccer',key:'usa.1',icon:'⚽',teams:[{abbr:'SJ',name:'San Jose Earthquakes'}]}
];
const dashboard=document.querySelector('#dashboard');
const statusEl=document.querySelector('#status');
const updatedEl=document.querySelector('#updated');
const refresh=document.querySelector('#refresh');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>x===undefined||x===null||x===''?'—':String(x);
async function get(path){const r=await fetch(`${API}${path}`,{cache:'no-store'});if(!r.ok)throw new Error(`${r.status} ${path}`);return r.json()}
async function teamCatalog(conf){
  const data=await get(`/site/v2/sports/${conf.sport}/${conf.key}/teams`);
  const list=[]; const walk=o=>{if(!o||typeof o!=='object')return;if(Array.isArray(o))return o.forEach(walk);if(o.team?.abbreviation)list.push(o.team);if(o.teams&&Array.isArray(o.teams))o.teams.forEach(x=>list.push(x.team||x));Object.values(o).forEach(v=>{if(v&&typeof v==='object'&&(v!==o))walk(v)})}; walk(data);
  return [...new Map(list.filter(Boolean).map(t=>[t.abbreviation,t])).values()];
}
function findTeam(catalog,abbr){return catalog.find(t=>String(t.abbreviation).toUpperCase()===abbr)||catalog.find(t=>String(t.shortDisplayName||'').toLowerCase().includes(abbr.toLowerCase()))}
function extractRecord(team){
  const items=team.record?.items||team.record||[]; const arr=Array.isArray(items)?items:[items];
  const overall=arr.find(x=>String(x.type||x.name||'').toLowerCase().includes('overall'))||arr[0]||{};
  const stats=overall.stats||[]; const out={}; stats.forEach(s=>out[String(s.name||s.type||'').toLowerCase()]=s.value??s.displayValue);
  return {wins:out.wins??out.w,losses:out.losses??out.l,ties:out.ties??out.t,otLosses:out.otlosses??out.otl,points:out.points,display:overall.summary||overall.displayValue};
}
function extractStandings(data,id){
  let found=null;
  const walk=o=>{if(!o||typeof o!=='object'||found)return;if(Array.isArray(o))return o.forEach(walk);if(o.team?.id===String(id)||o.team?.id===id){found=o;return}Object.values(o).forEach(walk)}; walk(data);
  if(!found)return null;
  const stats={}; (found.stats||[]).forEach(s=>stats[String(s.name||'').toLowerCase()]=s.displayValue??s.value);
  return {rank:found.seed??found.rank??found.team?.rank,wins:stats.wins??stats.w,losses:stats.losses??stats.l,ties:stats.ties??stats.t,otl:stats.otlosses??stats.otlosses,points:stats.points,gb:stats.gamesBehind??stats.gb,streak:stats.streak};
}
function normalizeLeaders(data){
  const groups=[]; const add=(name,obj)=>{if(!obj)return;let leaders=obj.leaders||obj; if(Array.isArray(leaders)&&leaders.length){const first=leaders[0]; const athlete=first.athlete||first.player||first; const val=first.displayValue??first.value??first.stat?.displayValue??first.stat?.value; groups.push({name,value:val,athlete:athlete.displayName||athlete.fullName||athlete.shortName||''});}};
  if(Array.isArray(data.leaders)) data.leaders.forEach(g=>add(g.displayName||g.name||g.shortDisplayName,g));
  else if(data.leaders&&typeof data.leaders==='object') Object.entries(data.leaders).forEach(([k,v])=>add(k,v));
  else if(Array.isArray(data.categories)) data.categories.forEach(g=>add(g.displayName||g.name,g));
  return groups.filter(x=>x.value!==undefined).slice(0,5);
}
function prettyCategory(s){return String(s||'').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
async function loadTeam(conf,teamSpec,catalog,standings){
  const t=findTeam(catalog,teamSpec.abbr); if(!t)throw new Error(`Could not find ${teamSpec.name}`);
  const id=t.id;
  const [detail,leaders]=await Promise.allSettled([get(`/site/v2/sports/${conf.sport}/${conf.key}/teams/${id}`),get(`/site/v2/sports/${conf.sport}/${conf.key}/teams/${id}/leaders`)]);
  const d=detail.status==='fulfilled'?detail.value:{};
  const s=extractStandings(standings,id); const rec=s||extractRecord(d);
  const logo=t.logos?.[0]?.href||d.team?.logos?.[0]?.href||`https://a.espncdn.com/i/teamlogos/${conf.key==='usa.1'?'soccer':'sports'}/500/${teamSpec.abbr.toLowerCase()}.png`;
  const leaderGroups=leaders.status==='fulfilled'?normalizeLeaders(leaders.value):[];
  const record=[rec.wins,rec.losses].filter(v=>v!==undefined).join('-')||rec.display||'—';
  return {id,name:t.displayName||teamSpec.name,abbr:t.abbreviation,logo,record,rank:rec.rank,points:rec.points,gb:rec.gb,streak:rec.streak,leaders:leaderGroups};
}
function renderLeague(conf,teams){return `<section class="league"><div class="league-head"><div class="league-title"><span class="mark">${conf.icon}</span><h2>${conf.league}</h2></div><div class="league-note">Current season</div></div><div class="teams">${teams.map(t=>`<article class="team ${teams.length===1?'single':''}"><div class="team-top"><img class="logo" src="${esc(t.logo)}" alt="" onerror="this.style.visibility='hidden'"><div class="team-name"><h3>${esc(t.name)}</h3><p>${esc(t.abbr)}</p></div></div><div class="record"><span class="big">${esc(t.record)}</span><span class="label">record</span></div><div class="mini-grid">${t.rank!==undefined?`<div class="mini"><b>#${esc(t.rank)}</b><span>Standings</span></div>`:''}${t.points!==undefined?`<div class="mini"><b>${esc(t.points)}</b><span>Points</span></div>`:''}${t.gb!==undefined?`<div class="mini"><b>${esc(t.gb)}</b><span>GB</span></div>`:''}${t.streak!==undefined?`<div class="mini"><b>${esc(t.streak)}</b><span>Streak</span></div>`:''}</div><div class="leaders-title">Team stat leaders</div><div class="leaders">${t.leaders.length?t.leaders.map(l=>`<div class="leader"><span class="cat">${esc(prettyCategory(l.name))}</span><span class="value">${esc(l.athlete)} · ${esc(num(l.value))}</span></div>`).join(''):`<div class="leader"><span class="cat">Stats</span><span class="value">Unavailable</span></div>`}</div></article>`).join('')}</div></section>`}
async function load(){
  refresh.disabled=true; statusEl.textContent='Refreshing current standings and team leaders…'; dashboard.innerHTML=TEAMS.map(()=>'<div class="league skeleton"></div>').join('');
  try{
    const results=[];
    for(const conf of TEAMS){
      const [catalog,standings]=await Promise.all([teamCatalog(conf),get(`/v2/sports/${conf.sport}/${conf.key}/standings`)]);
      const teamData=await Promise.all(conf.teams.map(t=>loadTeam(conf,t,catalog,standings)));
      results.push(renderLeague(conf,teamData));
    }
    dashboard.innerHTML=results.join(''); const now=new Date(); updatedEl.textContent=`Updated ${now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`; statusEl.textContent='Live dashboard · tap Refresh for the latest data';
  }catch(e){dashboard.innerHTML=`<div class="error"><b>Unable to load the sports feed.</b><br>${esc(e.message)}<br><br>Try Refresh again. If the problem persists, the public data endpoint may be temporarily unavailable.</div>`;statusEl.textContent='Data feed unavailable';}
  finally{refresh.disabled=false}
}
refresh.addEventListener('click',load); load(); setInterval(load,10*60*1000);
