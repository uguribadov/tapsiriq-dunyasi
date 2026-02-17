const SETTINGS_KEY = "td_site_settings_v1";

function getSettings(){
  try{
    const raw = localStorage.getItem(SETTINGS_KEY);
    if(!raw) return { title: "Tapşırıq Dünyası", maintenance: { mode:"off", msg:"" } };
    const s = JSON.parse(raw);
    return {
      title: s.title || "Tapşırıq Dünyası",
      maintenance: {
        mode: (s.maintenance && s.maintenance.mode) || "off",
        msg: (s.maintenance && s.maintenance.msg) || ""
      }
    };
  }catch{
    return { title: "Tapşırıq Dünyası", maintenance: { mode:"off", msg:"" } };
  }
}

function applySettings(){
  const s = getSettings();
  const brand = document.getElementById("brandText");
  if(brand) brand.textContent = s.title;

  // Maintenance banner/block
  const mode = s.maintenance.mode;
  const msg = s.maintenance.msg || "Sayt yenilənir.";

  if(mode === "banner" || mode === "block"){
    const banner = document.createElement("div");
    banner.className = "notice";
    banner.style.margin = "14px auto";
    banner.style.width = "min(1120px, 92vw)";
    banner.innerHTML = `<b>Maintenance:</b> ${escapeHtml(msg)}`;
    document.body.insertBefore(banner, document.body.children[1] || null);

    if(mode === "block"){
      // list paneli gizlət
      const panel = document.querySelector(".panel");
      if(panel) panel.innerHTML = `<div class="notice"><b>Bağlıdır:</b><br>${escapeHtml(msg)}</div>`;
    }
  }
}






const listEl = document.getElementById("list");
const qEl = document.getElementById("q");
const catEl = document.getElementById("cat");
const statsEl = document.getElementById("stats");
const hintEl = document.getElementById("hint");

const LS_KEY = "td_admin_tasks_v1";

let tasks = [];

function normalize(s){ return String(s || "").toLowerCase().trim(); }
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function loadAdminTasks(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

function mergeTasks(baseArr, adminArr){
  const map = new Map();
  baseArr.forEach(t => map.set(String(t.id), t));
  adminArr.forEach(t => map.set(String(t.id), t));
  return Array.from(map.values());
}

function buildCategoryOptions(arr){
  const cats = Array.from(new Set(arr.map(t => t.category).filter(Boolean)))
    .sort((a,b)=>a.localeCompare(b));
  catEl.innerHTML =
    `<option value="">Kateqoriya: Hamısı</option>` +
    cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

function matches(t, q, cat){
  const hay = normalize(`${t.title} ${t.description} ${t.category}`);
  const okQ = !q || hay.includes(q);
  const okC = !cat || t.category === cat;
  return okQ && okC;
}

function render(){
  const q = normalize(qEl.value);
  const cat = catEl.value;

  const filtered = tasks
    .filter(t => matches(t, q, cat))
    .sort((a,b)=> String(a.title).localeCompare(String(b.title)));

  statsEl.innerHTML = `
    <span class="chip"><b>${tasks.length}</b> ümumi</span>
    <span class="chip"><b>${filtered.length}</b> göstərilir</span>
  `;

  listEl.innerHTML = filtered.map((t, idx) => {
    const links = Array.isArray(t.links) ? t.links : [];
    const topLinks = links.slice(0, 2).map(l => `
      <a class="linkBtn" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">
        ${escapeHtml(l.label || "Link")}
      </a>
    `).join("");

    return `
      <article class="card fadeIn" style="animation-delay:${Math.min(idx*25, 250)}ms">
        <div class="cardInner">
          <div class="cardTop">
            <span class="badge">${escapeHtml(t.category || "Ümumi")}</span>
            <span class="badge">ID: ${escapeHtml(t.id)}</span>
          </div>

          <h3 class="cardTitle">${escapeHtml(t.title)}</h3>
          <p class="cardDesc">${escapeHtml(t.description || "")}</p>

          <div class="cardBottom">
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${topLinks || `<span class="small">Link yoxdur</span>`}
            </div>

            <!-- BU HİSSƏ “DAXİL OL” DUYMƏSİDİR -->
            <a class="btn" href="task.html?id=${encodeURIComponent(t.id)}">Daxil ol</a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  hintEl.classList.toggle("hidden", filtered.length !== 0);
}

async function init(){
  
  applySettings();
  
  const res = await fetch("data/tasks.json", { cache:"no-store" });
  const base = await res.json();
  const admin = loadAdminTasks();
  tasks = mergeTasks(base, admin);

  buildCategoryOptions(tasks);
  render();
}

[qEl, catEl].forEach(el => el.addEventListener("input", render));

init().catch(err => {
  listEl.innerHTML = `<div class="notice">Xəta: ${escapeHtml(err.message)}</div>`;
});
