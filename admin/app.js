const state = {
  sources: [],
  cards: [],
  selectedPoem: null,
  selectedCard: null
};

const els = {
  sources: document.querySelector("#sources"),
  cards: document.querySelector("#cards"),
  workspace: document.querySelector("#workspace"),
  status: document.querySelector("#status"),
  refresh: document.querySelector("#refresh")
};

els.refresh.addEventListener("click", loadAll);

loadAll();

async function loadAll() {
  setStatus("Loading");
  const [sourcesData, cardsData, statusData] = await Promise.all([
    api("/api/sources"),
    api("/api/cards"),
    api("/api/status")
  ]);
  state.sources = sourcesData.sources;
  state.cards = cardsData.cards;
  renderSources();
  renderCards();
  setStatus(statusData.ok ? "Ready" : "Needs attention");
}

function renderSources() {
  els.sources.innerHTML = "";
  state.sources.forEach((source) => {
    const heading = document.createElement("div");
    heading.className = "source-heading";
    heading.textContent = `${source.name} (${source.poems.length})`;
    els.sources.appendChild(heading);

    source.poems.forEach((poem) => {
      const node = document.querySelector("#poem-template").content.cloneNode(true);
      const button = node.querySelector("button");
      button.classList.toggle("is-active", state.selectedPoem?.sourceFile === poem.sourceFile && state.selectedPoem?.number === poem.number);
      button.innerHTML = `
        <span class="item-title">${poem.number}. ${escapeHtml(poem.titles.en || poem.titles.fr)}</span>
        <span class="item-meta">${escapeHtml(poem.titles.fr || source.name)} / ${escapeHtml(poem.titles.cs || "English-only")}</span>
      `;
      button.addEventListener("click", () => {
        state.selectedPoem = poem;
        state.selectedCard = null;
        renderSources();
        renderCards();
        renderPoemWorkspace(poem);
      });
      els.sources.appendChild(node);
    });
  });
}

function renderCards() {
  els.cards.innerHTML = "";
  state.cards.forEach((card) => {
    const node = document.querySelector("#card-template").content.cloneNode(true);
    const button = node.querySelector("button");
    button.classList.toggle("is-active", state.selectedCard?.id === card.id);
    button.innerHTML = `
      <span class="item-title">${card.id} - ${escapeHtml(card.title)}</span>
      <span class="item-meta">${escapeHtml(card.season || "")}</span>
      <span class="status-pill ${escapeHtml(card.status)}">${escapeHtml(card.status)}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedCard = card;
      state.selectedPoem = null;
      renderSources();
      renderCards();
      renderCardWorkspace(card);
    });
    els.cards.appendChild(node);
  });
}

function renderPoemWorkspace(poem) {
  els.workspace.classList.remove("empty");
  els.workspace.innerHTML = `
    <h3>${poem.number}. ${escapeHtml(poem.titles.en || poem.titles.fr)}</h3>
    <div class="form-grid">
      <label>Main language
        <select id="language">
          <option value="en">English</option>
          <option value="cs">Czech</option>
          <option value="fr">French</option>
        </select>
      </label>
      <div class="poem-text">${escapeHtml((poem.texts.en || []).join("\n"))}</div>
      <div class="actions">
        <button id="create-card" type="button">Create Draft Card</button>
      </div>
      <div id="message" class="message"></div>
    </div>
  `;
  const language = document.querySelector("#language");
  const poemText = document.querySelector(".poem-text");
  language.addEventListener("change", () => {
    poemText.textContent = (poem.texts[language.value] || []).join("\n");
  });
  document.querySelector("#create-card").addEventListener("click", async () => {
    await runAction(async () => {
      const result = await api("/api/cards/from-source", {
        method: "POST",
        body: {
          sourceFile: poem.sourceFile,
          sourceNumber: poem.number,
          language: language.value
        }
      });
      await loadAll();
      const card = state.cards.find((candidate) => candidate.id === result.card.id);
      state.selectedCard = card;
      renderCards();
      renderCardWorkspace(card);
      return result.created ? "Draft card created." : "Card already existed; opened existing card.";
    });
  });
}

function renderCardWorkspace(card) {
  els.workspace.classList.remove("empty");
  els.workspace.innerHTML = `
    <h3>${card.id} - ${escapeHtml(card.title)}</h3>
    <span class="status-pill ${escapeHtml(card.status)}">${escapeHtml(card.status)}</span>
    <div class="poem-text">${escapeHtml((card.poemText || []).join("\n"))}</div>
    <div class="form-grid">
      <label>Image file path
        <input id="image-path" value="" placeholder="C:\\Users\\Vladimir\\Downloads\\image.png">
      </label>
      <label>Audio file path
        <input id="audio-path" value="" placeholder="C:\\Users\\Vladimir\\Downloads\\audio.mp3">
      </label>
      <label>Image prompt
        <textarea readonly>${escapeHtml(card.imagePrompt || "")}</textarea>
      </label>
      <label>Suno prompt
        <textarea readonly>${escapeHtml(card.sunoPrompt || "")}</textarea>
      </label>
      <div class="actions">
        <button id="attach-image" type="button">Attach Image</button>
        <button id="attach-audio" type="button">Attach Audio</button>
        <button id="preview-card" class="secondary" type="button">Generate Preview</button>
        <button id="approve-card" class="danger" type="button">Approve</button>
      </div>
      <div id="message" class="message"></div>
      ${card.image ? `<p class="item-meta">Image: ${escapeHtml(card.image)}</p>` : ""}
      ${card.audio ? `<p class="item-meta">Audio: ${escapeHtml(card.audio)}</p>` : ""}
    </div>
  `;

  document.querySelector("#attach-image").addEventListener("click", () => runCardAction(card.id, "attach-image", { path: document.querySelector("#image-path").value }));
  document.querySelector("#attach-audio").addEventListener("click", () => runCardAction(card.id, "attach-audio", { path: document.querySelector("#audio-path").value }));
  document.querySelector("#preview-card").addEventListener("click", async () => {
    await runAction(async () => {
      const result = await api(`/api/cards/${card.id}/preview`, { method: "POST", body: {} });
      window.open(result.url, "_blank", "noopener");
      return `Preview generated: ${result.url}`;
    });
  });
  document.querySelector("#approve-card").addEventListener("click", () => runCardAction(card.id, "approve", {}));
}

async function runCardAction(cardId, action, body) {
  await runAction(async () => {
    const result = await api(`/api/cards/${cardId}/${action}`, { method: "POST", body });
    await loadAll();
    const card = result.card || result;
    state.selectedCard = state.cards.find((candidate) => candidate.id === card.id) || card;
    renderCards();
    renderCardWorkspace(state.selectedCard);
    return "Done.";
  });
}

async function runAction(fn) {
  const message = document.querySelector("#message");
  message.classList.remove("error");
  message.textContent = "Working...";
  try {
    message.textContent = await fn();
  } catch (error) {
    message.classList.add("error");
    message.textContent = error.message;
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload;
}

function setStatus(text) {
  els.status.textContent = text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
