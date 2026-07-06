const PASSWORD_HASH =
  "a3d5f6b445facb6a3d0cc72445f006ca93e68c7d46de0ea441515d572e02c3e6";
const UNLOCK_KEY = "plateful-unlocked";

const form = document.querySelector("#lockForm");
const input = document.querySelector("#lockPassword");
const error = document.querySelector("#lockError");

if (sessionStorage.getItem(UNLOCK_KEY) === PASSWORD_HASH) {
  unlock();
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const typedHash = await sha256(input?.value.trim() ?? "");

  if (typedHash !== PASSWORD_HASH) {
    if (error) error.hidden = false;
    input?.select();
    return;
  }

  sessionStorage.setItem(UNLOCK_KEY, PASSWORD_HASH);
  unlock();
});

function unlock() {
  document.body.classList.remove("locked");
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
