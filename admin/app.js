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
  workspaceActions: document.querySelector("#workspace-actions"),
  status: document.querySelector("#status"),
  refresh: document.querySelector("#refresh"),
  batchSource: document.querySelector("#batch-source"),
  batchRange: document.querySelector("#batch-range"),
  batchLanguage: document.querySelector("#batch-language"),
  batchCreateSuno: document.querySelector("#batch-create-suno"),
  batchMessage: document.querySelector("#batch-message")
};

els.refresh.addEventListener("click", loadAll);
els.batchCreateSuno.addEventListener("click", createSunoBatch);

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
  renderBatchSources();
  renderSources();
  renderCards();
  setStatus(statusData.ok ? "Ready" : "Needs attention");
}

function renderBatchSources() {
  const current = els.batchSource.value;
  els.batchSource.innerHTML = state.sources.map((source) => (
    `<option value="${escapeHtml(source.name)}">${escapeHtml(source.name)} (${source.poems.length})</option>`
  )).join("");

  if (current && state.sources.some((source) => source.name === current)) {
    els.batchSource.value = current;
  }

  els.batchCreateSuno.disabled = state.sources.length === 0;
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
        els.batchSource.value = poem.sourceFile;
        els.batchRange.value = String(poem.number);
        renderSources();
        renderCards();
        renderPoemWorkspace(poem);
      });
      els.sources.appendChild(node);
    });
  });
}

async function createSunoBatch() {
  els.batchMessage.classList.remove("error");
  els.batchMessage.textContent = "Working...";

  try {
    const result = await api("/api/suno/batch-create", {
      method: "POST",
      body: {
        sourceFile: els.batchSource.value,
        range: els.batchRange.value,
        language: els.batchLanguage.value
      }
    });
    await navigator.clipboard.writeText(JSON.stringify(result.batch, null, 2));
    window.open(result.batch.targetUrl, "_blank", "noopener");
    await loadAll();

    const errorText = result.batch.errors.length > 0 ? `, ${result.batch.errors.length} skipped` : "";
    els.batchMessage.textContent = `Batch copied: ${result.batch.count} song packet(s)${errorText}.`;
  } catch (error) {
    els.batchMessage.classList.add("error");
    els.batchMessage.textContent = error.message;
  }
}

