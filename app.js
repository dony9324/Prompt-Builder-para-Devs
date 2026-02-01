/* ========= STATE ========= */
const state = {
  blocks: {},
  selected: new Set(),
  prompt: "",
  relations: {},
  history: [],
  templates: [], 
  currentType: "Rol / Perfil",
  searchQuery: "",
  editingBlockId: null
};

/* ========= TAXONOMY ========= */
const TAXONOMY = [
  "Rol / Perfil",
  "Objetivo / Tarea",
  "Alcance funcional",
  "Plataforma / Stack",
  "Lenguaje",
  "Componentes",
  "UI / Layout",
  "Arquitectura",
  "Estilo visual",
  "Restricciones",
  "Output",
  "Complejidad",
  "Contexto"
];

/* ========= INIT ========= */
init();

function init() {
  loadState();
  seedDefaults();
  renderTaxonomy();
  renderBlocks();
  renderPredictions();
  renderTemplates()
  document.getElementById("main-prompt").value = state.prompt || "";
}

/* ========= DEFAULT BLOCKS ========= */
function seedDefaults() {
  if (Object.keys(state.blocks).length) return;
}

/* ========= BLOCK MGMT ========= */
function addBlock(type, title, content) {
  if (!state.blocks[type]) state.blocks[type] = [];
  state.blocks[type].push({
    id: crypto.randomUUID(),
    type,
    title,
    content,
    favorite: false // ⭐ NUEVO
  });
  saveState();
}
function toggleFavorite(id) {
  const block = findBlock(id);
  if (!block) return;

  block.favorite = !block.favorite;
  saveState();
  renderBlocks();
}

function toggleBlock(id) {
  const block = findBlock(id);
  if (!block) return;

  if (state.selected.has(id)) {
    state.selected.delete(id);
  } else {
    state.selected.add(id);
    insertAtCursor(block.content);
  }

  updateRelations();
  renderBlocks();
  renderPredictions();
}
const promptTextarea = document.getElementById("main-prompt");

promptTextarea.addEventListener("input", () => {
  state.prompt = promptTextarea.value;
  saveState();
});


/* ========= PROMPT ========= */
function rebuildPrompt() {
  let text = "";
  state.selected.forEach(id => {
    const block = findBlock(id);
    if (block) text += block.content + "\n\n";
  });
  state.prompt = text.trim();
  document.getElementById("main-prompt").value = state.prompt;
  document.getElementById("selected-count").innerText =
    `${state.selected.size} bloques`;
}

/* ========= RELATIONS ========= */
function updateRelations() {
  const ids = [...state.selected];
  ids.forEach(a => {
    if (!state.relations[a]) state.relations[a] = {};
    ids.forEach(b => {
      if (a !== b) {
        state.relations[a][b] = (state.relations[a][b] || 0) + 1;
      }
    });
  });
  saveState();
}

/* ========= PREDICTIONS ========= */
function renderPredictions() {
  const container = document.getElementById("predictions");
  container.innerHTML = "";

  const scores = {};
  state.selected.forEach(id => {
    const rel = state.relations[id] || {};
    Object.entries(rel).forEach(([rid, score]) => {
      if (!state.selected.has(rid)) {
        scores[rid] = (scores[rid] || 0) + score;
      }
    });
  });

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (!sorted.length) {
    container.innerHTML = `<p class="tip">Usa bloques para generar predicciones.</p>`;
    return;
  }

  sorted.forEach(([id]) => {
    const block = findBlock(id);
    if (!block) return;
    const div = document.createElement("div");
    div.className = "prediction-item";
    div.innerText = block.title;
    div.onclick = () => toggleBlock(id);
    container.appendChild(div);
  });
}

/* ========= RENDER ========= */
function renderTaxonomy() {
  const nav = document.getElementById("taxonomy-nav");
  nav.innerHTML = "";
  TAXONOMY.forEach(type => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (type === state.currentType ? " active" : "");
    btn.innerText = type;
    btn.onclick = () => {
      state.currentType = type;
      renderBlocks();
      renderTaxonomy();
    };
    nav.appendChild(btn);
  });
}

function renderBlocks() {
  const grid = document.getElementById("blocks-grid");
  grid.innerHTML = "";

  const blocks = state.blocks[state.currentType] || [];
  blocks.sort((a, b) => (b.favorite === true) - (a.favorite === true));
  const filtered = blocks.filter(b =>
    b.title.toLowerCase().includes(state.searchQuery) ||
    b.content.toLowerCase().includes(state.searchQuery)
  );

  filtered.forEach(b => {
    const div = document.createElement("div");
    div.className = "block-card" + (state.selected.has(b.id) ? " selected" : "");
    div.onclick = () => toggleBlock(b.id);
    div.oncontextmenu = (e) => {
  e.preventDefault();
  editBlock(b.id);
};
div.oncontextmenu = (e) => {
  e.preventDefault();

  if (e.shiftKey) {
    deleteBlock(b.id);
  } else {
    editBlock(b.id);
  }
};

   div.innerHTML = `
  <div class="block-header">
    <strong>${b.title}</strong>
    <span
      class="fav ${b.favorite ? "active" : ""}"
      title="Marcar como favorito"
    >★</span>
  </div>
  <p>${b.content}</p>
`;

    div.onclick = () => toggleBlock(b.id);
    div.querySelector(".fav").onclick = (e) => {
    e.stopPropagation();
    toggleFavorite(b.id);
    };
    grid.appendChild(div);
  });
}

