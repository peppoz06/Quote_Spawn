/**
 * Quote Spawn Massimo Troisi
 * Plays one of 13 local scenes inside the vintage TV on the backdrop.
 */

/**
 * Resolve a file from /public for Vite (dev/build) and for raw GitHub Pages.
 * - Vite copies public/ to the site root → BASE_URL + file
 * - Raw Pages serves the repo as-is → /Quote_Spawn/public/file
 */
function mediaUrl(fileName) {
  const encoded = fileName.replace(/ /g, "%20");
  const viteBase = import.meta.env && import.meta.env.BASE_URL;
  if (viteBase) {
    return `${viteBase}${encoded}`;
  }
  // Native ES module on GitHub Pages (no Vite transform)
  const pageBase = window.location.pathname.replace(/index\.html$/, "");
  const root = pageBase.endsWith("/") ? pageBase : `${pageBase}/`;
  return `${root}public/${encoded}`;
}

const VIDEO_FILES = [
  "scena01.mp4",
  "scena02.mp4",
  "scena03.mp4",
  "scena04.mp4",
  "scena05.mp4",
  "scena06.mp4",
  "scena07.mp4",
  "scena08.mp4",
  "scena09.mp4",
  "scena10.mp4",
  "scena11.mp4",
  "scena12.mp4",
  "scena13.mp4",
].map((file) => mediaUrl(file));

const backdrop = document.getElementById("backdrop");
const tvScreen = document.getElementById("tvScreen");
const video = document.getElementById("tvVideo");
const powerFx = document.getElementById("tvPower");
const spawnBtn = document.getElementById("spawnBtn");
const statusEl = document.getElementById("status");

backdrop.src = mediaUrl("sfondo sito.png");

/** @type {string[]} */
let deck = [];
/** @type {string | null} */
let lastPlayed = null;
/** @type {AbortController | null} */
let playAbort = null;
let isSwitching = false;

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function refillDeck() {
  let next = shuffle(VIDEO_FILES);
  // Avoid playing the same clip twice in a row across deck boundaries.
  if (lastPlayed && next.length > 1 && next[0] === lastPlayed) {
    const swapWith = 1 + Math.floor(Math.random() * (next.length - 1));
    [next[0], next[swapWith]] = [next[swapWith], next[0]];
  }
  deck = next;
}

function nextScene() {
  if (deck.length === 0) {
    refillDeck();
  }
  const chosen = deck.shift();
  lastPlayed = chosen;
  return chosen;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function flashPowerOn() {
  powerFx.classList.remove("is-flashing");
  // Force reflow so the animation can restart.
  void powerFx.offsetWidth;
  powerFx.classList.add("is-flashing");
}

function hideScreen() {
  tvScreen.classList.remove("is-on");
  tvScreen.setAttribute("aria-hidden", "true");
  video.removeAttribute("src");
  video.load();
}

function stopCurrentPlayback() {
  if (playAbort) {
    playAbort.abort();
    playAbort = null;
  }
  video.pause();
  video.removeAttribute("src");
  video.load();
}

/**
 * @param {string} src
 * @param {AbortSignal} signal
 */
function waitForCanPlay(src, signal) {
  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Impossibile caricare ${src}`));
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };
    const cleanup = () => {
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
      signal.removeEventListener("abort", onAbort);
    };

    signal.addEventListener("abort", onAbort, { once: true });
    video.addEventListener("canplay", onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.src = src;
    video.load();
  });
}

async function playScene(src) {
  const controller = new AbortController();
  playAbort = controller;

  flashPowerOn();
  tvScreen.classList.add("is-on");
  tvScreen.setAttribute("aria-hidden", "false");

  try {
    await waitForCanPlay(src, controller.signal);
    if (controller.signal.aborted) return;

    video.currentTime = 0;
    video.loop = false;
    video.muted = false;

    const playPromise = video.play();
    if (playPromise) {
      await playPromise;
    }

    setStatus("Riproduzione in corso");
  } catch (err) {
    if (err?.name === "AbortError") return;
    console.error(err);
    setStatus("Errore nel caricamento della scena. Riprova.");
    hideScreen();
  }
}

async function onSpawn() {
  if (isSwitching) return;
  isSwitching = true;
  spawnBtn.disabled = true;

  try {
    stopCurrentPlayback();
    const src = nextScene();
    const label = src.split("/").pop() || src;
    setStatus(`Carico ${label}`);
    await playScene(src);
  } finally {
    isSwitching = false;
    spawnBtn.disabled = false;
    spawnBtn.focus({ preventScroll: true });
  }
}

function onEnded() {
  setStatus("Fine scena. Premi di nuovo Mostra!");
  hideScreen();
}

function onVideoError() {
  if (!video.getAttribute("src")) return;
  setStatus("Errore di riproduzione. Premi di nuovo Mostra!");
  hideScreen();
}

spawnBtn.addEventListener("click", onSpawn);
video.addEventListener("ended", onEnded);
video.addEventListener("error", onVideoError);

// Ensure nothing autoplays on load.
hideScreen();
refillDeck();
setStatus("Pronto. Premi Mostra!");
