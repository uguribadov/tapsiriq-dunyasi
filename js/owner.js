// Owner auth keys
const OWNER_AUTH_KEY = "td_owner_authed_v1";
const OWNER_PASS_KEY = "td_owner_password_v1";

// Admin auth + password keys (admin.html istifadə edir)
const ADMIN_AUTH_KEY = "td_admin_authed_v1";
const ADMIN_PASS_KEY = "td_admin_password_v1";

// Admin tasks localStorage
const ADMIN_TASKS_KEY = "td_admin_tasks_v1";

// Site settings (maintenance)
const SETTINGS_KEY = "td_site_settings_v1";

// Audit
const AUDIT_KEY = "td_audit_v1";

// Default owner password
if (!localStorage.getItem(OWNER_PASS_KEY)) {
  localStorage.setItem(OWNER_PASS_KEY, "owner123");
}

// Default admin password (əgər səndə admin.js-də də bunu edirsə, problem yoxdur)
if (!localStorage.getItem(ADMIN_PASS_KEY)) {
  localStorage.setItem(ADMIN_PASS_KEY, "12345");
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function auditLog(action, details=""){
  const entry = { time: new Date().toISOString(), action, details };
  let logs = [];
  try { logs = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { logs = []; }
  logs.unshift(entry);
  logs = logs.slice(0, 40);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(logs, null, 2));
}

function renderAudit(){
  const el = document.getElementById("audit");
  let logs = [];
  try { logs = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { logs = []; }

  if (!logs.length) {
    el.innerHTML = `<div class="small">Log yoxdur.</div>`;
    return;
  }

  el.innerHTML = logs.map(l => `
    <div class="chip" style="margin:6px 0; display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
      <span><b>${escapeHtml(l.action)}</b> — ${escapeHtml(l.details || "")}</span>
      <span class="small">${escapeHtml(l.time)}</span>
    </div>
  `).join("");
}

function getSettings(){
  try{
    const raw = localStorage.getItem(SETTINGS_KEY);
    if(!raw) return { maintenance: { mode:"off", msg:"" } };
    const s = JSON.parse(raw);
    return {
      maintenance: {
        mode: (s.maintenance && s.maintenance.mode) || "off",
        msg: (s.maintenance && s.maintenance.msg) || ""
      }
    };
  }catch{
    return { maintenance: { mode:"off", msg:"" } };
  }
}

function saveSettings(s){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s, null, 2));
}

function loadAdminTasks(){
  try{
    const raw = localStorage.getItem(ADMIN_TASKS_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

function saveAdminTasks(arr){
  localStorage.setItem(ADMIN_TASKS_KEY, JSON.stringify(arr, null, 2));
}

function showOwnerUI(){
  document.getElementById("ownerLoginHero").classList.add("hidden");
  document.getElementById("ownerLoginPanel").classList.add("hidden");
  document.getElementById("ownerHero").classList.remove("hidden");
  document.getElementById("ownerPanel").classList.remove("hidden");
}

function showLoginUI(){
  document.getElementById("ownerLoginHero").classList.remove("hidden");
  document.getElementById("ownerLoginPanel").classList.remove("hidden");
  document.getElementById("ownerHero").classList.add("hidden");
  document.getElementById("ownerPanel").classList.add("hidden");
}

function showLoginMsg(text, isError=false){
  const el = document.getElementById("ownerLoginMsg");
  el.classList.remove("hidden");
  el.style.borderColor = isError ? "rgba(255,77,109,.35)" : "rgba(124,92,255,.35)";
  el.innerHTML = escapeHtml(text);
  setTimeout(()=> el.classList.add("hidden"), 2200);
}

function renderStatus(){
  const maint = getSettings().maintenance;
  const adminTasksCount = loadAdminTasks().length;

  document.getElementById("status").innerHTML = `
    Owner session: <b>${sessionStorage.getItem(OWNER_AUTH_KEY) === "1" ? "Aktiv" : "Yox"}</b><br>
    Admin session: <b>${sessionStorage.getItem(ADMIN_AUTH_KEY) === "1" ? "Aktiv" : "Yox"}</b><br>
    Maintenance: <b>${escapeHtml(maint.mode)}</b> ${maint.msg ? `— ${escapeHtml(maint.msg)}` : ""}<br>
    Admin localStorage tapşırıqları: <b>${adminTasksCount}</b>
  `;
}

function renderAdminTasks(){
  const arr = loadAdminTasks();
  const el = document.getElementById("adminTasks");

  if(!arr.length){
    el.innerHTML = `<div class="notice">Admin localStorage-da tapşırıq yoxdur.</div>`;
    return;
  }

  el.innerHTML = arr.map((t, idx) => `
    <article class="card fadeIn" style="animation-delay:${Math.min(idx*25, 250)}ms">
      <div class="cardInner">
        <div class="cardTop">
          <span class="badge">${escapeHtml(t.category || "Ümumi")}</span>
          <span class="badge">ID: ${escapeHtml(t.id)}</span>
        </div>
        <h3 class="cardTitle">${escapeHtml(t.title || "")}</h3>
        <p class="cardDesc">${escapeHtml(t.description || "")}</p>
        <div class="cardBottom">
          <a class="linkBtn" href="task.html?id=${encodeURIComponent(t.id)}">Yoxla →</a>
          <button class="btnGhost btnDanger" data-del="${escapeHtml(t.id)}">Sil</button>
        </div>
      </div>
    </article>
  `).join("");

  el.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const next = loadAdminTasks().filter(x => String(x.id) !== String(id));
      saveAdminTasks(next);
      auditLog("ADMIN_TASK_DELETE", `id=${id}`);
      renderAdminTasks();
      renderStatus();
      renderAudit();
    });
  });
}

