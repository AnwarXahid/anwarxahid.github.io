document.addEventListener('DOMContentLoaded', function () {
  var navLinks = document.querySelectorAll('#site-nav .visible-links a');
  var currentPath = window.location.pathname.replace(/\/$/, '');

  // If we're on the homepage, do nothing
  if (currentPath === '' || currentPath === '/') {
    return;
  }

  navLinks.forEach(function (link) {
    var linkPath = link.getAttribute('href').replace(/\/$/, '');
    if (linkPath !== '' && linkPath !== '/' && currentPath.startsWith(linkPath)) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
});
