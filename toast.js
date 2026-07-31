// ─────────────────────────────────────────
// Toast Notifications
// ─────────────────────────────────────────

class ToastManager {
  constructor() {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
  }

  createContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    return container;
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    
    const icon = this.getIcon(type);
    const iconEl = document.createElement('span');
    iconEl.className = 'toast__icon';
    iconEl.textContent = icon;
    
    const messageEl = document.createElement('span');
    messageEl.className = 'toast__message';
    messageEl.textContent = message;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast__close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.onclick = () => this.remove(toast);
    
    toast.append(iconEl, messageEl, closeBtn);
    this.container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }
    
    return toast;
  }

  remove(toast) {
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--removing');
    
    setTimeout(() => {
      toast.remove();
    }, 300); // Match CSS transition duration
  }

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Initialize toast manager globally
window.toast = new ToastManager();
