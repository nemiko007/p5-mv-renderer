/**
 * p5.js sketch for rendering a video from audio metadata.
 * This script runs in "Renderer Mode".
 */
export const sketch = (p) => {
  // --- Configuration ---
  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1080;
  const METADATA_PATH = '/audio-metadata.json'; // Assumes this file exists in /public

  // --- State ---
  let audioInfo;
  let capturer;
  let hasFinished = false;

  /**
   * Preloads the analyzed audio data.
   */
  p.preload = () => {
    p.loadJSON(
      METADATA_PATH,
      (data) => {
        console.log('Successfully loaded audio-metadata.json');
        audioInfo = data;
      },
      (err) => {
        console.error('Failed to load audio-metadata.json.', err);
        audioInfo = null; // Mark as failed
      }
    );
  };

  /**
   * Initializes the canvas and CCapture.js.
   */
  p.setup = () => {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pixelDensity(1); // Crucial for clean capture
    p.noStroke();

    // If data loading failed, stop immediately.
    if (!audioInfo) {
      p.background(50, 0, 0);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(32);
      const errorMessage = `ERROR: audio-metadata.json not found in /public folder.\n\nPlease run Analyzer mode first to generate and place the file there.`;
      p.text(errorMessage, p.width / 2, p.height / 2);
      p.noLoop();
      return;
    }

    // --- CCapture.js Setup ---
    // CCapture is loaded via CDN, so it's available globally.
    capturer = new CCapture({
      format: 'png',
      framerate: audioInfo.targetFps || 60,
      name: 'p5-mv-render',
      quality: 100,
      verbose: true,
    });

    capturer.start();
    console.log('Renderer setup complete. Starting capture...');
  };

  /**
   * Main draw loop for rendering frames.
   */
  p.draw = () => {
    if (!audioInfo || hasFinished) return;

    const frameIndex = p.frameCount - 1; // p5's frameCount is 1-based

    // Check for completion
    if (frameIndex >= audioInfo.durationInFrames) {
      finishRendering();
      return;
    }

    // Get data for the current frame
    const frameData = audioInfo.data[frameIndex];
    if (!frameData) {
      console.warn(`No data for frame index: ${frameIndex}. Finishing early.`);
      finishRendering();
      return;
    }

    // --- Main Visualization Logic ---
    drawVisuals(frameData);
    
    // --- Progress Indicator ---
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    const progressText = `Rendering Frame: ${p.frameCount} / ${audioInfo.durationInFrames}`;
    p.text(progressText, 20, 20);

    // --- Capture Frame ---
    capturer.capture(p.canvas);
  };

  /**
   * The actual drawing function, separated for clarity.
   * @param {object} frameData - The audio data for the current frame.
   */
  const drawVisuals = (frameData) => {
    const { level, bass, mid, treble } = frameData;
    p.background(20, 10, 30); // Dark purple background

    // Pulsing center circle based on overall level
    const circleSize = p.map(level, 0, 1, 150, p.height * 0.8);
    p.fill(255, 255, 255, 40);
    p.ellipse(p.width / 2, p.height / 2, circleSize, circleSize);

    // Bars for frequency energies that rise from the bottom
    const barWidth = 250;
    const bassHeight = p.map(bass, 0, 255, 0, p.height * 0.9);
    p.fill(255, 80, 80, 200); // Bass - Red
    p.rect(p.width / 2 - barWidth * 1.5 - 20, p.height - bassHeight, barWidth, bassHeight);
    
    const midHeight = p.map(mid, 0, 255, 0, p.height * 0.9);
    p.fill(80, 255, 200, 200); // Mid - Cyan/Green
    p.rect(p.width / 2 - barWidth / 2, p.height - midHeight, barWidth, midHeight);

    const trebleHeight = p.map(treble, 0, 255, 0, p.height * 0.9);
    p.fill(255, 255, 80, 200); // Treble - Yellow
    p.rect(p.width / 2 + barWidth / 2 + 20, p.height - trebleHeight, barWidth, trebleHeight);
  };

  /**
   * Finalizes the rendering process.
   */
  const finishRendering = () => {
    if (hasFinished) return;
    
    console.log('All frames rendered. Stopping and saving...');
    hasFinished = true;
    p.noLoop();
    capturer.stop();
    capturer.save(); // Triggers the .tar file download

    // Final completion message on canvas
    p.background(10, 50, 20);
    p.fill(180, 255, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('✅ Rendering Complete!', p.width / 2, p.height / 2 - 40);
    p.textSize(28);
    p.text('Check your downloads for the .tar file.', p.width / 2, p.height / 2 + 40);
  };
};
