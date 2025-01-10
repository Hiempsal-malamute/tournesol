// Initialize MapLibre
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [0, 0],
    zoom: 2,
  });
  
  const bottomPanel = document.getElementById('bottom-panel');
  const dragHandle = document.getElementById('drag-handle');
  
  let startY;
  let isDragging = false;
  const panelMinHeight = 200; // Default panel height
  const panelMaxHeight = window.innerHeight * 0.8; // 80% of screen height
  
  // Check if it's a mobile device
  function isMobileView() {
    return window.innerWidth < 768;
  }
  
  // Adjust panel snapping and ensure it stays within bounds
  function adjustMobilePanel() {
    const currentTransform = parseInt(
      window.getComputedStyle(bottomPanel).transform.split(',')[5] || 0
    );
  
    // If the panel is dragged more than halfway up, snap to max height (80%)
    if (currentTransform < -panelMaxHeight / 2) {
      bottomPanel.style.transform = `translateY(-${panelMaxHeight - panelMinHeight}px)`;
      bottomPanel.style.height = `${panelMaxHeight}px`;
    } else {
      // Snap back to the default closed height
      bottomPanel.style.transform = 'translateY(0)';
      bottomPanel.style.height = `${panelMinHeight}px`;
    }
  }
  
  // Dragging logic for mobile
  if (isMobileView()) {
    dragHandle.addEventListener('mousedown', (e) => {
      startY = e.clientY;
      isDragging = true;
      document.body.style.userSelect = 'none';
    });
  
    dragHandle.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    });
  
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      const newTransform = Math.min(0, Math.max(-panelMaxHeight + panelMinHeight, deltaY));
      bottomPanel.style.transform = `translateY(${newTransform}px)`;
    });
  
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const deltaY = e.touches[0].clientY - startY;
      const newTransform = Math.min(0, Math.max(-panelMaxHeight + panelMinHeight, deltaY));
      bottomPanel.style.transform = `translateY(${newTransform}px)`;
    });
  
    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.style.userSelect = '';
      adjustMobilePanel();
    });
  
    document.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      adjustMobilePanel();
    });
  }
  
  // Disable dragging and reset panel height for desktop
  window.addEventListener('resize', () => {
    if (!isMobileView()) {
      bottomPanel.style.transform = 'translateY(0)';
      bottomPanel.style.height = '100%';
      isDragging = false;
    } else {
      // Recalculate max height for mobile
      bottomPanel.style.height = `${panelMinHeight}px`;
    }
  });
  