/* ========= HELPERS ========= */
function findBlock(id) {
  return Object.values(state.blocks).flat().find(b => b.id === id);
}

/* ========= STORAGE ========= */
function saveState() {
  const serializable = {
    ...state,
    selected: [...state.selected] // 🔑 convertir Set → Array
  };
  localStorage.setItem("prompt-builder", JSON.stringify(serializable));
}

function loadState() {
  const saved = localStorage.getItem("prompt-builder");
  if (!saved) return;

  const parsed = JSON.parse(saved);

  state.blocks = parsed.blocks || {};
  state.prompt = parsed.prompt || "";
  state.relations = parsed.relations || {};
  state.currentType = parsed.currentType || "Rol / Perfil";
  state.searchQuery = "";

  // 🔒 PROTECCIÓN TOTAL
  if (Array.isArray(parsed.selected)) {
    state.selected = new Set(parsed.selected);
  } else {
    state.selected = new Set();
  }

  state.templates = Array.isArray(parsed.templates)
    ? parsed.templates
    : [];
}

function ensureGitHubToken() {
  let token = localStorage.getItem("gh-token");

  if (!token) {
    token = prompt(
      "Introduce tu GitHub Personal Access Token (scope: gist).\n" +
      "Se guardará solo en este navegador."
    );

    if (!token) {
      alert("Token requerido para continuar");
      return null;
    }

    localStorage.setItem("gh-token", token.trim());
  }

  return token;
}


/* ========= MOCK AI ========= */
document.getElementById("ai-clean-btn").onclick = () => {
  document.getElementById("main-prompt").value =
    state.prompt.replace(/\n{2,}/g, "\n\n").trim();
};

document.getElementById("deconstruct-btn").onclick = () => {
  document.getElementById("code-output").value =
    "Descripción:\nEntidad principal\n\nResponsabilidades:\n- Manejo de estado\n- Validaciones";
};

document.getElementById("block-search").addEventListener("input", (e) => {
  state.searchQuery = e.target.value.toLowerCase();
  renderBlocks();
});

document.getElementById("save-combination").onclick = () => {
  if (!state.selected.size) return;

  const name = prompt("Nombre de la plantilla:");
  if (!name) return;

  state.templates.push({
    id: crypto.randomUUID(),
    name,
    blockIds: [...state.selected],
    createdAt: Date.now()
  });

  saveState();
  renderTemplates();
};

function renderTemplates() {
  const container = document.getElementById("templates-list");
  container.innerHTML = "";

  if (!state.templates || !state.templates.length) {
    container.innerHTML = `<p class="tip">Aún no hay plantillas guardadas.</p>`;
    return;
  }

  state.templates.forEach(t => {
    const div = document.createElement("div");
    div.className = "template-item";
    div.innerText = t.name;
    div.onclick = () => applyTemplate(t);
    container.appendChild(div);
  });
}

function applyTemplate(template) {
  state.selected = new Set(template.blockIds);
  rebuildPrompt();
  renderBlocks();
  renderPredictions();
  saveState();
}
/* Exportar*/
document.getElementById("export-json").onclick = () => {
  const data = {
    ...state,
    selected: [...state.selected]
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "prompt-builder-export.json";
  a.click();
};
/*Importar */
document.getElementById("import-json").onclick = () => {
  document.getElementById("import-file").click();
};

document.getElementById("import-file").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);

      // 🔒 Validaciones mínimas
      state.blocks = parsed.blocks || {};
      state.relations = parsed.relations || {};
      state.templates = parsed.templates || [];
      state.selected = new Set(parsed.selected || []);
      state.prompt = "";

      saveState();
      renderTaxonomy();
      renderBlocks();
      renderPredictions();
      renderTemplates();
      rebuildPrompt();
    } catch {
      alert("JSON inválido");
    }
  };
  reader.readAsText(file);
};
/* limpiar todo */
document.getElementById("clear-all").onclick = () => {
  state.selected.clear();
  rebuildPrompt();
  renderBlocks();
  renderPredictions();
};
/*Reset total*/
document.getElementById("reset-app").onclick = () => {
  if (!confirm("Esto borrará todo. ¿Seguro?")) return;
  localStorage.removeItem("prompt-builder");
  location.reload();
};

/* GIST */

