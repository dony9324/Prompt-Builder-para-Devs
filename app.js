/* ========= CONSTANTES ========= */
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

const CONFIRMATION_TEXTS = {
  reset1: "SI",
  reset2: "YES"
};
const GIST_API = "https://api.github.com/gists";

/* ========= STATE ========= */
const state = {
  blocks: {},
  selected: new Set(),
  prompt: "",
  relations: {},
  templates: [],
  currentType: TAXONOMY[0],
  searchQuery: "",
  editingBlockId: null,
  isFileMode: location.protocol === "file:"
};

/* ========= INIT ========= */
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupEventListeners();
});

function init() {
  loadState();
  seedDefaults();
  renderAll();

  // Restaurar prompt del estado
  if (state.prompt) {
    document.getElementById("main-prompt").value = state.prompt;
    updateSelectedCount();
  }

  if (state.isFileMode) {
    showFileModeWarning();
  }
}
function updateSelectedCount() {
  document.getElementById("selected-count").innerText = 
    `${state.selected.size} bloque${state.selected.size !== 1 ? 's' : ''}`;
}
function renderAll() {
  // Evitar múltiples llamadas al DOM
  requestAnimationFrame(() => {
    renderTaxonomy();
    renderBlocks();
    renderPredictions();
    renderTemplates();
    
    // Solo actualizar textarea si es diferente
    const promptTextarea = document.getElementById("main-prompt");
    if (promptTextarea.value !== state.prompt) {
      promptTextarea.value = state.prompt || "";
    }
  });
}

/* ========= DEFAULT BLOCKS ========= */
function seedDefaults() {
  if (Object.keys(state.blocks).length > 0) return;
  
  // Bloques por defecto para empezar
  /*
  addBlock("Rol / Perfil", "Senior Architect", 
    "Actúa como un arquitecto frontend senior con 10+ años de experiencia en sistemas escalables.");
  addBlock("Output", "Código bien documentado", 
    "Proporciona código limpio, bien documentado con comentarios explicativos.");*/
}

/* ========= GESTIÓN DE BLOQUES ========= */
function addBlock(type, title, content) {
  if (!state.blocks[type]) state.blocks[type] = [];
  state.blocks[type].push({
    id: crypto.randomUUID(),
    type,
    title,
    content,
    favorite: false
  });
  saveState();
  renderTaxonomy();
  renderBlocks();
}

function updateBlock(id, newType, newTitle, newContent) {
  const block = findBlock(id);
  if (!block) return;

  // Mover a nueva categoría si es necesario
  if (block.type !== newType) {
    state.blocks[block.type] = state.blocks[block.type].filter(b => b.id !== id);
    if (!state.blocks[newType]) state.blocks[newType] = [];
    block.type = newType;
    state.blocks[newType].push(block);
  }

  block.title = newTitle;
  block.content = newContent;

  saveState();
  renderAll();
}

function deleteBlock(id) {
  const block = findBlock(id);
  if (!block) return;

  if (!confirm(`¿Eliminar el bloque "${block.title}"?`)) return;

  // Eliminar de categoría
  state.blocks[block.type] = state.blocks[block.type].filter(b => b.id !== id);
  
  // Limpiar selección
  state.selected.delete(id);
  
  // Limpiar relaciones
  delete state.relations[id];
  Object.values(state.relations).forEach(rel => delete rel[id]);

  saveState();
  rebuildPrompt();
  renderAll();
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

function toggleFavorite(id) {
  const block = findBlock(id);
  if (!block) return;
  block.favorite = !block.favorite;
  saveState();
  renderBlocks();
}

/* ========= EDITOR Y PROMPT ========= */
function rebuildPrompt() {
  let text = "";
  state.selected.forEach(id => {
    const block = findBlock(id);
    if (block) text += block.content + "\n\n";
  });
  state.prompt = text.trim();
  document.getElementById("main-prompt").value = state.prompt;
  document.getElementById("selected-count").innerText = `${state.selected.size} bloques`;
}

function insertAtCursor(text) {
  const textarea = document.getElementById("main-prompt");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);

  const insertion = text.endsWith("\n") ? text : text + "\n\n";
  textarea.value = before + insertion + after;

  const newCursorPos = before.length + insertion.length;
  textarea.selectionStart = textarea.selectionEnd = newCursorPos;

  state.prompt = textarea.value;
  saveState();
  renderTaxonomy();
}

