// Theme initialization script - runs before React hydration to prevent flash
(function() {
  try {
    var stored = localStorage.getItem('specboard-settings');
    if (stored) {
      var settings = JSON.parse(stored);
      var theme = settings.theme;
      if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.classList.add(theme);
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(systemTheme);
      document.documentElement.setAttribute('data-theme', systemTheme);
    }
  } catch (e) {
    var fallback = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.classList.add(fallback);
    document.documentElement.setAttribute('data-theme', fallback);
  }
})();
