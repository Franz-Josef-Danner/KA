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

export function renderNavigation(currentPage = '') {
  const nav = document.createElement('nav');
  nav.className = 'main-nav';
  
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
  logoutBtn.onclick = (e) => {
    e.preventDefault();
    if (confirm('Möchten Sie sich wirklich abmelden?')) {
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
