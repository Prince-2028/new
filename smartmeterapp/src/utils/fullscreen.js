// Fullscreen utility functions

export const enterFullscreen = () => {
  const elem = document.documentElement;
  
  console.log('Attempting to enter fullscreen...');
  console.log('Current fullscreen element:', document.fullscreenElement);
  
  if (document.fullscreenElement) {
    console.log('Already in fullscreen mode');
    return Promise.resolve();
  }

  // Try different browser APIs
  if (elem.requestFullscreen) {
    console.log('Using standard requestFullscreen');
    return elem.requestFullscreen()
      .then(() => console.log('✓ Fullscreen entered successfully'))
      .catch(err => {
        console.error('✗ Fullscreen failed:', err);
        throw err;
      });
  } else if (elem.webkitRequestFullscreen) {
    console.log('Using webkit requestFullscreen');
    elem.webkitRequestFullscreen();
    return Promise.resolve();
  } else if (elem.mozRequestFullScreen) {
    console.log('Using moz requestFullScreen');
    elem.mozRequestFullScreen();
    return Promise.resolve();
  } else if (elem.msRequestFullscreen) {
    console.log('Using ms requestFullscreen');
    elem.msRequestFullscreen();
    return Promise.resolve();
  } else {
    console.error('Fullscreen API not supported');
    return Promise.reject(new Error('Fullscreen not supported'));
  }
};

export const exitFullscreen = () => {
  console.log('Attempting to exit fullscreen...');
  
  if (!document.fullscreenElement) {
    console.log('Not in fullscreen mode');
    return Promise.resolve();
  }

  if (document.exitFullscreen) {
    return document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
    return Promise.resolve();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
    return Promise.resolve();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
    return Promise.resolve();
  }
  
  return Promise.resolve();
};

export const isFullscreen = () => {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};
