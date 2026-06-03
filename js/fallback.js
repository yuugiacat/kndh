document.addEventListener('error', function (e) {
  var fallbackImg = 'assets/images/default.png';

  // Fallback for missing images
  if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
    if (!e.target.src.includes(fallbackImg)) {
      e.target.src = fallbackImg;
    }
  }

}, true);
