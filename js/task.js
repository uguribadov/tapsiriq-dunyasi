const LS_KEY = "td_admin_tasks_v1";

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function getId(){
  const url = new URL(location.href);
  return url.searchParams.get("id");
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

async function init(){
  const id = getId();
  const titleEl = document.getElementById("title");
  const metaEl = document.getElementById("meta");
  const descEl = document.getElementById("desc");
  const contentEl = document.getElementById("content");
  const linksEl = document.getElementById("links");

  if(!id){
    titleEl.textContent = "ID tapılmadı";
    metaEl.textContent = "Linkdə id yoxdur.";
    return;
  }

  const res = await fetch("data/tasks.json", { cache:"no-store" });
  const base = await res.json();
  const admin = loadAdminTasks();
  const all = mergeTasks(base, admin);

  const task = all.find(t => String(t.id) === String(id));
  if(!task){
    titleEl.textContent = "Tapşırıq tapılmadı";
    metaEl.textContent = "Bu id mövcud deyil.";
    return;
  }

  document.title = `${task.title} — 25 İyul Qrup | Task Site`;

  titleEl.textContent = task.title;
  metaEl.textContent = `Kateqoriya: ${task.category || "Ümumi"} • ID: ${task.id}`;

  descEl.innerHTML = `<b>Qısa təsvir:</b><br>${escapeHtml(task.description || "")}`;
  contentEl.innerHTML = `<b>Detallar:</b><br>` + escapeHtml(task.content || "").replace(/\n/g, "<br>");

  const links = Array.isArray(task.links) ? task.links : [];
  if(links.length){
    linksEl.classList.remove("hidden");
    linksEl.innerHTML =
      `<b>Linklər:</b><br><br>` +
      links.map(l => `
        <a class="linkBtn" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">
          ${escapeHtml(l.label || "Link")}
        </a>
      `).join(" ");
  }
}

init().catch(err => {
  document.getElementById("title").textContent = "Xəta";
  document.getElementById("meta").textContent = err.message;
});
