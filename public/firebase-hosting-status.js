document.addEventListener('DOMContentLoaded', function () {
  const loadEl = document.querySelector('#load');

  if (!loadEl) {
    return;
  }

  try {
    const app = firebase.app();
    const features = [
      'auth',
      'database',
      'firestore',
      'functions',
      'messaging',
      'storage',
      'analytics',
      'remoteConfig',
      'performance',
    ].filter((feature) => typeof app[feature] === 'function');

    loadEl.textContent = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (error) {
    console.error(error);
    loadEl.textContent = 'Error loading the Firebase SDK, check the console.';
  }
});
