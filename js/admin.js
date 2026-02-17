const LS_KEY = "td_admin_tasks_v1";
const AUTH_KEY = "td_admin_authed_v1";
const loginBtn = document.getElementById("loginBtn");

// PAROLU BURDA DƏYİŞ (sadə variant)
// Qeyd: bu parol koddadır, ona görə “tam təhlükəsiz” deyil.
const PASS_KEY = "td_admin_password_v1";

// default parol
if (!localStorage.getItem(PASS_KEY)) {
  localStorage.setItem(PASS_KEY, "12345");
}

loginBtn.addEventListener("click", () => {
  const pass = adminPassEl.value.trim();
  const currentPass = localStorage.getItem(PASS_KEY);

  if(pass === currentPass){
    setAuthed(true);
    showAdminUI();
    renderAdminList();
  } else {
    showLoginMsg("Parol yanlışdır.", true);
  }
});


// Login elements
const loginHero = document.getElementById("loginHero");
const loginPanel = document.getElementById("loginPanel");
const adminHero = document.getElementById("adminHero");
const adminPanel = document.getElementById("adminPanel");

const adminPassEl = document.getElementById("adminPass");
const loginMsgEl = document.getElementById("loginMsg");

// Admin elements
const idEl = document.getElementById("id");
const titleEl = document.getElementById("title");
const categoryEl = document.getElementById("category");
const descEl = document.getElementById("desc");
const contentEl = document.getElementById("content");
const linksEl = document.getElementById("links");

const addBtn = document.getElementById("add");
const exportBtn = document.getElementById("export");
const logoutBtn = document.getElementById("logout");

const msgEl = document.getElementById("msg");
const adminListEl = document.getElementById("adminList");

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function showLoginMsg(text, isError=false){
  loginMsgEl.classList.remove("hidden");
  loginMsgEl.style.borderColor = isError ? "rgba(255,77,109,.35)" : "rgba(124,92,255,.35)";
  loginMsgEl.innerHTML = escapeHtml(text);
  setTimeout(()=> loginMsgEl.classList.add("hidden"), 2200);
}

function showMsg(text, isError=false){
  msgEl.classList.remove("hidden");
  msgEl.style.borderColor = isError ? "rgba(255,77,109,.35)" : "rgba(124,92,255,.35)";
  msgEl.innerHTML = escapeHtml(text);
  setTimeout(()=> msgEl.classList.add("hidden"), 2200);
}

function isAuthed(){
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function setAuthed(val){
  if(val) sessionStorage.setItem(AUTH_KEY, "1");
  else sessionStorage.removeItem(AUTH_KEY);
}

function showAdminUI(){
  loginHero.classList.add("hidden");
  loginPanel.classList.add("hidden");
  adminHero.classList.remove("hidden");
  adminPanel.classList.remove("hidden");
}

function showLoginUI(){
  loginHero.classList.remove("hidden");
  loginPanel.classList.remove("hidden");
  adminHero.classList.add("hidden");
  adminPanel.classList.add("hidden");
}

function load(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

function save(arr){
  localStorage.setItem(LS_KEY, JSON.stringify(arr, null, 2));
}

function isValidId(id){
  return /^[a-zA-Z0-9-_]+$/.test(id);
}

function parseLinks(raw){
  const txt = String(raw || "").trim();
  if(!txt) return [];
  return txt.split(",").map(part => {
    const [label, url] = part.split("|").map(x => (x || "").trim());
    if(!label || !url) return null;
    return { label, url };
  }).filter(Boolean);
}

function renderAdminList(){
  const arr = load();
  if(arr.length === 0){
    adminListEl.innerHTML = `<div class="notice">Hələ heç nə əlavə olunmayıb.</div>`;
    return;
  }

  adminListEl.innerHTML = arr.map((t, idx) => {
    const links = Array.isArray(t.links) ? t.links : [];
    const topLinks = links.slice(0,2).map(l => `
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
            <div style="display:flex; gap:8px; align-items:center;">
              <a class="linkBtn" href="task.html?id=${encodeURIComponent(t.id)}">Yoxla →</a>
              <button class="btnGhost btnDanger" data-del="${escapeHtml(t.id)}">Sil</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");

  adminListEl.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const next = load().filter(x => String(x.id) !== String(id));
      save(next);
      showMsg("Silindi.");
      renderAdminList();
    });
  });
}

loginBtn.addEventListener("click", () => {
  const pass = adminPassEl.value.trim();
  if(pass === "ADMIN_PASSWORD"){
    setAuthed(true);
    adminPassEl.value = "";
    showAdminUI();
    renderAdminList();
    showLoginMsg("Daxil oldun.");
  } else {
    showLoginMsg("Parol yanlışdır.", true);
  }
});

adminPassEl.addEventListener("keydown", (e) => {
  if(e.key === "Enter") loginBtn.click();
});

logoutBtn.addEventListener("click", () => {
  setAuthed(false);
  showLoginUI();
});

addBtn.addEventListener("click", async () => {
  const id = idEl.value.trim();
  const title = titleEl.value.trim();
  const category = categoryEl.value.trim();
  const description = descEl.value.trim();
  const content = contentEl.value.trim();
  const links = parseLinks(linksEl.value);

  if(!id || !title){
    showMsg("ID və Başlıq mütləqdir.", true);
    return;
  }
  if(!isValidId(id)){
    showMsg("ID yalnız hərf/rəqəm, - və _ ola bilər. (məs: js-010)", true);
    return;
  }

  const adminArr = load();

  // base tasks.json-dakı id ilə toqquşma yoxlaması
  let base = [];
  try{
    const res = await fetch("data/tasks.json", { cache:"no-store" });
    base = await res.json();
  }catch{ base = []; }

  const allIds = new Set([...base, ...adminArr].map(t => String(t.id)));
  if(allIds.has(String(id))){
    showMsg("Bu ID artıq var. Başqa ID seç.", true);
    return;
  }

  adminArr.push({ id, title, category, description, content, links });
  save(adminArr);

  idEl.value = "";
  titleEl.value = "";
  categoryEl.value = "";
  descEl.value = "";
  contentEl.value = "";
  linksEl.value = "";

  showMsg("Əlavə olundu.");
  renderAdminList();
});

exportBtn.addEventListener("click", async () => {
  let base = [];
  try{
    const res = await fetch("data/tasks.json", { cache:"no-store" });
    base = await res.json();
  }catch{ base = []; }

  const adminArr = load();

  const map = new Map();
  base.forEach(t => map.set(String(t.id), t));
  adminArr.forEach(t => map.set(String(t.id), t));
  const merged = Array.from(map.values());

  const blob = new Blob([JSON.stringify(merged, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  showMsg("Export edildi. `data/tasks.json` ilə əvəz et, push et.");
});

// Init UI
if(isAuthed()){
  showAdminUI();
  renderAdminList();
} else {
  showLoginUI();
}
