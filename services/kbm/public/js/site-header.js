(function () {
  if (document.documentElement.classList.contains('is-embedded')) return;

  const chrome = document.querySelector('.kbm-site-chrome');
  if (!chrome) return;

  const header = chrome.querySelector('.official-header');
  const menuButton = chrome.querySelector('.menu-button');
  const nav = chrome.querySelector('nav');
  const sections = chrome.querySelector('.sections-menu');

  const closeMenu = () => {
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('open');
    sections?.removeAttribute('open');
  };

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    const next = !open;
    menuButton.setAttribute('aria-expanded', next ? 'true' : 'false');
    menuButton.setAttribute('aria-label', next ? 'Закрыть меню' : 'Открыть меню');
    nav?.classList.toggle('open', next);
    if (next) sections?.setAttribute('open', '');
    else sections?.removeAttribute('open');
  });

  chrome.querySelectorAll('.sections-dropdown a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!(target instanceof Node) || header?.contains(target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
})();
