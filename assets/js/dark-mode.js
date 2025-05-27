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
  toggleButton.innerHTML = savedTheme === 'dark' ? '<i class="fa fa-sun"></i>' : '<i class="fa fa-moon"></i>';
  document.body.prepend(toggleButton);

  // Toggle theme on button click
  toggleButton.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button icon
    toggleButton.innerHTML = newTheme === 'dark' ? '<i class="fa fa-sun"></i>' : '<i class="fa fa-moon"></i>';
  });
}); 