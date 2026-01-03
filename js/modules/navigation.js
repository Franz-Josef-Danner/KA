// -----------------------------
// Navigation Module
// -----------------------------
import { logout } from './auth.js';

const NAV_ITEMS = [
  { label: 'Firmenliste', href: 'firmenliste.html' },
  { label: 'Preislisten', href: 'preislisten.html' },
  { label: 'Aufträge', href: 'auftraege.html' },
  { label: 'Rechnungen', href: 'rechnungen.html' },
  { label: 'Kampagnen', href: 'kampagnen.html' }
];

// Create an accessible logout confirmation modal
function createLogoutModal() {
  const modal = document.createElement('div');
  modal.className = 'logout-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'logout-title');
  modal.setAttribute('aria-modal', 'true');
  
  modal.innerHTML = `
    <div class="logout-modal-overlay"></div>
    <div class="logout-modal-content">
      <h2 id="logout-title">Abmelden</h2>
      <p>Möchten Sie sich wirklich abmelden?</p>
      <div class="logout-modal-buttons">
        <button class="modal-btn modal-btn-cancel" aria-label="Abbrechen">Abbrechen</button>
        <button class="modal-btn modal-btn-confirm" aria-label="Abmelden bestätigen">Abmelden</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus the confirm button
  const confirmBtn = modal.querySelector('.modal-btn-confirm');
  confirmBtn.focus();
  
  return new Promise((resolve) => {
    // Handle Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
      }
    };
    
    const cleanup = () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.removeChild(modal);
    };
    
    modal.querySelector('.modal-btn-confirm').onclick = () => {
      cleanup();
      resolve(true);
    };
    
    modal.querySelector('.modal-btn-cancel').onclick = () => {
      cleanup();
      resolve(false);
    };
    
    modal.querySelector('.logout-modal-overlay').onclick = () => {
      cleanup();
      resolve(false);
    };
    
    document.addEventListener('keydown', handleEscape);
  });
}

export function renderNavigation(currentPage = '') {
  const nav = document.createElement('nav');
  nav.className = 'main-nav';
  nav.setAttribute('aria-label', 'Hauptnavigation');
  
  const navList = document.createElement('ul');
  navList.className = 'nav-list';
  
  // Add menu items
  NAV_ITEMS.forEach(item => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    
    // Mark current page as active
    if (currentPage && item.href === currentPage) {
      li.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
    
    li.appendChild(a);
    navList.appendChild(li);
  });
  
  // Add logout button
  const logoutLi = document.createElement('li');
  logoutLi.className = 'nav-item nav-logout';
  
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Abmelden';
  logoutBtn.className = 'logout-btn';
  logoutBtn.setAttribute('aria-label', 'Vom System abmelden');
  logoutBtn.onclick = async (e) => {
    e.preventDefault();
    const confirmed = await createLogoutModal();
    if (confirmed) {
      logout();
    }
  };
  
  logoutLi.appendChild(logoutBtn);
  navList.appendChild(logoutLi);
  
  nav.appendChild(navList);
  
  return nav;
}

export function initNavigation(currentPage = '') {
  const navContainer = document.getElementById('nav-container');
  if (navContainer) {
    const nav = renderNavigation(currentPage);
    navContainer.appendChild(nav);
  }
}
