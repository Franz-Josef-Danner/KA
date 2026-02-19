// -----------------------------
// Navigation Module
// -----------------------------
import { logout, isAdmin } from './auth.js';

const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: 'dashboard.html' },
  { label: 'Firmenliste', href: 'firmenliste.html' },
  { label: 'Artikellisten', href: 'artikellisten.html' },
  { label: 'Aufträge', href: 'auftraege.html' },
  { label: 'Rechnungen', href: 'rechnungen.html' },
  { label: 'Ausgaben', href: 'ausgaben.html' },
  { label: 'Kampagnen', href: 'kampagnen.html' },
  { label: 'Kundenbereiche', href: 'kundenbereiche.html' },
  { label: 'Einstellungen', href: 'einstellungen.html' }
];

const MOBILE_ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: 'dashboard.html' },
  { label: 'Aufträge', href: 'auftraege.html' },
  { label: 'Rechnungen', href: 'rechnungen.html' },
  { label: 'Kundenbereich', href: 'kundenbereiche.html' },
  { label: 'Einstellungen', href: 'einstellungen.html' }
];

function isMobileDevice() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function shouldUseMobileNav() {
  return isAdmin() && isMobileDevice();
}

const CUSTOMER_NAV_ITEMS = [
  { label: 'Mein Kundenbereich', href: 'kundenbereich.html' }
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
  
  // Get focusable elements
  const cancelBtn = modal.querySelector('.modal-btn-cancel');
  const confirmBtn = modal.querySelector('.modal-btn-confirm');
  
  // Guard against missing elements
  if (!cancelBtn || !confirmBtn) {
    console.error('Modal buttons not found');
    document.body.removeChild(modal);
    return Promise.resolve(false);
  }
  
  const focusableElements = [cancelBtn, confirmBtn];
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  // Focus trap implementation
  const trapFocus = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  };
  
  // Focus the cancel button (safer, non-destructive default)
  cancelBtn.focus();
  
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
      document.removeEventListener('keydown', trapFocus);
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
    document.addEventListener('keydown', trapFocus);
  });
}

export function renderNavigation(currentPage = '') {
  const nav = document.createElement('nav');
  nav.className = 'main-nav';
  nav.setAttribute('aria-label', 'Hauptnavigation');
  
  const navList = document.createElement('ul');
  navList.className = 'nav-list';
  
  // Select appropriate menu items based on user role and device
  const mobile = shouldUseMobileNav();
  if (mobile) {
    nav.classList.add('mobile');
  }
  const navItems = isAdmin()
    ? (mobile ? MOBILE_ADMIN_NAV_ITEMS : ADMIN_NAV_ITEMS)
    : CUSTOMER_NAV_ITEMS;
  
  // Add menu items
  navItems.forEach(item => {
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
    if (shouldUseMobileNav()) {
      document.body.classList.add('mobile-nav-active');
    }
    const nav = renderNavigation(currentPage);
    navContainer.appendChild(nav);
  }
}