document.getElementById("gist-save").onclick = saveToGist;
document.getElementById("gist-load").onclick = loadFromGist;

const GIST_API = "https://api.github.com/gists";

function getAuthHeaders() {
  const token = ensureGitHubToken();
  if (!token) throw new Error("No GitHub token");
  return {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json"
  };
}
async function saveToGist() {
  const gistId = localStorage.getItem("gist-id");

  const payload = {
    description: "Prompt Builder Backup",
    public: false,
    files: {
      "prompt-builder.json": {
        content: JSON.stringify(exportState(), null, 2)
      }
    }
  };

  const url = gistId ? `${GIST_API}/${gistId}` : GIST_API;
  const method = gistId ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!gistId) {
    localStorage.setItem("gist-id", data.id);
  }

  alert("Backup guardado en Gist ✅");
}
/*Restaurar desde Gist */
async function loadFromGist() {
  const gistId = localStorage.getItem("gist-id");
  if (!gistId) return alert("No hay Gist configurado");

  const res = await fetch(`${GIST_API}/${gistId}`, {
    headers: getAuthHeaders()
  });

  const data = await res.json();
  const content = data.files["prompt-builder.json"].content;
  const parsed = JSON.parse(content);

  importState(parsed);
  alert("Configuración restaurada ✅");
}
/*Funciones */
function exportState() {
  return {
    version: 1,
    blocks: state.blocks,
    relations: state.relations,
    templates: state.templates,
    selected: [...state.selected],
    metadata: {
      updatedAt: Date.now()
    }
  };
}

function importState(parsed) {
  state.blocks = parsed.blocks || {};
  state.relations = parsed.relations || {};
  state.templates = parsed.templates || [];
  state.selected = new Set(parsed.selected || []);
  saveState();
  renderAll();
}
/* Guardar nuevos bloques */
document.getElementById("add-block-btn").onclick = () => {
  const type = document.getElementById("new-block-group").value;
  const title = document.getElementById("new-block-title").value.trim();
  const content = document.getElementById("new-block-content").value.trim();

  if (!title || !content) {
    alert("Título y contenido son obligatorios");
    return;
  }
if (state.editingBlockId) {
    updateBlock(state.editingBlockId, type, title, content);
  }else {
    addBlock(type, title, content);
  }
resetBlockForm();
 
};

function updateBlock(id, newType, newTitle, newContent) {
  const block = findBlock(id);
  if (!block) return;

  // si cambia de categoría → mover de array
  if (block.type !== newType) {
    state.blocks[block.type] =
      state.blocks[block.type].filter(b => b.id !== id);

    if (!state.blocks[newType]) state.blocks[newType] = [];
    block.type = newType;
    state.blocks[newType].push(block);
  }

  block.title = newTitle;
  block.content = newContent;

  saveState();
  rebuildPrompt();
  renderBlocks();
  renderPredictions();
}
function resetBlockForm() {
  document.getElementById("new-block-title").value = "";
  document.getElementById("new-block-content").value = "";
  state.editingBlockId = null;

  document.getElementById("add-block-btn").innerText = "Guardar Bloque";
}

function editBlock(id) {
  const block = findBlock(id);
  if (!block) return;

  // cargar datos en el formulario
  document.getElementById("new-block-group").value = block.type;
  document.getElementById("new-block-title").value = block.title;
  document.getElementById("new-block-content").value = block.content;

  state.editingBlockId = id;

  // feedback visual
  document.getElementById("add-block-btn").innerText = "Actualizar Bloque ✏️";
}
function insertAtCursor(text) {
  const textarea = document.getElementById("main-prompt");

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);

  const insertion = text.endsWith("\n") ? text : text + "\n\n";

  textarea.value = before + insertion + after;

  // mover cursor al final del texto insertado
  const newCursorPos = before.length + insertion.length;
  textarea.selectionStart = textarea.selectionEnd = newCursorPos;

  state.prompt = textarea.value;
  saveState(); // 🔒 persistencia atómica
}

function deleteBlock(id) {
  const block = findBlock(id);
  if (!block) return;

  if (!confirm(`Eliminar el bloque "${block.title}"?`)) return;

  // eliminar de su categoría
  state.blocks[block.type] =
    state.blocks[block.type].filter(b => b.id !== id);

  // limpiar selección
  state.selected.delete(id);

  // limpiar relaciones
  delete state.relations[id];
  Object.values(state.relations).forEach(rel => delete rel[id]);

  saveState();
  rebuildPrompt();
  renderBlocks();
  renderPredictions();
}
const helpModal = document.getElementById("help-modal");

document.getElementById("open-help").onclick = () => {
  helpModal.classList.remove("hidden");
};

document.getElementById("close-help").onclick = closeHelpModal;

helpModal.querySelector(".modal-overlay").onclick = closeHelpModal;

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeHelpModal();
});

function closeHelpModal() {
  helpModal.classList.add("hidden");
}
