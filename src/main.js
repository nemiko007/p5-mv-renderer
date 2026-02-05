import p5 from 'p5';
import './style.css';

const appContainer = document.getElementById('app');

/**
 * Dynamically loads and starts the p5.js sketch based on the mode.
 * @param {'analyzer' | 'renderer'} mode - The mode to start.
 */
const startSketch = async (mode) => {
  // Clear the navigation UI before starting the sketch
  if (appContainer) {
    appContainer.innerHTML = '';
  }

  try {
    if (mode === 'analyzer') {
      console.log('Starting Analyzer Sketch... 🎶');
      const { sketch } = await import('./analyzer.js');
      new p5(sketch, appContainer);
    } else if (mode === 'renderer') {
      console.log('Starting Renderer Sketch... 🎥');
      const { sketch } = await import('./renderer.js');
      new p5(sketch, appContainer);
    }
  } catch (error) {
    console.error(`Failed to load sketch for mode: ${mode}`, error);
    if (appContainer) {
      appContainer.innerHTML = `<p style="color: red;">Error: Failed to load sketch. Check console for details.</p>`;
    }
  }
};

// --- Main Execution ---
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');

if (mode === 'analyzer' || mode === 'renderer') {
  // Wait for the DOM to be fully loaded before starting the sketch
  window.addEventListener('DOMContentLoaded', () => startSketch(mode));
} else {
  console.log('No mode selected. Displaying navigation.');
}