// Owner login handlers
document.getElementById("ownerLoginBtn").addEventListener("click", () => {
  const pass = document.getElementById("ownerPass").value.trim();
  const real = localStorage.getItem(OWNER_PASS_KEY);

  if(pass === real){
    sessionStorage.setItem(OWNER_AUTH_KEY, "1");
    document.getElementById("ownerPass").value = "";
    auditLog("OWNER_LOGIN", "ok");
    showOwnerUI();
    initOwnerPanel();
  } else {
    showLoginMsg("Owner şifrəsi yanlışdır.", true);
  }
});

document.getElementById("ownerPass").addEventListener("keydown", (e) => {
  if(e.key === "Enter") document.getElementById("ownerLoginBtn").click();
});

document.getElementById("ownerLogout").addEventListener("click", () => {
  sessionStorage.removeItem(OWNER_AUTH_KEY);
  auditLog("OWNER_LOGOUT", "ok");
  showLoginUI();
});

// Change admin password
document.getElementById("changeAdminPass").addEventListener("click", () => {
  const oldP = document.getElementById("oldAdminPass").value.trim();
  const newP = document.getElementById("newAdminPass").value.trim();
  const current = localStorage.getItem(ADMIN_PASS_KEY);

  if(oldP !== current){
    alert("Köhnə admin şifrə səhvdir.");
    return;
  }
  if(newP.length < 4){
    alert("Yeni admin şifrə ən az 4 simvol olmalıdır.");
    return;
  }

  localStorage.setItem(ADMIN_PASS_KEY, newP);
  document.getElementById("oldAdminPass").value = "";
  document.getElementById("newAdminPass").value = "";
  auditLog("ADMIN_PASSWORD_CHANGE", "ok");
  renderAudit();
  alert("Admin şifrəsi dəyişdi.");
});

// Change owner password
document.getElementById("changeOwnerPass").addEventListener("click", () => {
  const oldP = document.getElementById("oldOwnerPass").value.trim();
  const newP = document.getElementById("newOwnerPass2").value.trim();
  const current = localStorage.getItem(OWNER_PASS_KEY);

  if(oldP !== current){
    alert("Köhnə owner şifrə səhvdir.");
    return;
  }
  if(newP.length < 4){
    alert("Yeni owner şifrə ən az 4 simvol olmalıdır.");
    return;
  }

  localStorage.setItem(OWNER_PASS_KEY, newP);
  document.getElementById("oldOwnerPass").value = "";
  document.getElementById("newOwnerPass2").value = "";
  auditLog("OWNER_PASSWORD_CHANGE", "ok");
  renderAudit();
  alert("Owner şifrəsi dəyişdi.");
});

// Maintenance
document.getElementById("saveMaint").addEventListener("click", () => {
  const mode = document.getElementById("maintMode").value;
  const msg = document.getElementById("maintMsg").value.trim();

  const s = getSettings();
  s.maintenance = { mode, msg };
  saveSettings(s);

  auditLog("MAINTENANCE_SET", `${mode}${msg ? " | " + msg : ""}`);
  renderStatus();
  renderAudit();
  alert("Maintenance yadda saxlandı.");
});

// Import tasks -> admin localStorage
document.getElementById("importBtn").addEventListener("click", async () => {
  const input = document.getElementById("importFile");
  const file = input.files && input.files[0];
  if(!file){
    alert("JSON fayl seç.");
    return;
  }

  try{
    const text = await file.text();
    const data = JSON.parse(text);
    if(!Array.isArray(data)){
      alert("JSON array olmalıdır.");
      return;
    }

    const cleaned = data
      .filter(t => t && t.id != null && t.title != null)
      .map(t => ({
        id: String(t.id),
        title: String(t.title || ""),
        category: String(t.category || ""),
        description: String(t.description || ""),
        content: String(t.content || ""),
        links: Array.isArray(t.links) ? t.links.map(l => ({
          label: String((l && l.label) || "Link"),
          url: String((l && l.url) || "")
        })).filter(l => l.url) : []
      }));

    saveAdminTasks(cleaned);
    auditLog("IMPORT_ADMIN_TASKS", `count=${cleaned.length}`);
    renderAdminTasks();
    renderStatus();
    renderAudit();
    alert("Import edildi (admin localStorage).");
  }catch(e){
    alert("Import xətası: " + e.message);
  }
});

// Backup export -> admin localStorage
document.getElementById("backupBtn").addEventListener("click", () => {
  const arr = loadAdminTasks();
  const blob = new Blob([JSON.stringify(arr, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "admin_tasks_backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  auditLog("BACKUP_EXPORT", `count=${arr.length}`);
  renderAudit();
});

function initOwnerPanel(){
  const maint = getSettings().maintenance;
  document.getElementById("maintMode").value = maint.mode || "off";
  document.getElementById("maintMsg").value = maint.msg || "";

  renderStatus();
  renderAdminTasks();
  renderAudit();
}

// Auto start
if (sessionStorage.getItem(OWNER_AUTH_KEY) === "1") {
  showOwnerUI();
  initOwnerPanel();
} else {
  showLoginUI();
}
