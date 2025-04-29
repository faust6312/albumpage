// --- NEW: Function to preload images ---
function preloadImages(urls) {
  if (!Array.isArray(urls)) {
    console.error("preloadImages expects an array of URLs.");
    return;
  }
  urls.forEach(url => {
    if (url) { // Check if URL is not empty or null
      const img = new Image();
      img.src = url;
    }
  });
  console.log(`Preloading ${urls.length} image(s).`);
}
// --------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const avatar = document.getElementById('avatar');
  const stickerBg = document.getElementById('sticker-background');
  const movingImg = document.getElementById('moving-image'); //
  const centerImg = document.getElementById('center-image'); //
  const overlay = document.getElementById('reveal-effect-overlay');

  /* Config Check */
  if (typeof config === 'undefined' || !config || typeof config !== 'object') {
    console.error('config.js not loaded or is invalid');
    cleanup(movingImg, centerImg, overlay);
    return;
  }

  // --- Preload key images early ---
  const imageUrlsToPreload = [];
  if (config.avatarUrl) { //
      imageUrlsToPreload.push(config.avatarUrl); //
  }
  if (movingImg && movingImg.src) { //
      imageUrlsToPreload.push(movingImg.src); //
  }
   if (centerImg && centerImg.src) { //
      imageUrlsToPreload.push(centerImg.src); //
  }
  if (Array.isArray(config.albumCoverUrls)) { //
       // Preload all album covers
       imageUrlsToPreload.push(...config.albumCoverUrls); //
  }
  preloadImages(imageUrlsToPreload); // Call the preload function
  // ---------------------------------

  /* Avatar Setup */
  if (avatar && config.avatarUrl) { //
    avatar.src = config.avatarUrl; //
    if (config.blogUrl) { //
      avatar.style.cursor = 'pointer';
      avatar.addEventListener('click', () => window.location.href = config.blogUrl); //
    }
  }

  /* Generate Stickers (now includes vinyl logic) */
  // Generate stickers after starting preload, they will use cached images
  if (stickerBg && Array.isArray(config.albumCoverUrls) && config.albumCoverUrls.length) { //
    generateStickers(stickerBg, config.albumCoverUrls); //
  }

  /* Intro Animation Logic */
  if (movingImg && overlay && centerImg) {
    movingImg.addEventListener('animationend', () => {
      movingImg.classList.add('fade-out');
      centerImg.classList.add('fade-out');
      void movingImg.offsetWidth; // Force reflow
      centerImg.addEventListener('animationend', () => {
        overlay.style.animationPlayState = 'running';
      }, { once: true });
    }, { once: true });

    overlay.addEventListener('animationend', () => {
      cleanup(movingImg, centerImg, overlay);
      document.body.style.overflow = 'auto'; // Allow scrolling after animation
    }, { once: true });
  }
});

/* --- Sticker Generation (Includes Vinyl Designation, Sizing, Listeners) --- */
function generateStickers(container, urls) { // urls from config.albumCoverUrls
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 768;
  const baseMin = mobile ? 90 : 150;
  const baseMax = mobile ? 150 : 220;

  const avatarElement = document.getElementById('avatar');
  if (!avatarElement) return;

  const av = avatarElement.getBoundingClientRect();
  const aCx = av.left + av.width / 2;
  const aCy = av.top + av.height / 2;
  const aEx = av.width * 0.7;

  const placed = [];
  let currentZIndex = 2;
  const maxAttemptsPerUrl = 100;
  const targetStickerCount = Math.max(30, Math.floor((vw * vh) / (baseMin * baseMin * 3)));
  const overlapFactor = 0.85;

  // --- Select 5 Vinyl Indices BEFORE the loop ---
  const vinylIndices = new Set();
  const numVinylsToPick = Math.min(5, urls.length);
  while (vinylIndices.size < numVinylsToPick) {
    vinylIndices.add(Math.floor(Math.random() * urls.length));
  }
  console.log(`Selected indices for vinyl records:`, Array.from(vinylIndices));

  let stickersPlaced = 0;
  let urlCounter = 0;

  while (stickersPlaced < targetStickerCount) {
    if (urlCounter > urls.length * maxAttemptsPerUrl + targetStickerCount) {
         console.warn("Exiting sticker placement loop early - potentially stuck.");
         break;
    }

    const urlIndex = urlCounter % urls.length;
    const url = urls[urlIndex];
    const isVinyl = vinylIndices.has(urlIndex);

    let placedThisAttempt = false;
    for (let i = 0; i < maxAttemptsPerUrl; i++) {
      const baseW = Math.random() * (baseMax - baseMin) + baseMin;
      let finalW = baseW;
      if (isVinyl) {
          finalW = Math.min(baseW * 2, vw * 0.4, vh * 0.4, 450);
      }

      const r = finalW / 2;
      const cx = Math.random() * vw;
      const cy = Math.random() * vh;

      if (dist(cx, cy, aCx, aCy) < aEx + r) continue;
      if (placed.some(p => dist(cx, cy, p.cx, p.cy) < (p.r + r) * overlapFactor)) continue;

      /* Create Sticker Wrapper */
      const wrap = document.createElement('div');
      wrap.className = 'sticker-wrapper';
      if (isVinyl) {
          wrap.classList.add('vinyl-record');
      }
      wrap.style.position = 'absolute';
      wrap.style.width = `${finalW}px`;
      wrap.style.height = `${finalW}px`;
      wrap.style.left = `${cx - finalW / 2}px`;
      wrap.style.top = `${cy - finalW / 2}px`;

      const initialRotation = isVinyl ? 0 : (Math.random() * 30 - 15);
      wrap.style.setProperty('--initial-rotate', `${initialRotation}deg`);

      if (!isVinyl) {
           wrap.style.animationDelay = `${Math.random() * 2.5}s`;
           wrap.style.animationDuration = `${3 + Math.random() * 2}s`;
      }

      wrap.style.zIndex = currentZIndex++;

      container.appendChild(wrap);

      /* Create Inner Container */
      const inner = document.createElement('div');
      inner.className = 'sticker-inner';
      wrap.appendChild(inner);

      /* Image Tag */
      const img = document.createElement('img');
      img.src = url; // Use the URL - browser should use cached version if preloaded
      // img.loading = 'lazy'; // Keep lazy loading? Maybe remove if preloading all? Let's remove it.
      img.alt = isVinyl ? 'Vinyl Record Label' : 'Album Cover';
      img.className = 'album-sticker';
      inner.appendChild(img);

      // --- Add Click Listener based on type ---
      if (isVinyl) {
          // Vinyl click listener for spinning
          wrap.addEventListener('click', () => {
              wrap.classList.toggle('spinning');
          });
      } else {
          // Normal sticker click listener for diagonal rotation
          wrap.addEventListener('click', () => {
              if (!wrap.classList.contains('rotate-diagonal')) {
                  wrap.classList.add('rotate-diagonal');
                  wrap.addEventListener('animationend', (event) => {
                      if (event.animationName === 'rotateDiagonal') {
                         wrap.classList.remove('rotate-diagonal');
                      }
                  }, { once: true });
              }
          });
      }

      placed.push({ cx, cy, r });
      stickersPlaced++;
      placedThisAttempt = true;
      break;
    }
     urlCounter++;
  }
  console.log(`Placed ${stickersPlaced} stickers.`);
}

// Utility Functions
const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
function cleanup(...els) { els.forEach(el => el && el.remove()); }
