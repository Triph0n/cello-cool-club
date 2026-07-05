const buttons = Array.from(document.querySelectorAll("[data-action='play']"));
const audios = Array.from(document.querySelectorAll("audio"));

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
};

const setButtonState = (audio, playing) => {
  const button = document.querySelector(`[data-target="${audio.id}"]`);
  if (!button) return;
  button.classList.toggle("is-playing", playing);
  button.setAttribute("aria-label", button.getAttribute(playing ? "data-pause-label" : "data-play-label") || button.getAttribute("aria-label"));
};

buttons.forEach((button) => {
  button.setAttribute("data-play-label", button.getAttribute("aria-label"));
  const language = button.closest("[data-player]")?.querySelector(".track-copy span")?.textContent || "The Clock";
  button.setAttribute("data-pause-label", `Pause ${language}`);

  button.addEventListener("click", async () => {
    const audio = document.getElementById(button.dataset.target);
    if (!audio) return;

    audios.forEach((other) => {
      if (other !== audio) {
        other.pause();
        setButtonState(other, false);
      }
    });

    if (audio.paused) {
      button.disabled = true;
      try {
        await audio.play();
        setButtonState(audio, true);
      } catch {
        setButtonState(audio, false);
      } finally {
        button.disabled = false;
      }
    } else {
      audio.pause();
      setButtonState(audio, false);
    }
  });
});

audios.forEach((audio) => {
  const time = document.querySelector(`[data-time-for="${audio.id}"]`);
  const progress = document.querySelector(`[data-progress-for="${audio.id}"]`);

  audio.addEventListener("timeupdate", () => {
    if (time) time.textContent = formatTime(audio.currentTime);
    if (progress && audio.duration) {
      progress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
  });

  audio.addEventListener("ended", () => {
    setButtonState(audio, false);
    if (progress) progress.style.width = "0%";
    if (time) time.textContent = "0:00";
    audio.currentTime = 0;
  });

  audio.addEventListener("pause", () => setButtonState(audio, false));
  audio.addEventListener("play", () => setButtonState(audio, true));
});

const imageDialog = document.querySelector("[data-image-dialog]");
const openImage = document.querySelector("[data-open-image]");
const closeImage = document.querySelector("[data-close-image]");

openImage?.addEventListener("click", () => {
  if (imageDialog?.showModal) {
    imageDialog.showModal();
  }
});

closeImage?.addEventListener("click", () => imageDialog?.close());

imageDialog?.addEventListener("click", (event) => {
  if (event.target === imageDialog) {
    imageDialog.close();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && imageDialog?.open) {
    imageDialog.close();
  }
});

const postButton = document.querySelector("[data-post-card]");
const postStatus = document.querySelector("[data-post-status]");

const setPostStatus = (message, state = "") => {
  if (!postStatus) return;
  postStatus.textContent = message;
  postStatus.dataset.state = state;
};

const postEndpoints = () => {
  const localEndpoint = `${window.location.origin}/api/post-card`;
  const fallbackEndpoint = "http://127.0.0.1:5173/api/post-card";
  return localEndpoint === fallbackEndpoint ? [localEndpoint] : [localEndpoint, fallbackEndpoint];
};

postButton?.addEventListener("click", async () => {
  const slug = postButton.dataset.postCard;
  if (!slug) return;

  postButton.disabled = true;
  setPostStatus("Posting locally...", "working");

  let lastError = "Local post server is not reachable.";
  for (const endpoint of postEndpoints()) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Post failed.");
      }

      postButton.textContent = "Posted";
      setPostStatus("Added to local cards.", "success");
      window.setTimeout(() => {
        window.location.href = result.archiveUrl || "../../cards/";
      }, 500);
      return;
    } catch (error) {
      lastError = error.message;
    }
  }

  postButton.disabled = false;
  setPostStatus(lastError, "error");
});
