// -----------------------------
// Kundenbereiche Search Module
// -----------------------------
import { render } from './kundenbereiche-render.js';
import { debounce } from '../utils/helpers.js';

let searchTerm = '';

export function getSearchTerm() {
  return searchTerm;
}

export function initSearch() {
  const searchInput = document.getElementById('search');
  if (!searchInput) return;

  const debouncedRender = debounce(() => {
    render();
  }, 300);

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase().trim();
    debouncedRender();
  });
}
