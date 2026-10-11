document.getElementById('year')?.replaceChildren(String(new Date().getFullYear()));

const menuButton = document.querySelector('.menu-toggle');
const menu = document.getElementById('mobile-menu');
if (menuButton && menu) {
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    menu.hidden = true;
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.hidden = !open;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); }
  });
  const mobileMedia = window.matchMedia('(max-width: 760px)');
  mobileMedia.addEventListener('change', event => { if (!event.matches) closeMenu(); });
}

const form = document.querySelector('[data-email-form]');
if (form) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const subject = form.dataset.emailForm === 'portrait' ? 'Custom portrait request — Art Fadist' : 'Hello Art Fadist';
    const lines = [
      `Name: ${data.get('name')}`,
      `Email: ${data.get('email')}`,
      ...(data.has('portraitType') ? [`Portrait: ${data.get('portraitType')}`, `Gift: ${data.get('gift') === 'yes' ? 'Yes' : 'No'}`] : []),
      '', String(data.get('message') || '')
    ];
    const href = `mailto:contact.thefadist@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    window.location.href = href;
    document.getElementById('form-status').textContent = 'Your email draft is ready. Send it from your email app to complete your request. If it did not open, email contact.thefadist@gmail.com directly.';
  });
}
