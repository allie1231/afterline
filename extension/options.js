const DEFAULT_ENDPOINT = "https://afterline-pi.vercel.app";

const endpointInput = document.getElementById("endpoint");
const tokenInput = document.getElementById("token");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

async function load() {
  const stored = await chrome.storage.local.get([
    "afterline_endpoint",
    "afterline_token",
  ]);
  endpointInput.value = stored.afterline_endpoint || DEFAULT_ENDPOINT;
  tokenInput.value = stored.afterline_token || "";
}

saveBtn.addEventListener("click", async () => {
  const endpoint = endpointInput.value.trim() || DEFAULT_ENDPOINT;
  const token = tokenInput.value.trim();
  await chrome.storage.local.set({
    afterline_endpoint: endpoint,
    afterline_token: token,
  });
  statusEl.textContent = "저장됨 / SAVED";
  setTimeout(() => (statusEl.textContent = ""), 2000);
});

load();
