/* ────────────────────────────────────────────
   主页脚本（去掉卷边 & 修复 hover 溢出）
──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const avatar     = document.getElementById('avatar');
  const stickerBg  = document.getElementById('sticker-background');
  const movingImg  = document.getElementById('moving-image');
  const centerImg  = document.getElementById('center-image');
  const overlay    = document.getElementById('reveal-effect-overlay');

  /* 配置校验 */
  if (typeof config === 'undefined') {
    console.error('config.js 未加载！');
    cleanup(movingImg, centerImg, overlay);
    return;
  }

  /* Avatar */
  if (avatar && config.avatarUrl) {
    avatar.src = config.avatarUrl;
    if (config.blogUrl) {
      avatar.style.cursor = 'pointer';
      avatar.addEventListener('click', () => window.location.href = config.blogUrl);
    }
  }

  /* 生成贴纸 */
  if (stickerBg && Array.isArray(config.albumCoverUrls) && config.albumCoverUrls.length) {
    generateStickers(stickerBg, config.albumCoverUrls);
  }

  /* Intro 流程 */
  if (movingImg && overlay) {
    movingImg.addEventListener('animationend', () => {
      movingImg.classList.add('fade-out');
      centerImg.classList.add('fade-out');
      void movingImg.offsetWidth;
      centerImg.addEventListener('animationend', () => {
        overlay.style.animationPlayState = 'running';
      }, { once: true });
    }, { once: true });

    overlay.addEventListener('animationend', () => {
      cleanup(movingImg, centerImg, overlay);
      document.body.style.overflow = 'auto';
    }, { once: true });
  }
});

/* ─── 贴纸生成 ─────────────────────────────── */
function generateStickers(container, urls) {
  const vw = window.innerWidth,
        vh = window.innerHeight;

  const mobile  = vw < 768;
  const baseMin = mobile ? 80  : 140;
  const baseMax = mobile ? 160 : 300;

  const av   = document.getElementById('avatar').getBoundingClientRect();
  const aCx  = av.left + av.width / 2,
        aCy  = av.top  + av.height / 2,
        aEx  = av.width * 0.8;

  const placed = [];

  urls.forEach(url => {
    for (let i = 0; i < 60; i++) {
      const shrink = 1 + Math.floor(i / 15) * 0.25;
      const w      = (Math.random() * (baseMax - baseMin) + baseMin) / shrink;
      const r      = w * Math.SQRT1_2;

      const cx = Math.random() * (vw - w) + w / 2;
      const cy = Math.random() * (vh - w) + w / 2;

      if (dist(cx, cy, aCx, aCy) < aEx + r) continue;
      if (placed.some(p => dist(cx, cy, p.cx, p.cy) < (p.r + r) * 0.8)) continue;

      /* 贴纸容器 */
      const wrap = document.createElement('div');
      wrap.className = 'sticker-wrapper';
      wrap.style.position   = 'absolute';
      wrap.style.width      = `${w}px`;
      wrap.style.height     = `${w}px`;
      wrap.style.left       = `${cx - w / 2}px`;
      wrap.style.top        = `${cy - w / 2}px`;
      wrap.style.transform  = `rotate(${Math.random() * 40 - 20}deg)`;
      container.appendChild(wrap);

      /* 图片本体 */
      const img = document.createElement('img');
      img.src       = url;
      img.loading   = 'lazy';
      img.alt       = 'Album Cover';
      img.className = 'album-sticker';
      wrap.appendChild(img);

      placed.push({ cx, cy, r });
      break;
    }
  });
}

const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
function cleanup(...els) { els.forEach(el => el && el.remove()); }
