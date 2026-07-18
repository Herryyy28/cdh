/* ========================================
   PixelMind AI — script.js
   ======================================== */

// ─── Token Auth Helpers ───────────────────────────────────────────────────────
function getToken()       { return localStorage.getItem("pixelmind_token") || ""; }
function saveToken(t)     { localStorage.setItem("pixelmind_token", t); }
function clearToken()     { localStorage.removeItem("pixelmind_token"); }

// ─── Suggestion Database ──────────────────────────────────────────────────────
const SUGGESTIONS_DB = [
  "A majestic dragon soaring above glowing neon clouds at midnight",
  "A witch's enchanted forest cottage with glowing mushrooms and fireflies",
  "A knight in shining armor standing before a burning castle at dusk",
  "An ancient wizard's tower floating above the clouds, surrounded by lightning",
  "A mermaid resting on a glowing coral reef in a deep blue ocean",
  "A phoenix rising from golden flames above a misty mountain",
  "A mystical portal to another dimension in a dark forest",
  "A fairy village hidden inside a giant glowing mushroom",
  "A futuristic city at sunset with neon lights and flying cars",
  "An astronaut walking on Mars with Earth visible in the distance",
  "A space station orbiting a colorful nebula in deep space",
  "A cyberpunk street market at night with neon signs and rain puddles",
  "A robot tending to a futuristic garden on the moon",
  "An alien marketplace on a distant planet with two suns",
  "A futuristic underwater city with transparent domes and submarines",
  "A starship emerging from hyperspace near a dying star",
  "A serene Japanese zen garden in autumn with golden leaves",
  "Northern lights over a snow-covered cabin in a pine forest",
  "A breathtaking waterfall into a luminous blue lagoon in a jungle",
  "Cherry blossom trees lining a mountain path at sunrise",
  "A misty mountain lake reflecting a rainbow after rain",
  "Giant glowing jellyfish floating in a bioluminescent ocean at night",
  "A magical forest where trees glow with soft golden light",
  "A desert oasis at sunset with golden sand dunes and palm trees",
  "A warrior princess with glowing armor standing on a cliff at sunset",
  "A mysterious hooded figure with glowing eyes in a dark alley",
  "A steampunk inventor surrounded by gears and gadgets in a workshop",
  "An elegant Victorian-era woman in a rose garden, soft portrait lighting",
  "A samurai meditating in cherry blossom forest, cinematic shot",
  "A cyberpunk hacker with neon tattoos in a dark digital world",
  "A cozy rain-soaked coffee shop with warm amber lighting, bokeh",
  "A massive gothic cathedral illuminated by moonlight, foggy night",
  "An ancient Mayan temple overgrown with glowing tropical vines",
  "A floating sky island with waterfalls and medieval towers",
  "A library inside a giant hollow tree, sunlight filtering through leaves",
  "A Victorian mansion on a stormy cliffside, lightning in the background",
  "An explosion of colorful galaxies and stardust in deep space",
  "A wolf made entirely of auroras and constellations",
  "A surreal clock melting over a peaceful ocean landscape, Dali style",
  "A human silhouette made of golden light in a dark universe",
  "A shattered mirror reflecting different worlds, surreal art",
];

const SURPRISE_PROMPTS = [
  "A majestic dragon soaring over a glowing neon city at midnight",
  "An astronaut walking through a blooming cherry blossom forest on Mars",
  "A cozy cabin in an enchanted forest with glowing fireflies, foggy atmosphere",
  "An underwater city made of crystal, fish swimming through crystal towers",
  "A samurai standing on a cliff overlooking a futuristic Tokyo skyline at sunset",
  "A giant turtle carrying an entire ocean ecosystem on its back, surreal art",
  "A steampunk airship sailing through clouds of golden dust at dawn",
  "A witch's cottage nestled in a giant mushroom forest, magical ambiance",
  "A cyberpunk street market at night, neon signs reflecting on rain puddles",
  "An ancient temple overgrown with luminous flora, mysterious and serene",
  "A wolf made entirely of galaxies and stardust howling at the moon",
  "A Victorian-era library floating in outer space, stars visible through windows",
  "A phoenix rising from the ocean, wings made of water and fire intertwined",
  "A futuristic greenhouse on the moon with Earth visible in the background",
  "A medieval knight battling a storm giant in a thunderstruck landscape",
];

