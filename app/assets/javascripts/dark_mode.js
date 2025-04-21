// Dark mode functionality
document.addEventListener('DOMContentLoaded', function() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  // Check if user preference exists and apply it
  if(localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark-mode');
    if(darkModeToggle) darkModeToggle.checked = true;
  }
  
  // Set up toggle functionality
  if(darkModeToggle) {
    darkModeToggle.addEventListener('change', function() {
      if(this.checked) {
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
      }
    });
  }
});
