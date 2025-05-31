// Dark mode functionality
document.addEventListener('DOMContentLoaded', () => {
  // Force dark mode if no preference is saved
  if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'dark');
  }
  
  // Apply the theme
  const savedTheme = localStorage.getItem('theme');
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Create and append theme toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'theme-toggle';
  toggleButton.setAttribute('aria-label', 'Toggle dark mode');
  
  // Function to update button icon and content
  const updateButtonIcon = (theme) => {
    if (theme === 'dark') {
      // In dark mode, show sun icon (to switch to light)
      toggleButton.innerHTML = '<i class="fa fa-sun-o" aria-hidden="true"></i>';
      toggleButton.setAttribute('title', 'Switch to light mode');
    } else {
      // In light mode, show moon icon (to switch to dark)
      toggleButton.innerHTML = '<i class="fa fa-moon-o" aria-hidden="true"></i>';
      toggleButton.setAttribute('title', 'Switch to dark mode');
    }
    
    // Fallback: if Font Awesome doesn't load, use Unicode symbols
    setTimeout(() => {
      const icon = toggleButton.querySelector('i');
      if (icon && getComputedStyle(icon, ':before').content === 'none') {
        toggleButton.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      }
    }, 100);
  };
  
  // Set initial icon
  updateButtonIcon(savedTheme);
  document.body.prepend(toggleButton);

  // Toggle theme on button click
  toggleButton.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button icon
    updateButtonIcon(newTheme);
  });
}); 