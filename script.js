(() => {
  "use strict";

  /**
   * Single-page app controller for the poetry space.
   * - Loads content from poems.json
   * - Handles hash-based routing
   * - Provides search for non-intro sections
   * - Shows a quote in the sidebar on the intro page
   */

  const state = {
    q: "",
    mode: "intro", // 'intro' | 'analyses' | 'originals'
    data: null // { intro, analyses, originals }
  };

  const els = {
    list: null,
    input: null,
    title: null,
    meta: null,
    poem: null,
    year: null,
    introQuote: null
  };

  // —— DOM helpers ———————————————————————————

  function cacheDom() {
    els.list = document.querySelector("#list");
    els.input = document.querySelector("#q");
    els.title = document.querySelector("#title");
    els.meta = document.querySelector("#meta");
    els.poem = document.querySelector("#poem");
    els.year = document.querySelector("#year");
    els.introQuote = document.querySelector("#intro-quote-slot");
  }

  function setYear() {
    if (els.year) {
      els.year.textContent = new Date().getFullYear();
    }
  }

  function attachEvents() {
    if (els.input) {
      els.input.addEventListener("input", (event) => {
        state.q = event.target.value || "";
        renderList();
      });
    }

    window.addEventListener("hashchange", () => {
      route(window.location.hash);
    });
  }

  // —— Data loading ———————————————————————————

  async function loadData() {
    try {
      const response = await fetch("poems.json", { cache: "no-cache" });

      if (!response.ok) {
        throw new Error(`Failed to load poems.json (${response.status})`);
      }

      const json = await response.json();

      state.data = {
        intro: json.intro || null,
        analyses: Array.isArray(json.analyses) ? json.analyses : [],
        originals: Array.isArray(json.originals) ? json.originals : []
      };
    } catch (error) {
      console.error(error);
      renderError(
        "Something went wrong while loading the poems. Please refresh or try again later."
      );
    }
  }

  // —— Rendering helpers —————————————————————————

  function renderLoading() {
    if (!els.title || !els.poem || !els.meta) return;

    els.title.textContent = "Loading…";
    els.meta.innerHTML = "";
    els.poem.textContent = "Loading poems…";
    document.title = "My Poetry Space — Loading";
  }

  function renderError(message) {
    if (!els.title || !els.poem || !els.meta) return;

    els.title.textContent = "Error";
    els.meta.innerHTML = "";
    els.poem.textContent = message;
    document.title = "My Poetry Space — Error";
  }

  function renderNotFound() {
    if (!els.title || !els.poem || !els.meta) return;

    els.title.textContent = "Not found";
    els.meta.innerHTML = "";
    els.poem.textContent = "This page does not exist yet.";
    document.title = "My Poetry Space";
  }

  function escapeHtml(str) {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderIntro() {
    if (!state.data || !state.data.intro) return;

    const intro = state.data.intro;

    els.title.textContent = intro.title || "Intro";
    els.meta.innerHTML = "";

    // Main body text (original “why I’m here” content, without the quote)
    const body = intro.body || "";
    const bodyParagraphs = body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");

    els.poem.innerHTML = `
      <section class="intro-body">
        ${bodyParagraphs}
      </section>
    `;

    // Sidebar quote
    if (els.introQuote) {
      const quote = intro.quote ? escapeHtml(intro.quote) : "";
      const author = intro.quoteAuthor ? escapeHtml(intro.quoteAuthor) : "";

      if (quote) {
        els.introQuote.innerHTML = `
          <div class="intro-quote-card">
            <div class="intro-quote-text">${quote}</div>
            <div class="intro-quote-author">— ${author}</div>
          </div>
        `;
        els.introQuote.hidden = false;
      } else {
        els.introQuote.innerHTML = "";
        els.introQuote.hidden = true;
      }
    }

    document.title = "My Poetry Space — Intro";
  }

  function renderEntry(poem) {
    if (!poem) return;

    els.title.textContent = poem.title || "";
    els.meta.innerHTML = poem.date ? `<span>${poem.date}</span>` : "";
    els.poem.textContent = poem.text || "";
    document.title = `${poem.title} — My Poetry Space`;

    // Hide quote when not on intro
    if (els.introQuote) {
      els.introQuote.hidden = true;
    }
  }

  function navigate(hash) {
    if (window.location.hash === hash) {
      route(hash);
      return;
    }
    window.location.hash = hash;
  }

  function matchesQuery(poem) {
    const q = state.q.trim().toLowerCase();
    if (!q) return true;

    const haystack = `${poem.title || ""} ${poem.text || ""}`.toLowerCase();
    return haystack.includes(q);
  }

  function collectionForMode() {
    if (!state.data) return [];
    if (state.mode === "analyses") return state.data.analyses;
    if (state.mode === "originals") return state.data.originals;
    return []; // intro does not have its own collection
  }

  function renderList() {
    if (!els.list) return;

    // If data not yet loaded, show a simple loading item
    if (!state.data) {
      els.list.innerHTML =
        '<div class="item"><div class="item-title">Loading…</div></div>';
      return;
    }

    let items;

    if (state.mode === "intro") {
      // Intro: we still allow search internally if user types,
      // but sidebar is visually replaced by the quote.
      const analyses = state.data.analyses.map((p) => ({
        ...p,
        __mode: "analyses"
      }));
      const originals = state.data.originals.map((p) => ({
        ...p,
        __mode: "originals"
      }));
      items = [...analyses, ...originals]
        .filter(matchesQuery)
        .sort((a, b) => {
          const da = a.date || "";
          const db = b.date || "";
          return db.localeCompare(da); // newest first
        });
    } else {
      // Normal per-section list
      items = collectionForMode()
        .slice()
        .filter(matchesQuery)
        .sort((a, b) => {
          const da = a.date || "";
          const db = b.date || "";
          return db.localeCompare(da);
        });
    }

    els.list.innerHTML = "";

    if (items.length === 0) {
      els.list.innerHTML =
        '<div class="item"><div class="item-title">No posts</div><div class="item-meta"></div></div>';
      return;
    }

    for (const poem of items) {
      const itemElement = document.createElement("div");
      itemElement.className = "item";
      itemElement.role = "listitem";

      const date = poem.date ? poem.date : "";

      itemElement.innerHTML = `
        <div>
          <div class="item-title">${poem.title}</div>
          <div class="item-meta">${date}</div>
        </div>
        <div>→</div>
      `;

      const baseHash = poem.__mode
        ? `#/${poem.__mode}/`
        : state.mode === "analyses"
        ? "#/analyses/"
        : "#/originals/";

      itemElement.addEventListener("click", () => {
        navigate(`${baseHash}${poem.slug}`);
      });

      els.list.appendChild(itemElement);
    }
  }

  function updateBodyMode() {
    if (!document.body) return;
    if (state.mode === "intro") {
      document.body.classList.add("intro-mode");
    } else {
      document.body.classList.remove("intro-mode");
    }
  }

  // —— Router ————————————————————————————————

  function route(rawHash) {
    if (!state.data) {
      // Data not ready yet; show loading state
      renderLoading();
      return;
    }

    const hash = rawHash || window.location.hash || "#/intro";

    // Intro root
    if (hash === "#/intro" || hash === "" || hash === "#") {
      state.mode = "intro";
      updateBodyMode();
      renderList();
      renderIntro();
      return;
    }

    // Analyses root
    if (hash === "#/analyses") {
      state.mode = "analyses";
      updateBodyMode();
      renderList();

      const newest = state.data.analyses[0];
      if (newest) {
        renderEntry(newest);
      } else {
        els.title.textContent = "Analyses";
        els.meta.innerHTML = "";
        els.poem.textContent = "No analyses yet.";
        document.title = "My Poetry Space — Analyses";
      }
      return;
    }

    // Originals root
    if (hash === "#/originals") {
      state.mode = "originals";
      updateBodyMode();
      renderList();

      const newest = state.data.originals[0];
      if (newest) {
        renderEntry(newest);
      } else {
        els.title.textContent = "Originals";
        els.meta.innerHTML = "";
        els.poem.textContent = "No originals yet.";
        document.title = "My Poetry Space — Originals";
      }
      return;
    }

    // Specific analysis
    let match = /^#\/analyses\/(.+)$/.exec(hash);
    if (match) {
      state.mode = "analyses";
      updateBodyMode();
      renderList();

      const slug = match[1];
      const poem = state.data.analyses.find((p) => p.slug === slug);
      if (poem) {
        renderEntry(poem);
        return;
      }
      renderNotFound();
      return;
    }

    // Specific original
    match = /^#\/originals\/(.+)$/.exec(hash);
    if (match) {
      state.mode = "originals";
      updateBodyMode();
      renderList();

      const slug = match[1];
      const poem = state.data.originals.find((p) => p.slug === slug);
      if (poem) {
        renderEntry(poem);
        return;
      }
      renderNotFound();
      return;
    }

    // Fallback
    state.mode = "intro";
    updateBodyMode();
    renderNotFound();
  }

  // —— Init ————————————————————————————————

  async function init() {
    cacheDom();
    setYear();
    attachEvents();
    renderLoading();

    await loadData();

    if (!state.data) {
      // Error already rendered
      return;
    }

    renderList();
    route(window.location.hash || "#/intro");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
