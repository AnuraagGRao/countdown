// ─────────────────────────────────────────
// Keyboard Shortcuts
// ─────────────────────────────────────────
(function initKeyboardShortcuts() {
  const modal = document.getElementById('shortcuts-modal');
  const closeBtn = modal?.querySelector('.shortcuts-close');
  const searchInput = document.getElementById('search-input');

  function showShortcuts() {
    if (modal) {
      modal.hidden = false;
      modal.removeAttribute('hidden');
    }
  }

  function hideShortcuts() {
    if (modal) {
      modal.hidden = true;
      modal.setAttribute('hidden', '');
    }
  }

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ? - Show shortcuts
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        showShortcuts();
      }
    }

    // / - Focus search
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInput?.focus();
      }
    }

    // Escape - Close modals
    if (e.key === 'Escape') {
      hideShortcuts();
      const searchResults = document.getElementById('search-results');
      if (searchResults) searchResults.hidden = true;
    }
  });

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', hideShortcuts);
  }

  // Click outside to close
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideShortcuts();
    });
  }
})();
