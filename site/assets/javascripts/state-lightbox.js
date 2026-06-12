function openLightbox(src) {
  var overlay = document.getElementById('lightbox-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.style.display = 'none';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '10000';
    overlay.style.background = 'rgba(0,0,0,0.85)';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.display = 'flex';
    overlay.innerHTML = '<button class="close-btn" aria-label="Close" onclick="closeLightbox()">×</button><img id="lightbox-img" src="" alt="" />';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeLightbox(); });
    document.body.appendChild(overlay);
  }
  var img = document.getElementById('lightbox-img');
  img.src = src;
  overlay.style.display = 'flex';
}
function closeLightbox() {
  var overlay = document.getElementById('lightbox-overlay');
  if (overlay) overlay.style.display = 'none';
}