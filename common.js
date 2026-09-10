/**
 * Mini Tools - Common JavaScript Module
 * Handles theme persistence (Dark/Light mode), active navigation detection, and shared toast notifications.
 */

// 1. Toast Notification Utility (Safe DOM creation)
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconSpan = document.createElement('span');
  iconSpan.textContent = type === 'success' ? '✓' : '💬';
  toast.appendChild(iconSpan);

  const textNode = document.createTextNode(` ${message}`);
  toast.appendChild(textNode);

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// 2. Theme Management
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('ui_theme');

  if (savedTheme === 'light') {
    document.body.className = 'light-theme';
  } else {
    document.body.className = 'dark-theme';
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      document.body.classList.toggle('dark-theme');

      const isLight = document.body.classList.contains('light-theme');
      localStorage.setItem('ui_theme', isLight ? 'light' : 'dark');
      showToast(`${isLight ? '라이트' : '다크'} 모드로 전환되었습니다.`, 'info');
    });
  }
}

// 3. Active Navigation Synchronization
function initNavigation() {
  const pathname = window.location.pathname.toLowerCase();
  const navHome = document.getElementById('nav-home');
  const navName = document.getElementById('nav-name-generator');
  const navPalette = document.getElementById('nav-color-palette');

  // Reset all
  [navHome, navName, navPalette].forEach(nav => {
    if (nav) {
      nav.classList.remove('active');
      nav.removeAttribute('aria-current');
    }
  });

  if (pathname.includes('name-generator')) {
    if (navName) {
      navName.classList.add('active');
      navName.setAttribute('aria-current', 'page');
    }
  } else if (pathname.includes('color-palette')) {
    if (navPalette) {
      navPalette.classList.add('active');
      navPalette.setAttribute('aria-current', 'page');
    }
  } else {
    if (navHome) {
      navHome.classList.add('active');
      navHome.setAttribute('aria-current', 'page');
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
});
