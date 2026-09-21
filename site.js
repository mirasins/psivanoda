const toggle = document.querySelector('.menu');
const nav = document.querySelector('#navegacion');

// Register essential navigation before optional theme and decorative features.
if (toggle && nav) {
  toggle.type = 'button';
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); toggle.focus(); }
  });
}

// Theme selector: follows the system by default and remembers explicit choices.
(() => {
  if (!nav) return;
  const storageKey = 'psivanoda-theme';
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const validThemes = new Set(['light', 'dark', 'system']);
  const labels = { light: 'Claro', dark: 'Oscuro', system: 'Sistema' };
  const icons = { light: '☀', dark: '☾', system: '◐' };
  let preference = document.documentElement.dataset.themePreference || 'system';

  const resolveTheme = value => value === 'system' ? (systemTheme.matches ? 'dark' : 'light') : value;
  const applyTheme = (value, persist = true) => {
    preference = validThemes.has(value) ? value : 'system';
    const resolved = resolveTheme(preference);
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#18131c' : '#392d42');
    if (persist) {
      try { localStorage.setItem(storageKey, preference); } catch (_) {}
    }
    document.querySelectorAll('[data-theme-option]').forEach(button => {
      const selected = button.dataset.themeOption === preference;
      button.setAttribute('aria-checked', String(selected));
      button.classList.toggle('selected', selected);
    });
    const current = document.querySelector('.theme-toggle-current');
    if (current) current.textContent = labels[preference];
    const icon = document.querySelector('.theme-toggle-icon');
    if (icon) icon.textContent = icons[preference];
  };

  const picker = document.createElement('div');
  picker.className = 'theme-picker';
  picker.innerHTML = `<button class="theme-toggle" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="theme-menu"><span class="theme-toggle-icon" aria-hidden="true">${icons[preference]}</span><span class="theme-toggle-label">Tema</span><span class="theme-toggle-current">${labels[preference]}</span><span class="theme-toggle-chevron" aria-hidden="true">⌄</span></button><div class="theme-menu" id="theme-menu" role="menu" hidden>${['light', 'dark', 'system'].map(value => `<button type="button" role="menuitemradio" aria-checked="false" data-theme-option="${value}"><span aria-hidden="true">${icons[value]}</span><span>${labels[value]}</span><span class="theme-check" aria-hidden="true">✓</span></button>`).join('')}</div>`;
  nav.insertBefore(picker, nav.querySelector('.nav-contact'));

  const pickerToggle = picker.querySelector('.theme-toggle');
  const pickerMenu = picker.querySelector('.theme-menu');
  const setOpen = open => {
    pickerToggle.setAttribute('aria-expanded', String(open));
    pickerMenu.hidden = !open;
    picker.classList.toggle('open', open);
    if (open) pickerMenu.querySelector('[aria-checked="true"]')?.focus();
  };
  pickerToggle.addEventListener('click', () => setOpen(pickerMenu.hidden));
  picker.querySelectorAll('[data-theme-option]').forEach(button => button.addEventListener('click', () => {
    applyTheme(button.dataset.themeOption);
    setOpen(false);
    pickerToggle.focus();
  }));
  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape') { setOpen(false); pickerToggle.focus(); }
  });
  document.addEventListener('click', event => { if (!picker.contains(event.target)) setOpen(false); });
  systemTheme.addEventListener?.('change', () => { if (preference === 'system') applyTheme('system', false); });
  applyTheme(preference, false);
})();

function closeMenu(){
  if (!nav || !toggle) return;
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded','false');
}
const mailForm = document.querySelector('#quick-mail');
mailForm?.addEventListener('submit', event => {
  event.preventDefault();
  const name = mailForm.elements.nombre.value.trim();
  const message = mailForm.elements.mensaje.value.trim();
  if (!name || !message) {
    document.querySelector('#mail-status').textContent = 'Escribe tu nombre y tu consulta antes de abrir el correo.';
    return;
  }
  const subject = 'Consulta desde psivanoda.cl';
  const body = message + '\r\n\r\nNombre: ' + name;
  window.location.href = 'mailto:agenda@psivanoda.cl?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  document.querySelector('#mail-status').textContent = 'Completa el envío en tu aplicación de correo. Si no se abre, escribe a agenda@psivanoda.cl y copia tu mensaje; todavía no se ha enviado desde esta página.';
});

// Preserve links to the former home-page prices section.
if(location.hash==='#valores'&&!location.pathname.includes('/valores')) location.replace(new URL('valores/',location.href).href);

// A light, decorative particle mesh and ribbon that reacts to pointer movement.
// It is intentionally disabled for touch-first and reduced-motion devices.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'gesture-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const pointer = { x: -500, y: -500, vx: 0, vy: 0 };
  const trail = [];
  let particles = [];
  let width = 0, height = 0, lastX = -500, lastY = -500;

  const resize = () => {
    const scale = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth; height = innerHeight;
    canvas.width = width * scale; canvas.height = height * scale;
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const gap = Math.max(92, Math.min(150, width / 9));
    particles = [];
    for (let y = gap * .55; y < height; y += gap)
      for (let x = gap * .55; x < width; x += gap)
        particles.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
  };
  const move = event => {
    const x = event.clientX, y = event.clientY;
    pointer.vx = x - lastX; pointer.vy = y - lastY;
    pointer.x = x; pointer.y = y; lastX = x; lastY = y;
    trail.push({ x, y, life: 1, size: Math.min(24, 7 + Math.hypot(pointer.vx, pointer.vy) * .38) });
    if (trail.length > 22) trail.shift();
  };
  const leave = () => { pointer.x = pointer.y = -500; };
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const darkTheme = document.documentElement.dataset.theme === 'dark';
    for (const p of particles) {
      const dx = pointer.x - p.x, dy = pointer.y - p.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < 230) {
        const force = (1 - distance / 230) * 1.5;
        p.vx -= dx / distance * force + pointer.vx * .008;
        p.vy -= dy / distance * force + pointer.vy * .008;
      }
      p.vx += (p.ox - p.x) * .012; p.vy += (p.oy - p.y) * .012;
      p.vx *= .87; p.vy *= .87; p.x += p.vx; p.y += p.vy;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 165) {
          ctx.strokeStyle = darkTheme ? `rgba(211, 174, 223, ${.11 * (1 - d / 165)})` : `rgba(114, 81, 126, ${.055 * (1 - d / 165)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (let i = trail.length - 1; i >= 0; i--) {
      const point = trail[i]; point.life -= .035;
      if (point.life <= 0) { trail.splice(i, 1); continue; }
    }
    if (trail.length > 2) {
      ctx.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i];
        ctx.strokeStyle = darkTheme ? `rgba(239, 179, 210, ${.2 * Math.min(a.life, b.life)})` : `rgba(146, 103, 126, ${.12 * Math.min(a.life, b.life)})`;
        ctx.lineWidth = Math.max(1, b.size * b.life);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(a.x, a.y, b.x, b.y); ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  };
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', move, { passive: true });
  addEventListener('blur', leave);
  resize(); draw();
})();