/* ========= RELACIONES Y PREDICCIONES ========= */
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

/* ========= RENDERIZADO UI ========= */
function renderTaxonomy() {
  const nav = document.getElementById("taxonomy-nav");
  nav.innerHTML = "";

  TAXONOMY.forEach(type => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (type === state.currentType ? " active" : "");
    btn.innerHTML = `
      ${type}
      <span class="count-badge">${getBlocksCountByType(type)}</span>
    `;
    btn.onclick = () => {
      state.currentType = type;
      renderBlocks();
      updateActiveTab();
    };
    nav.appendChild(btn);
  });

  document.getElementById("total-blocks-count").innerText = getTotalBlocksCount();
}

function updateActiveTab() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.includes(state.currentType)) {
      btn.classList.add('active');
    }
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
    div.className = "block-card";
    
    // Añadir clase "selected" si el bloque está en el Set
    if (state.selected.has(b.id)) {
      div.classList.add("selected");
    }
    
    div.innerHTML = `
      <div class="block-header">
        <strong>${b.title}</strong>
        <span class="fav ${b.favorite ? "active" : ""}" title="Marcar como favorito">★</span>
      </div>
      <p>${b.content}</p>
    `;

    // Click izquierdo: seleccionar/deseleccionar
    div.onclick = (e) => {
      if (e.button === 0) { // Solo click izquierdo
        toggleBlock(b.id);
      }
    };
    
    // Click en favorito
    div.querySelector(".fav").onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(b.id);
    };
    
    // Click derecho: editar/eliminar
    div.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.shiftKey) {
        deleteBlock(b.id);
      } else {
        editBlock(b.id);
      }
    };

    grid.appendChild(div);
  });
}

function renderTemplates() {
  const container = document.getElementById("templates-list");
  container.innerHTML = "";

  if (!state.templates.length) {
    container.innerHTML = `<p class="tip">Aún no hay plantillas guardadas.</p>`;
    return;
  }

  state.templates.forEach(t => {
    const div = document.createElement("div");
    div.className = "template-item";
    div.innerHTML = `
      <strong>${t.name}</strong>
      <small>${new Date(t.createdAt).toLocaleDateString()}</small>
    `;
    div.onclick = () => applyTemplate(t);
    container.appendChild(div);
  });
}

/* ========= PLANTILLAS ========= */
function saveTemplate() {
  if (!state.selected.size) {
    alert("Selecciona al menos un bloque para guardar como plantilla");
    return;
  }

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
  alert(`Plantilla "${name}" guardada ✅`);
}

function applyTemplate(template) {
  state.selected = new Set(template.blockIds);
  rebuildPrompt();
  renderAll();
}

/* ========= GESTIÓN GITHUB GIST ========= */
function getGitHubToken() {
  return localStorage.getItem("github_token");
}
function requestGitHubToken() {
  const token = prompt(
    "Introduce tu GitHub Personal Access Token (scope: gist):\n" +
    "Se guardará solo en este navegador.\n\n" +
    "Puedes crear uno en: https://github.com/settings/tokens/new\n" +
    "(selecciona solo el scope 'gist')"
  );
  
  if (!token) return null;
  
  const trimmedToken = token.trim();
  localStorage.setItem("github_token", trimmedToken);
  return trimmedToken;
}

function getAuthHeaders() {
  const token = getGitHubToken();
  if (!token) throw new Error("No GitHub token available");
  
  return {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json"
  };
}