function renderCards() {
  els.cards.innerHTML = "";
  state.cards.forEach((card) => {
    const node = document.querySelector("#card-template").content.cloneNode(true);
    const item = node.querySelector(".card-item");
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

    if (card.status === "draft") {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "card-delete danger";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete draft ${card.id} - ${card.title}`);
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (confirm(`Delete draft ${card.id} - ${card.title}?`)) {
          runCardAction(card.id, "delete", {});
        }
      });
      item.appendChild(deleteButton);
    }

    els.cards.appendChild(node);
  });
}

function renderPoemWorkspace(poem) {
  els.workspaceActions.innerHTML = `<button id="create-card" type="button">Create Draft Card</button>`;
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
      <label>Poem text
        <div class="poem-text" id="source-poem-text">${escapeHtml((poem.texts.en || []).join("\n"))}</div>
        <button id="copy-source-poem" type="button" class="secondary prompt-button">Copy to clipboard</button>
      </label>
      <div id="message" class="message"></div>
    </div>
  `;
  const language = document.querySelector("#language");
  const poemText = document.querySelector("#source-poem-text");
  language.addEventListener("change", () => {
    poemText.textContent = (poem.texts[language.value] || []).join("\n");
  });
  document.querySelector("#copy-source-poem").addEventListener("click", () => {
    navigator.clipboard.writeText(document.querySelector("#source-poem-text").textContent);
    const msg = document.querySelector("#message");
    msg.classList.remove("error");
    msg.textContent = "Poem text copied to clipboard.";
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
  els.workspaceActions.innerHTML = `
    <button id="open-suno" type="button" class="secondary">Open Suno</button>
    <button id="send-suno" type="button" class="secondary">Copy Packet + Send to Suno</button>
    <button id="open-gemini" type="button" class="secondary">Open Gemini</button>
    <button id="open-chatgpt" type="button" class="secondary">Open ChatGPT</button>
    <button id="preview-card" class="secondary" type="button">Generate Preview</button>
    ${card.status === "draft" ? `<button id="delete-draft" class="danger" type="button">Delete Draft</button>` : ""}
    <button id="approve-card" class="danger" type="button">Approve</button>
  `;
  els.workspace.classList.remove("empty");
  els.workspace.innerHTML = `
    <h3>${card.id} - ${escapeHtml(card.title)}</h3>
    <span class="status-pill ${escapeHtml(card.status)}">${escapeHtml(card.status)}</span>
    <div class="form-grid">
      <label>Poem text
        <div class="poem-text" id="card-poem-text">${escapeHtml((card.poemText || []).join("\n"))}</div>
        <button id="copy-card-poem" type="button" class="secondary prompt-button">Copy to clipboard</button>
      </label>
      <div class="asset-row">
        <label>Image file path
          <div style="display:flex;gap:8px;">
            <input id="image-path" value="" placeholder="C:\\Users\\Vladimir\\Downloads\\image.png">
            <button id="browse-image" type="button" class="secondary" style="min-width:auto;">Browse</button>
          </div>
        </label>
        <button id="attach-image" type="button">Attach Image</button>
      </div>
      <div class="asset-row">
        <label>Audio file path
          <div style="display:flex;gap:8px;">
            <input id="audio-path" value="" placeholder="C:\\Users\\Vladimir\\Downloads\\audio.mp3">
            <button id="browse-audio" type="button" class="secondary" style="min-width:auto;">Browse</button>
          </div>
        </label>
        <button id="attach-audio" type="button">Attach Audio</button>
      </div>
      <section class="prompt-window" aria-label="Generated prompts">
        <div class="prompt-window-header">Prompts</div>
        <div class="prompt-grid">
          <label>Sound prompt
            <textarea id="sound-prompt" readonly>${escapeHtml(card.sunoPrompt || "")}</textarea>
            <button id="copy-sound-prompt" type="button" class="secondary prompt-button">Copy sound prompt</button>
          </label>
          <label>Image prompt
            <textarea id="image-prompt" readonly>${escapeHtml(card.imagePrompt || "")}</textarea>
            <button id="copy-image-prompt" type="button" class="secondary prompt-button">Copy image prompt</button>
          </label>
          <label>Wallpaper generator prompt
            <textarea id="wallpaper-prompt" readonly>${escapeHtml(buildWallpaperGeneratorPrompt(card.imagePrompt || ""))}</textarea>
            <button id="copy-wallpaper-prompt" type="button" class="secondary prompt-button">Copy wallpaper prompt</button>
          </label>
        </div>
      </section>
      <div id="message" class="message"></div>
      ${card.image ? `<p class="item-meta">Image: ${escapeHtml(card.image)}</p>` : ""}
      ${card.audio ? `<p class="item-meta">Audio: ${escapeHtml(card.audio)}</p>` : ""}
    </div>
  `;

  document.querySelector("#attach-image").addEventListener("click", () => runCardAction(card.id, "attach-image", { path: document.querySelector("#image-path").value }));
  document.querySelector("#attach-audio").addEventListener("click", () => runCardAction(card.id, "attach-audio", { path: document.querySelector("#audio-path").value }));

  const browseImage = document.querySelector("#browse-image");
  if (browseImage) {
    browseImage.addEventListener("click", async () => {
      try {
        const result = await api("/api/open-file-dialog", { method: "POST" });
        if (result.path) document.querySelector("#image-path").value = result.path;
      } catch (err) {
        console.error("Browse failed:", err);
      }
    });
  }
  const browseAudio = document.querySelector("#browse-audio");
  if (browseAudio) {
    browseAudio.addEventListener("click", async () => {
      try {
        const result = await api("/api/open-file-dialog", { method: "POST" });
        if (result.path) document.querySelector("#audio-path").value = result.path;
      } catch (err) {
        console.error("Browse failed:", err);
      }
    });
  }
  document.querySelector("#preview-card").addEventListener("click", async () => {
    await runAction(async () => {
      const result = await api(`/api/cards/${card.id}/preview`, { method: "POST", body: {} });
      window.open(result.url, "_blank", "noopener");
      return `Preview generated: ${result.url}`;
    });
  });
  document.querySelector("#approve-card").addEventListener("click", () => runCardAction(card.id, "approve", {}));

  const deleteDraftBtn = document.querySelector("#delete-draft");
  if (deleteDraftBtn) {
    deleteDraftBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete this draft?")) {
        runCardAction(card.id, "delete", {});
      }
    });
  }

  document.querySelector("#open-suno").addEventListener("click", () => {
    const text = card.sunoPrompt || (card.poemText || []).join("\n");
    navigator.clipboard.writeText(text);
    const msg = document.querySelector("#message");
    msg.classList.remove("error");
    msg.textContent = "Sound prompt copied to clipboard! Paste it in Suno.";
    window.open("https://suno.com/create", "_blank", "noopener");
  });

  document.querySelector("#send-suno").addEventListener("click", async () => {
    await runAction(async () => {
      const result = await api(`/api/cards/${card.id}/export-suno`, { method: "POST", body: {} });
      await navigator.clipboard.writeText(JSON.stringify(result.packet, null, 2));
      window.open(result.packet.targetUrl, "_blank", "noopener");
      return `Suno packet copied and opened: ${result.packet.files.json}`;
    });
  });

  document.querySelector("#open-gemini").addEventListener("click", () => {
    const prompt = card.imagePrompt || (card.poemText || []).join("\n");
    navigator.clipboard.writeText(prompt);
    const msg = document.querySelector("#message");
    msg.classList.remove("error");
    msg.textContent = "Image prompt copied! Paste it in the chat.";
    window.open("https://gemini.google.com/app", "_blank", "noopener");
  });

  document.querySelector("#open-chatgpt").addEventListener("click", () => {
    const text = (card.poemText || []).join("\n");
    navigator.clipboard.writeText(text);
    const msg = document.querySelector("#message");
    msg.classList.remove("error");
    msg.textContent = "Poem text copied! Paste it in ChatGPT.";
    window.open("https://chatgpt.com/", "_blank", "noopener");
  });

  document.querySelector("#copy-card-poem").addEventListener("click", () => {
    navigator.clipboard.writeText(document.querySelector("#card-poem-text").textContent);
    const msg = document.querySelector("#message");
    msg.classList.remove("error");
    msg.textContent = "Poem text copied to clipboard.";
  });

  document.querySelector("#copy-sound-prompt").addEventListener("click", () => {
    navigator.clipboard.writeText(document.querySelector("#sound-prompt").value);
    const msg = document.querySelector("#message");
    msg.classList.remove("error");
    msg.textContent = "Sound prompt copied to clipboard.";
  });

  document.querySelector("#copy-image-prompt").addEventListener("click", () => {
    navigator.clipboard.writeText(document.querySelector("#image-prompt").value);
    const msg = document.querySelector("#message");
    msg.classList.remove("error");
    msg.textContent = "Image prompt copied to clipboard.";
  });

  document.querySelector("#copy-wallpaper-prompt").addEventListener("click", () => {
    navigator.clipboard.writeText(document.querySelector("#wallpaper-prompt").value);
    const msg = document.querySelector("#message");
    msg.classList.remove("error");
    msg.textContent = "Wallpaper prompt copied to clipboard.";
  });
}

function buildWallpaperGeneratorPrompt(imagePrompt) {
  return [
    "Style: illustration",
    "Resolution: 4K",
    "Aspect ratio: 9:16",
    "Enhancer: on",
    "",
    "Prompt:",
    imagePrompt
  ].join("\n");
}

async function runCardAction(cardId, action, body) {
  await runAction(async () => {
    const result = await api(`/api/cards/${cardId}/${action}`, { method: "POST", body });
    if (result.deleted) {
      const deletedSelectedCard = state.selectedCard?.id === result.id;
      state.cards = state.cards.filter((card) => card.id !== result.id);
      if (deletedSelectedCard) {
        state.selectedCard = null;
      }
      renderCards();
      if (deletedSelectedCard || action === "delete") {
        els.workspace.classList.add("empty");
        els.workspace.innerHTML = "Select a poem or card.";
        els.workspaceActions.innerHTML = "";
      }
      await loadAll();
      return "Draft deleted.";
    }
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
  if (message) {
    message.classList.remove("error");
    message.textContent = "Working...";
  }
  try {
    const resultMessage = await fn();
    if (message && document.body.contains(message)) {
      message.textContent = resultMessage;
    } else {
      setStatus(resultMessage);
    }
  } catch (error) {
    if (message && document.body.contains(message)) {
      message.classList.add("error");
      message.textContent = error.message;
    } else {
      setStatus(error.message);
    }
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