// ─── Main App ─────────────────────────────────────────────────────────────────
// Wrap everything in DOMContentLoaded so all getElementById calls are safe
document.addEventListener("DOMContentLoaded", () => {

  // ─── State ─────────────────────────────────────────────────────────────────
  const API_BASE = window.location.port === "3000" ? "" : "http://localhost:3000";
  let isImageGenerating = false;
  let selectedStyle     = "";
  let selectedCount     = 1;
  let selectedSize      = "1024x1024";
  let currentPrompt     = "";
  let historyData       = [];
  let lightboxPromptText = "";
  let highlightedIndex  = -1;

  try {
    historyData = JSON.parse(localStorage.getItem("pixelmind_history") || "[]");
  } catch { historyData = []; }

  // ─── DOM Refs ───────────────────────────────────────────────────────────────
  const generateBtn      = document.getElementById("generateBtn");
  const promptInput      = document.getElementById("promptInput");
  const imageGallery     = document.getElementById("imageGallery");
  const gallerySection   = document.getElementById("gallerySection");
  const galleryMeta      = document.getElementById("galleryMeta");
  const progressWrap     = document.getElementById("progressWrap");
  const progressBar      = document.getElementById("progressBar");
  const toastEl          = document.getElementById("toast");
  const lightbox         = document.getElementById("lightbox");
  const lightboxImg      = document.getElementById("lightboxImg");
  const lightboxDownload = document.getElementById("lightboxDownload");
  const lightboxCopy     = document.getElementById("lightboxCopy");
  const lightboxPromptEl = document.getElementById("lightboxPrompt");
  const historyList      = document.getElementById("historyList");
  const suggestionsBox   = document.getElementById("suggestionsBox");
  const suggestionsList  = document.getElementById("suggestionsList");
  const generatePanel    = document.getElementById("generatePanel");
  const historyPanel     = document.getElementById("historyPanel");

  // Modal & Auth elements
  const authModal         = document.getElementById("authModal");
  const usernameInput     = document.getElementById("usernameInput");
  const passwordInput     = document.getElementById("passwordInput");
  const authBtn           = document.getElementById("authBtn");
  const authBtnLabel      = document.getElementById("authBtnLabel");
  const authSubmitBtn     = document.getElementById("authSubmitBtn");
  const authCancelBtn     = document.getElementById("authCancelBtn");
  const passwordToggleBtn = document.getElementById("passwordToggleBtn");

  // ─── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg, type = "default") {
    toastEl.textContent = msg;
    toastEl.className = `toast show ${type}`;
    setTimeout(() => { toastEl.className = "toast"; }, 2800);
  }

  // ─── Style Presets ──────────────────────────────────────────────────────────
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedStyle = btn.dataset.style;
    });
  });

  // ─── Segmented Controls ─────────────────────────────────────────────────────
  document.querySelectorAll("#imgCountControl .seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#imgCountControl .seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCount = parseInt(btn.dataset.value);
    });
  });

  document.querySelectorAll("#imgSizeControl .seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#imgSizeControl .seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = btn.dataset.value;
    });
  });

  // ─── Surprise Me ────────────────────────────────────────────────────────────
  document.getElementById("surpriseBtn").addEventListener("click", () => {
    promptInput.value = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    promptInput.focus();
    hideSuggestions();
    showToast("✨ Surprise prompt loaded!");
  });

  // ─── Copy Prompt ────────────────────────────────────────────────────────────
  document.getElementById("copyPromptBtn").addEventListener("click", () => {
    const text = promptInput.value.trim();
    if (!text) return showToast("Nothing to copy!", "error");
    navigator.clipboard.writeText(text).then(() => showToast("✅ Prompt copied!", "success"));
  });

  // ─── Clear Prompt ───────────────────────────────────────────────────────────
  document.getElementById("clearBtn").addEventListener("click", () => {
    promptInput.value = "";
    hideSuggestions();
    promptInput.focus();
  });

  // ─── Nav Tabs ───────────────────────────────────────────────────────────────
  document.getElementById("navGenerate").addEventListener("click", () => {
    document.getElementById("navGenerate").classList.add("active");
    document.getElementById("navHistory").classList.remove("active");
    generatePanel.style.display  = "";
    gallerySection.style.display = imageGallery.children.length ? "" : "none";
    historyPanel.style.display   = "none";
  });

  document.getElementById("navHistory").addEventListener("click", () => {
    document.getElementById("navHistory").classList.add("active");
    document.getElementById("navGenerate").classList.remove("active");
    generatePanel.style.display  = "none";
    gallerySection.style.display = "none";
    historyPanel.style.display   = "";
    renderHistory();
  });

  // ─── Quick Tags ─────────────────────────────────────────────────────────────
  document.querySelectorAll(".quick-tag").forEach(tag => {
    tag.addEventListener("click", () => {
      promptInput.value = tag.dataset.text;
      promptInput.focus();
      hideSuggestions();
      showToast("✏️ Prompt loaded!", "success");
    });
  });

  // ─── Progress Bar ────────────────────────────────────────────────────────────
  let progressInterval;
  function startProgress() {
    progressWrap.style.display = "block";
    progressBar.style.width    = "0%";
    let p = 0;
    progressInterval = setInterval(() => {
      if (p < 85) {
        p += Math.random() * 3 + 1;
        progressBar.style.width = Math.min(p, 85) + "%";
      }
    }, 400);
  }

  function finishProgress() {
    clearInterval(progressInterval);
    progressBar.style.width = "100%";
    setTimeout(() => {
      progressWrap.style.display = "none";
      progressBar.style.width    = "0%";
    }, 600);
  }

  // ─── Inline SVG Spinner (no external file needed) ───────────────────────────
  function makeSpinnerEl() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 50 50");
    svg.setAttribute("class", "spinner-svg");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "25");
    circle.setAttribute("cy", "25");
    circle.setAttribute("r", "20");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "#8b5cf6");
    circle.setAttribute("stroke-width", "4");
    circle.setAttribute("stroke-dasharray", "80");
    circle.setAttribute("stroke-linecap", "round");
    svg.appendChild(circle);
    return svg;
  }

  // ─── Image Card Builder ─────────────────────────────────────────────────────
  function buildLoadingCard() {
    const card = document.createElement("div");
    card.className = "img-card loading";
    card.appendChild(makeSpinnerEl());
    return card;
  }

  function buildImageCard(src, prompt) {
    const card = document.createElement("div");
    card.className = "img-card";
    card.dataset.prompt = prompt;

    const img   = document.createElement("img");
    img.src     = src;
    img.alt     = "AI generated image";
    img.loading = "lazy";
    card.appendChild(img);

    const overlay = document.createElement("div");
    overlay.className = "img-card-overlay";

    const dlBtn = document.createElement("button");
    dlBtn.className = "card-action-btn";
    dlBtn.title     = "Download";
    dlBtn.innerHTML = '<i class="fas fa-download"></i>';
    dlBtn.addEventListener("click", e => {
      e.stopPropagation();
      downloadBlob(src, `pixelmind-${Date.now()}.jpg`);
    });

    const expandBtn = document.createElement("button");
    expandBtn.className = "card-action-btn";
    expandBtn.title     = "Expand";
    expandBtn.innerHTML = '<i class="fas fa-expand"></i>';
    expandBtn.addEventListener("click", e => {
      e.stopPropagation();
      openLightbox(src, prompt);
    });

    overlay.appendChild(dlBtn);
    overlay.appendChild(expandBtn);
    card.appendChild(overlay);
    card.addEventListener("click", () => openLightbox(src, prompt));
    return card;
  }

  // ─── Download Helper ────────────────────────────────────────────────────────
  async function downloadBlob(src, filename) {
    try {
      const res  = await fetch(src);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      window.open(src, "_blank");
    }
  }

  // ─── URL → base64 (for history persistence) ─────────────────────────────────
  async function blobToDataURL(url) {
    const res  = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror  = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ─── Update gallery after generation ────────────────────────────────────────
  function updateImageCards(urlArray) {
    const loadingCards = imageGallery.querySelectorAll(".img-card.loading");
    urlArray.forEach((url, i) => {
      const newCard = buildImageCard(url, currentPrompt);
      if (loadingCards[i]) loadingCards[i].replaceWith(newCard);
      // Save to history asynchronously (convert URL → base64)
      blobToDataURL(url)
        .then(dataUrl => saveToHistory(dataUrl, currentPrompt, selectedSize, selectedStyle))
        .catch(()     => saveToHistory(url,     currentPrompt, selectedSize, selectedStyle));
    });
  }

  // ─── Main Generation ────────────────────────────────────────────────────────
  async function generateAiImages() {
    const rawPrompt = promptInput.value.trim();
    if (!rawPrompt) return showToast("⚠️ Please enter a prompt first!", "error");
    if (isImageGenerating) return;

    const token = getToken();
    if (!token) {
      openAuthModal();
      showToast("🔑 Please login first to generate images!", "error");
      return;
    }

    hideSuggestions();
    currentPrompt     = selectedStyle ? `${rawPrompt}, ${selectedStyle}` : rawPrompt;
    isImageGenerating = true;

    generateBtn.disabled = true;
    generateBtn.querySelector(".btn-text").style.display    = "none";
    generateBtn.querySelector(".btn-loading").style.display = "inline-flex";

    gallerySection.style.display = "";
    imageGallery.innerHTML = "";
    galleryMeta.textContent = `${selectedCount} image${selectedCount > 1 ? "s" : ""} • ${selectedSize}`;
    for (let i = 0; i < selectedCount; i++) {
      imageGallery.appendChild(buildLoadingCard());
    }

    startProgress();

    try {
      // Fire request to the secure backend proxy
      const makeRequest = () => fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          n:      1,
          size:   selectedSize,
        }),
      });

      // Fire all requests simultaneously
      const responses = await Promise.all(
        Array.from({ length: selectedCount }, makeRequest)
      );

      // Parse all at once (avoid double-consuming response body)
      const payloads = await Promise.all(responses.map(r => r.json()));

      // Check for API errors in any response
      for (const payload of payloads) {
        if (payload.error) {
          throw new Error(payload.error || "Failed to generate images.");
        }
      }

      const urls = payloads.map(p => p.data[0].url);
      updateImageCards(urls);
      showToast(`🎉 ${selectedCount} image${selectedCount > 1 ? "s" : ""} generated!`, "success");

    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
      imageGallery.querySelectorAll(".img-card.loading").forEach(c => c.remove());
      if (!imageGallery.children.length) gallerySection.style.display = "none";
    } finally {
      finishProgress();
      isImageGenerating = false;
      generateBtn.disabled = false;
      generateBtn.querySelector(".btn-text").style.display    = "inline-flex";
      generateBtn.querySelector(".btn-loading").style.display = "none";
    }
  }

  generateBtn.addEventListener("click", generateAiImages);

  // ─── Single Keyboard Listener on Prompt ─────────────────────────────────────
  promptInput.addEventListener("keydown", e => {
    const isOpen = suggestionsBox.classList.contains("active");

    if (isOpen && e.key === "ArrowDown")  { e.preventDefault(); moveSuggestionHighlight(1);  return; }
    if (isOpen && e.key === "ArrowUp")    { e.preventDefault(); moveSuggestionHighlight(-1); return; }
    if (isOpen && e.key === "Escape")     { hideSuggestions(); return; }
    if (isOpen && e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const highlighted = suggestionsList.querySelector(".highlighted");
      if (highlighted) {
        promptInput.value = highlighted.querySelector(".sugg-text").innerText;
        hideSuggestions();
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateAiImages();
    }
  });

  // ─── Lightbox ────────────────────────────────────────────────────────────────
  function openLightbox(src, prompt) {
    lightboxImg.src              = src;
    lightboxPromptEl.textContent = `Prompt: "${prompt}"`;
    lightboxPromptText           = prompt;
    lightboxDownload.onclick = e => {
      e.preventDefault();
      downloadBlob(src, `pixelmind-${Date.now()}.jpg`);
    };
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxBackdrop").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeLightbox(); closeApiKeyModal(); }
  });
  lightboxCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(lightboxPromptText)
      .then(() => showToast("✅ Prompt copied!", "success"));
  });

  // ─── History ─────────────────────────────────────────────────────────────────
  function saveToHistory(imgData, prompt, size, style) {
    const entry = {
      id:   Date.now() + Math.random(),
      imgData, prompt, size, style,
      date: new Date().toLocaleString(),
    };
    historyData.unshift(entry);
    if (historyData.length > 30) historyData.pop();
    try { localStorage.setItem("pixelmind_history", JSON.stringify(historyData)); } catch { /* full */ }
  }

  function renderHistory() {
    if (!historyData.length) {
      historyList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-image-portrait"></i>
          <p>No history yet. Generate some images to see them here!</p>
        </div>`;
      return;
    }
    historyList.innerHTML = "";
    historyData.forEach(entry => {
      const item = document.createElement("div");
      item.className = "history-item";

      const thumb = document.createElement("img");
      thumb.className = "history-thumb";
      thumb.src = entry.imgData;
      thumb.alt = "thumb";

      const info = document.createElement("div");
      info.className = "history-info";
      info.innerHTML = `
        <div class="history-prompt">${entry.prompt}</div>
        <div class="history-meta">
          <span><i class="fas fa-calendar-alt"></i> ${entry.date}</span>
          ${entry.size  ? `<span class="history-tag">${entry.size}</span>`              : ""}
          ${entry.style ? `<span class="history-tag">${entry.style.split(",")[0]}</span>` : ""}
        </div>`;

      const actions = document.createElement("div");
      actions.className = "prompt-actions";

      const viewBtn = document.createElement("button");
      viewBtn.className = "icon-btn";
      viewBtn.title     = "View";
      viewBtn.innerHTML = '<i class="fas fa-expand"></i>';
      viewBtn.addEventListener("click", () => openLightbox(entry.imgData, entry.prompt));

      const dlBtn = document.createElement("button");
      dlBtn.className = "icon-btn";
      dlBtn.title     = "Download";
      dlBtn.innerHTML = '<i class="fas fa-download"></i>';
      dlBtn.addEventListener("click", () => downloadBlob(entry.imgData, "pixelmind.jpg"));

      actions.appendChild(viewBtn);
      actions.appendChild(dlBtn);
      item.appendChild(thumb);
      item.appendChild(info);
      item.appendChild(actions);
      historyList.appendChild(item);
    });
  }

  document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    historyData = [];
    localStorage.removeItem("pixelmind_history");
    renderHistory();
    showToast("🗑️ History cleared!", "success");
  });

  // ─── Suggestions ─────────────────────────────────────────────────────────────
  function highlightMatch(text, query) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      text.slice(0, idx) +
      `<mark>${text.slice(idx, idx + query.length)}</mark>` +
      text.slice(idx + query.length)
    );
  }

  function showSuggestions(query) {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) { hideSuggestions(); return; }
    const matches = SUGGESTIONS_DB.filter(s => s.toLowerCase().includes(q)).slice(0, 8);
    if (!matches.length) { hideSuggestions(); return; }

    suggestionsList.innerHTML = "";
    highlightedIndex = -1;

    matches.forEach(text => {
      const li = document.createElement("li");
      li.className = "suggestion-item";
      li.innerHTML = `
        <i class="fas fa-wand-magic-sparkles"></i>
        <span class="sugg-text">${highlightMatch(text, query.trim())}</span>
        <i class="fas fa-arrow-right sugg-arrow"></i>`;
      li.addEventListener("mousedown", e => {
        e.preventDefault();
        promptInput.value = text;
        hideSuggestions();
        promptInput.focus();
      });
      suggestionsList.appendChild(li);
    });
    suggestionsBox.classList.add("active");
  }

  function hideSuggestions() {
    suggestionsBox.classList.remove("active");
    highlightedIndex = -1;
  }

  function moveSuggestionHighlight(dir) {
    const items = suggestionsList.querySelectorAll(".suggestion-item");
    if (!items.length) return;
    items.forEach(i => i.classList.remove("highlighted"));
    highlightedIndex = (highlightedIndex + dir + items.length) % items.length;
    items[highlightedIndex].classList.add("highlighted");
    items[highlightedIndex].scrollIntoView({ block: "nearest" });
  }

  promptInput.addEventListener("input", () => showSuggestions(promptInput.value));
  document.addEventListener("click", e => {
    if (!e.target.closest(".prompt-wrapper")) hideSuggestions();
  });

  // ─── Login Modal & Auth Logic ─────────────────────────────────────────────────
  function openAuthModal() {
    usernameInput.value = "";
    passwordInput.value = "";
    authModal.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => usernameInput.focus(), 150);
  }

  function closeAuthModal() {
    authModal.classList.remove("open");
    document.body.style.overflow = "";
    updateAuthBtnState();
  }

  function updateAuthBtnState() {
    const token = getToken();
    if (token) {
      authBtn.classList.add("has-key");
      authBtnLabel.textContent = "Logout";
      const banner = document.getElementById("noKeyBanner");
      if (banner) banner.remove();
    } else {
      authBtn.classList.remove("has-key");
      authBtnLabel.textContent = "Login";
      showNoKeyBanner();
    }
  }

  function showNoKeyBanner() {
    if (document.getElementById("noKeyBanner")) return;
    const heroText = document.querySelector(".hero-text");
    if (!heroText) return;
    const banner = document.createElement("div");
    banner.className = "no-key-banner";
    banner.id        = "noKeyBanner";
    banner.innerHTML = `
      <i class="fas fa-triangle-exclamation"></i>
      <span>Please log in to start generating. <a id="bannerKeyLink">Click here to sign in</a>.</span>`;
    heroText.insertAdjacentElement("afterend", banner);
    document.getElementById("bannerKeyLink").addEventListener("click", openAuthModal);
  }

  async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showToast("⚠️ Username and password are required.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      saveToken(data.token);
      closeAuthModal();
      showToast(`Welcome back, ${data.username}! 🎉`, "success");
    } catch (err) {
      passwordInput.parentElement.style.boxShadow = "0 0 0 2px var(--danger)";
      showToast(`❌ ${err.message}`, "error");
      setTimeout(() => passwordInput.parentElement.style.boxShadow = "", 1500);
    }
  }

  authSubmitBtn.addEventListener("click", handleLogin);
  authCancelBtn.addEventListener("click", closeAuthModal);

  passwordToggleBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    passwordToggleBtn.innerHTML = isPassword
      ? '<i class="fas fa-eye-slash"></i>'
      : '<i class="fas fa-eye"></i>';
  });

  passwordInput.addEventListener("keydown", e => {
    if (e.key === "Enter")  handleLogin();
  });
  usernameInput.addEventListener("keydown", e => {
    if (e.key === "Enter")  passwordInput.focus();
  });

  authBtn.addEventListener("click", () => {
    if (getToken()) {
      clearToken();
      updateAuthBtnState();
      showToast("Logged out successfully.", "success");
    } else {
      openAuthModal();
    }
  });

  authModal.addEventListener("click", e => {
    if (e.target === authModal) closeAuthModal();
  });

  // ─── Init ────────────────────────────────────────────────────────────────────
  updateAuthBtnState();

  // Show modal automatically on first visit if not logged in
  if (!getToken()) {
    setTimeout(openAuthModal, 600);
  }

}); // end DOMContentLoaded