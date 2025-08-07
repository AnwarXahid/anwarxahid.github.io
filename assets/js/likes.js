document.addEventListener('DOMContentLoaded', function() {
  var button = document.getElementById('like-button');
  var countSpan = document.getElementById('like-count');
  if (!button || !countSpan) return;

  var storageKey = 'likes_' + window.location.pathname;
  var count = parseInt(localStorage.getItem(storageKey), 10) || 0;
  countSpan.textContent = count;

  button.addEventListener('click', function() {
    count += 1;
    localStorage.setItem(storageKey, count);
    countSpan.textContent = count;
  });
});
