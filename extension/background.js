// Service worker: opens the options page on toolbar click and proxies the
// quick-add request from content scripts so the CORS preflight uses the
// extension's declared host_permissions.

const DEFAULT_ENDPOINT = "https://afterline-pi.vercel.app";

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "QUICK_ADD") return undefined;

  (async () => {
    try {
      const stored = await chrome.storage.local.get([
        "afterline_endpoint",
        "afterline_token",
      ]);
      const endpoint = (stored.afterline_endpoint || DEFAULT_ENDPOINT).replace(
        /\/$/,
        "",
      );
      const token = stored.afterline_token;
      if (!token) {
        sendResponse({
          ok: false,
          error: "토큰이 비어있어요. 확장 아이콘 → Options에서 설정.",
        });
        return;
      }

      const res = await fetch(`${endpoint}/api/quick-add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(msg.data ?? {}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        sendResponse({
          ok: false,
          error: body.error || `HTTP ${res.status}`,
        });
        return;
      }
      sendResponse({ ok: true, ...body });
    } catch (err) {
      sendResponse({
        ok: false,
        error: String((err && err.message) || err),
      });
    }
  })();

  // Tell Chrome we'll respond asynchronously.
  return true;
});
