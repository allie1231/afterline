// Injected into every page. Watches for text selections and floats a small
// "+ AFTERLINE" button at the end of the selection. Clicking it ships the
// selection to the background worker, which calls /api/quick-add.

(() => {
  let btn = null;
  let lastSelection = null;

  function ensureButton() {
    if (btn) return btn;
    btn = document.createElement("button");
    btn.id = "afterline-collector-btn";
    btn.type = "button";
    btn.textContent = "+ AFTERLINE";
    Object.assign(btn.style, {
      position: "absolute",
      zIndex: "2147483647",
      display: "none",
      font: '600 11px ui-monospace, "IBM Plex Mono", Menlo, monospace',
      letterSpacing: "0.22em",
      padding: "7px 10px",
      background: "#f5f1e8",
      color: "#111",
      border: "1px solid #111",
      borderRadius: "0",
      cursor: "pointer",
      userSelect: "none",
      boxShadow: "2px 2px 0 #111",
    });
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveSelection();
    });
    document.documentElement.appendChild(btn);
    return btn;
  }

  function readSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
    const text = sel.toString().trim();
    if (!text) return null;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;
    return { text, rect };
  }

  function placeButton(info) {
    const el = ensureButton();
    el.style.display = "inline-block";
    // Position just below the right edge of the selection.
    const top = window.scrollY + info.rect.bottom + 6;
    const right = window.scrollX + info.rect.right;
    // Render off-screen to measure, then position.
    el.style.left = "-9999px";
    el.style.top = "0";
    requestAnimationFrame(() => {
      const w = el.offsetWidth;
      el.style.left = `${Math.max(8, right - w)}px`;
      el.style.top = `${Math.max(8, top)}px`;
    });
  }

  function hideButton() {
    if (btn) btn.style.display = "none";
  }

  function setBtnLabel(text, opts = {}) {
    if (!btn) return;
    btn.textContent = text;
    if (opts.invert) {
      btn.style.background = "#111";
      btn.style.color = "#f5f1e8";
    } else {
      btn.style.background = "#f5f1e8";
      btn.style.color = "#111";
    }
  }

  async function saveSelection() {
    const info = lastSelection || readSelection();
    if (!info) return;

    setBtnLabel("SAVING…");
    btn.disabled = true;

    const data = {
      text: info.text,
      page_url: location.href,
      page_title: document.title,
    };

    try {
      const res = await chrome.runtime.sendMessage({ type: "QUICK_ADD", data });
      if (res?.ok) {
        setBtnLabel("SAVED ✓", { invert: true });
        setTimeout(() => {
          hideButton();
          setBtnLabel("+ AFTERLINE");
          btn.disabled = false;
        }, 1400);
      } else {
        const err = (res && res.error) || "FAILED";
        setBtnLabel("✕ " + err.slice(0, 40));
        setTimeout(() => {
          setBtnLabel("+ AFTERLINE");
          btn.disabled = false;
        }, 2800);
      }
    } catch (e) {
      setBtnLabel("✕ NO CONNECTION");
      setTimeout(() => {
        setBtnLabel("+ AFTERLINE");
        btn.disabled = false;
      }, 2800);
    }
  }

  document.addEventListener("mouseup", (e) => {
    if (btn && btn.contains(e.target)) return;
    // Defer so the selection has settled.
    setTimeout(() => {
      const info = readSelection();
      if (!info) {
        hideButton();
        lastSelection = null;
        return;
      }
      lastSelection = info;
      placeButton(info);
    }, 0);
  });

  document.addEventListener("mousedown", (e) => {
    if (btn && btn.contains(e.target)) return;
    hideButton();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideButton();
  });

  // Hide when scrolling — repositioning during scroll is jittery and the
  // user likely moved on anyway.
  window.addEventListener("scroll", hideButton, { passive: true });
})();