async function saveToGist() {
  try {
    let token = getGitHubToken();
    if (!token) {
      token = requestGitHubToken();
      if (!token) return;
    }

    const gistId = localStorage.getItem("gist_id");
    const payload = {
      description: `Prompt Builder Backup - ${new Date().toLocaleString()}`,
      public: false,
      files: {
        "prompt-builder.json": {
          content: JSON.stringify(exportState(), null, 2)
        }
      }
    };

    const url = gistId ? `${GIST_API}/${gistId}` : GIST_API;
    const method = gistId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Token inválido, pedir nuevo
        localStorage.removeItem("github_token");
        alert("Token inválido o expirado. Por favor, ingrésalo nuevamente.");
        return saveToGist(); // Recursión para pedir nuevo token
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!gistId) {
      localStorage.setItem("gist_id", data.id);
    }
    localStorage.setItem("gist_url", data.html_url);

    alert(`✅ Backup guardado en Gist\n${data.html_url}`);
  } catch (error) {
    alert(`❌ Error al guardar en Gist: ${error.message}`);
  }
}

async function loadFromGist() {
  try {
    let token = getGitHubToken();
    if (!token) {
      token = requestGitHubToken();
      if (!token) return;
    }

    let gistId = localStorage.getItem("gist_id");
    
    // Si no hay gist_id guardado, pedirlo
    if (!gistId) {
      const input = prompt(
        "Introduce el ID del Gist a restaurar:\n" +
        "(Lo encuentras en la URL: gist.github.com/tu-usuario/ID)\n\n" +
        "Deja vacío para listar tus gists recientes."
      );
      
      if (input === null) return; // Usuario canceló
      
      if (input.trim() === "") {
        // Listar gists del usuario
        await listUserGists(token);
        return;
      }
      
      gistId = input.trim();
    }

    const response = await fetch(`${GIST_API}/${gistId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        alert("Gist no encontrado. Verifica el ID.");
        localStorage.removeItem("gist_id");
        return loadFromGist(); // Intentar de nuevo
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const file = data.files["prompt-builder.json"];
    
    if (!file) {
      throw new Error("El Gist no contiene datos de Prompt Builder");
    }

    const parsed = JSON.parse(file.content);
    importState(parsed);
    
    // Guardar el ID del gist para futuras restauraciones
    localStorage.setItem("gist_id", gistId);
    localStorage.setItem("gist_url", data.html_url);

    alert("✅ Configuración restaurada desde Gist");
  } catch (error) {
    alert(`❌ Error al cargar desde Gist: ${error.message}`);
  }
}
// Nueva función para listar gists del usuario
async function listUserGists(token) {
  try {
    const response = await fetch(`${GIST_API}?per_page=10`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json"
      }
    });

    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

    const gists = await response.json();
    
    if (gists.length === 0) {
      alert("No tienes Gists guardados.");
      return;
    }

    let message = "Tus Gists recientes:\n\n";
    gists.forEach((gist, index) => {
      const desc = gist.description || "Sin descripción";
      const date = new Date(gist.created_at).toLocaleDateString();
      message += `${index + 1}. ${desc} (${date})\n`;
      message += `   ID: ${gist.id}\n`;
      message += `   URL: ${gist.html_url}\n\n`;
    });
    
    message += "Copia el ID del Gist que quieras restaurar.";
    alert(message);
    
    const gistId = prompt("Pega el ID del Gist que quieres restaurar:");
    if (gistId) {
      localStorage.setItem("gist_id", gistId.trim());
      await loadFromGist(); // Cargar el gist específico
    }
  } catch (error) {
    alert(`❌ Error al listar Gists: ${error.message}`);
  }
}

/* ========= EXPORT/IMPORT ========= */
function exportState() {
  return {
    version: 2,
    blocks: state.blocks,
    relations: state.relations,
    templates: state.templates,
    selected: [...state.selected],
    prompt: state.prompt,
    metadata: {
      exportedAt: Date.now(),
      totalBlocks: getTotalBlocksCount()
    }
  };
}
/* ========= RESET CONFIRMADO POR TEXTO ========= */
function resetApp() {
  const respuesta = prompt(
    "⚠️ RESET TOTAL DE LA APLICACIÓN ⚠️\n\n" +
    "Esto borrará TODOS los datos locales:\n" +
    "- Bloques personalizados\n" +
    "- Plantillas guardadas\n" +
    "- Historial de relaciones\n" +
    "- Configuraciones\n\n" +
    "Para confirmar, escribe 'SI' (en mayúsculas):"
  );

  if (respuesta === "SI") {
    const confirmacionFinal = prompt(
      "ÚLTIMA CONFIRMACIÓN:\n" +
      "Escribe 'YES' para borrar todo irreversiblemente:"
    );

    if (confirmacionFinal === "YES") {
      // Limpiar todo el localStorage
      localStorage.removeItem("prompt-builder");
      localStorage.removeItem("github_token");
      localStorage.removeItem("gist_id");
      localStorage.removeItem("gist_url");
      
      // Mostrar mensaje de éxito
      alert("✅ Aplicación reseteada. Recargando...");
      
      // Recargar después de un breve delay
      setTimeout(() => {
        location.reload();
      }, 1000);
    } else {
      alert("❌ Reset cancelado. Los datos están seguros.");
    }
  } else {
    alert("❌ Reset cancelado.");
  }
}

function importState(parsed) {
  // Normalizar datos antiguos
  state.blocks = parsed.blocks || {};
  state.relations = parsed.relations || {};
  state.templates = parsed.templates || [];
  state.selected = new Set(parsed.selected || []);
  state.prompt = parsed.prompt || "";
  
  // Migrar de versión 1 a 2 si es necesario
  if (parsed.version === 1) {
    // Conversión de datos antiguos
  }
  
  saveState();
  renderAll();
}

/* ========= HELPERS ========= */
function findBlock(id) {
  for (const type in state.blocks) {
    const block = state.blocks[type].find(b => b.id === id);
    if (block) return block;
  }
  return null;
}

function getTotalBlocksCount() {
  return Object.values(state.blocks).reduce((sum, arr) => sum + arr.length, 0);
}

function getBlocksCountByType(type) {
  return (state.blocks[type] || []).length;
}

function showFileModeWarning() {
  if (!state.isFileMode) return;
  
  const lastWarning = localStorage.getItem("file_warning_shown");
  const now = Date.now();
  
  // Mostrar solo una vez cada 24 horas
  if (!lastWarning || (now - parseInt(lastWarning)) > 24 * 60 * 60 * 1000) {
    console.warn("Ejecutando en file:// — localStorage depende de la ruta");
    
    // Crear toast no intrusivo
    const toast = document.createElement("div");
    toast.className = "toast warning";
    toast.innerHTML = `
      ⚠️ Modo archivo local detectado. 
      <small>Usa un servidor local o guarda backups frecuentes.</small>
      <button onclick="this.parentElement.remove()">✕</button>
    `;
    document.body.appendChild(toast);
    
    localStorage.setItem("file_warning_shown", now.toString());
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 8000);
  }
}

/* ========= PERSISTENCIA ========= */
function saveState() {
  const serializable = {
    ...state,
    selected: [...state.selected],
    version: 2
  };
  localStorage.setItem("prompt-builder", JSON.stringify(serializable));
}

function loadState() {
  const saved = localStorage.getItem("prompt-builder");
   if (!saved) {
    console.log("No hay estado guardado, iniciando con valores por defecto");
    return;
  }

   try {
    const parsed = JSON.parse(saved);
    
    // Restaurar todo el estado
    state.blocks = parsed.blocks || {};
    state.relations = parsed.relations || {};
    state.templates = parsed.templates || [];
    state.prompt = parsed.prompt || "";
    state.currentType = parsed.currentType || TAXONOMY[0];
    state.searchQuery = "";
    state.editingBlockId = null;
    
    // Restaurar selección (Set)
    if (Array.isArray(parsed.selected)) {
      state.selected = new Set(parsed.selected.filter(id => {
        // Verificar que el bloque aún existe
        return findBlock(id) !== null;
      }));
    } else {
      state.selected = new Set();
    }
    
    console.log(`Estado cargado: ${Object.keys(state.blocks).length} categorías, ${getTotalBlocksCount()} bloques, ${state.selected.size} seleccionados`);
    
  } catch (error) {
    console.error("Error cargando estado:", error);
    // En caso de error, empezar de cero pero mantener el localStorage por si acaso
  }
}

/* ========= FORMULARIO BLOQUES ========= */
function editBlock(id) {
  const block = findBlock(id);
  if (!block) return;

  document.getElementById("new-block-group").value = block.type;
  document.getElementById("new-block-title").value = block.title;
  document.getElementById("new-block-content").value = block.content;
  state.editingBlockId = id;
  document.getElementById("add-block-btn").innerText = "Actualizar Bloque ✏️";
}

function resetBlockForm() {
  document.getElementById("new-block-title").value = "";
  document.getElementById("new-block-content").value = "";
  state.editingBlockId = null;
  document.getElementById("add-block-btn").innerText = "Guardar Bloque";
}

/* ========= EVENT LISTENERS ========= */
function setupEventListeners() {
  // Búsqueda
  document.getElementById("block-search").addEventListener("input", (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderBlocks();
  });

  // Editor principal
  const promptTextarea = document.getElementById("main-prompt");
  promptTextarea.addEventListener("input", () => {
    state.prompt = promptTextarea.value;
    saveState();
  });

  // Botón guardar bloque
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
    } else {
      addBlock(type, title, content);
    }
    
    resetBlockForm();
  };

  // Botones de acción
  document.getElementById("save-combination").onclick = saveTemplate;
  document.getElementById("ai-clean-btn").onclick = () => {
    document.getElementById("main-prompt").value = 
      state.prompt.replace(/\n{3,}/g, "\n\n").trim();
  };
  
  document.getElementById("deconstruct-btn").onclick = () => {
    const codeInput = document.getElementById("code-input").value;
    if (!codeInput.trim()) {
      alert("Pega algún código primero");
      return;
    }
    document.getElementById("code-output").value = 
      "Descripción:\nEntidad principal\n\nResponsabilidades:\n- Manejo de estado\n- Validaciones\n- Lógica de negocio";
  };

  document.getElementById("insert-analysis-btn").onclick = () => {
    const analysis = document.getElementById("code-output").value;
    if (analysis) insertAtCursor(analysis);
  };

  // Export/Import
  document.getElementById("export-json").onclick = () => {
    const data = exportState();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `prompt-builder-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

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
        importState(parsed);
        alert("Configuración importada ✅");
      } catch {
        alert("JSON inválido o corrupto");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  // Gist
  document.getElementById("gist-save").onclick = saveToGist;
  document.getElementById("restore-from-gist").onclick = loadFromGist;

  // Limpiar y reset
  document.getElementById("clear-all").onclick = () => {
    state.selected.clear();
    rebuildPrompt();
    renderAll();
  };

// Reset App
  document.getElementById("reset-app").onclick = resetApp;

  // Modal de ayuda
  const helpModal = document.getElementById("help-modal");
  document.getElementById("open-help").onclick = () => {
    helpModal.classList.remove("hidden");
  };
  
  document.getElementById("close-help").onclick = () => {
    helpModal.classList.add("hidden");
  };
  
  helpModal.querySelector(".modal-overlay").onclick = () => {
    helpModal.classList.add("hidden");
  };
  
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") helpModal.classList.add("hidden");
  });

  // Copiar al portapapeles
document.getElementById("copy-btn").onclick = async () => {
  const textarea = document.getElementById("main-prompt");
  const text = textarea.value;
  
  if (!text.trim()) {
    alert("No hay contenido para copiar");
    return;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    
    const btn = document.getElementById("copy-btn");
    const originalText = btn.innerText;
    btn.innerText = "✓ Copiado!";
    btn.classList.add("copied");
    
    setTimeout(() => {
      btn.innerText = originalText;
      btn.classList.remove("copied");
    }, 2000);
  } catch (err) {
    // Fallback para navegadores antiguos
    textarea.select();
    document.execCommand("copy");
    alert("Texto copiado (método alternativo)");
  }
};
}

function validateGitHubToken(token) {
  // Validación básica del formato del token
  if (!token || token.trim().length < 20) {
    return "Token demasiado corto";
  }
  if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
    return "Formato de token inválido";
  }
  return null; // Token válido
}