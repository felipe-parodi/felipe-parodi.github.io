// Dark mode functionality
document.addEventListener('DOMContentLoaded', () => {
  // Force dark mode if no preference is saved
  // if (!localStorage.getItem('theme')) {
  //   localStorage.setItem('theme', 'dark');
  // }
  
  // Apply the theme
  const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light if nothing is saved
  document.documentElement.setAttribute('data-theme', savedTheme);

  const toggleButton = document.getElementById('theme-toggle');

  if (toggleButton) {
    const updateButtonIcon = (theme) => {
      if (theme === 'dark') {
        toggleButton.innerHTML = '<i class="fa fa-sun-o" aria-hidden="true"></i>';
        toggleButton.setAttribute('title', 'Switch to light mode');
      } else {
        toggleButton.innerHTML = '<i class="fa fa-moon-o" aria-hidden="true"></i>';
        toggleButton.setAttribute('title', 'Switch to dark mode');
      }
      setTimeout(() => {
        const icon = toggleButton.querySelector('i');
        if (icon && getComputedStyle(icon, ':before').content === 'none') {
          toggleButton.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        }
      }, 100);
    };

    updateButtonIcon(savedTheme);

    toggleButton.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateButtonIcon(newTheme);
    });
  }
}); 