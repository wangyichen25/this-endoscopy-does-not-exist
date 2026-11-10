import { chooseNext, validateGallery, verifyImage } from './gallery.js';

const image = document.querySelector('#endoscopy');
const statePanel = document.querySelector('#image-state');
const message = document.querySelector('#state-message');
const caption = document.querySelector('#caption');
const button = document.querySelector('#next-image');
const label = button.querySelector('span');
const figure = document.querySelector('figure');
const storageKey = 'endoscopy-gallery-v1';
let gallery;
let memory;
let objectUrl;
let loading = false;

function readState() {
  try { memory = JSON.parse(sessionStorage.getItem(storageKey)) ?? memory; } catch { /* Private browsing may disable storage. */ }
  const fragment = location.hash.slice(1);
  if (/^[a-f0-9]{16,64}$/.test(fragment)) memory = { ...memory, current: fragment };
  return memory;
}

function remember(state) {
  memory = state;
  try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* URL fragment still avoids an immediate repeat. */ }
  try { history.replaceState(null, '', `#${state.current}`); } catch { /* In-memory navigation still works. */ }
}

async function showNext() {
  if (loading) return;
  loading = true;
  button.disabled = true;
  figure.setAttribute('aria-busy', 'true');
  caption.textContent = 'Loading a new synthetic view…';
  try {
    if (!gallery) {
      const response = await fetch('./gallery.json', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('The image gallery is temporarily unavailable.');
      gallery = validateGallery(await response.json());
    }
    const failed = new Set();
    for (let attempt = 0; attempt < Math.min(10, gallery.images.length); attempt++) {
      const available = { ...gallery, images: gallery.images.filter(item => !failed.has(item.id)) };
      const chosen = chooseNext(available, readState());
      if (!chosen.image) break;
      let pendingUrl;
      try {
        const response = await fetch(chosen.image.src, { credentials: 'same-origin' });
        if (!response.ok) throw new Error('Image unavailable');
        const bytes = await response.arrayBuffer();
        await verifyImage(bytes, chosen.image.sha256);
        pendingUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
        const decoded = new Image();
        decoded.src = pendingUrl;
        await decoded.decode();
        if (decoded.naturalWidth !== 512 || decoded.naturalHeight !== 512) throw new Error('Unexpected image dimensions');
        image.src = pendingUrl;
        image.hidden = false;
        statePanel.hidden = true;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = pendingUrl;
        remember(chosen.state);
        caption.textContent = 'AI-generated · 512 × 512';
        label.textContent = 'New image';
        return;
      } catch {
        if (pendingUrl) URL.revokeObjectURL(pendingUrl);
        failed.add(chosen.image.id);
      }
    }
    throw new Error('A new image could not be loaded. Please try again.');
  } catch (error) {
    message.textContent = error.message;
    statePanel.hidden = false;
    image.hidden = true;
    caption.textContent = 'AI-generated image';
    label.textContent = 'Try again';
    if (!gallery) label.textContent = 'Check again';
  } finally {
    figure.setAttribute('aria-busy', 'false');
    loading = false;
    button.disabled = false;
  }
}

button.addEventListener('click', showNext);
showNext();
