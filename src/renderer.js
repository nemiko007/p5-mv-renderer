/**
 * p5.js sketch for rendering a video from audio metadata.
 * This script runs in "Renderer Mode". (p5.js v2.0 compatible)
 */
export const sketch = (p) => {
  // --- Configuration ---
  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1080;
  const METADATA_PATH = '/audio-metadata.json'; // Assumes this file is in /public

  // --- State ---
  let audioInfo;
  let capturer;
  let hasFinished = false;

  /**
   * Initializes the canvas and CCapture.js.
   * This is now an async function to handle asset loading.
   */
  p.setup = async () => {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pixelDensity(1); // Crucial for clean capture
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);

    // --- Load JSON Asynchronously ---
    drawStatusUI('Loading audio-metadata.json...');
    try {
        audioInfo = await new Promise((resolve, reject) => {
            p.loadJSON(METADATA_PATH, resolve, (err) => reject(new Error(err.message)));
        });
        console.log("Successfully loaded audio-metadata.json");
    } catch (error) {
        console.error("Failed to load audio-metadata.json.", error);
        const errorMessage = `❌ ERROR: audio-metadata.json not found.\n\nPlease run Analyzer mode first to generate it, \nand place the downloaded file in the /public folder.`;
        drawStatusUI(errorMessage, '#ff4d4d');
        p.noLoop();
        return;
    }

    // --- CCapture.js Setup ---
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

    if (frameIndex >= audioInfo.durationInFrames) {
      finishRendering();
      return;
    }

    const frameData = audioInfo.data[frameIndex];
    if (!frameData) {
      console.warn(`No data for frame index: ${frameIndex}. Finishing early.`);
      finishRendering();
      return;
    }

    // --- Main Visualization & Capture ---
    drawVisuals(frameData);
    drawProgress();
    capturer.capture(p.canvas);
  };
  
  // --- Helper & Drawing Functions ---

  const drawStatusUI = (message, color = '#fff') => {
    p.background(30);
    p.fill(color);
    p.textSize(32);
    p.text(message, p.width / 2, p.height / 2);
  };

  const drawVisuals = (frameData) => {
    const { level, bass, mid, treble } = frameData;
    p.background(20, 10, 30);

    const circleSize = p.map(level, 0, 1, 150, p.height * 0.8);
    p.fill(255, 255, 255, 40);
    p.ellipse(p.width / 2, p.height / 2, circleSize, circleSize);

    const barWidth = 250;
    const bassHeight = p.map(bass, 0, 255, 0, p.height * 0.9);
    p.fill(255, 80, 80, 200);
    p.rect(p.width / 2 - barWidth * 1.5 - 20, p.height - bassHeight, barWidth, bassHeight);
    
    const midHeight = p.map(mid, 0, 255, 0, p.height * 0.9);
    p.fill(80, 255, 200, 200);
    p.rect(p.width / 2 - barWidth / 2, p.height - midHeight, barWidth, midHeight);

    const trebleHeight = p.map(treble, 0, 255, 0, p.height * 0.9);
    p.fill(255, 255, 80, 200);
    p.rect(p.width / 2 + barWidth / 2 + 20, p.height - trebleHeight, barWidth, trebleHeight);
  };

  const drawProgress = () => {
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    const progressText = `Rendering Frame: ${p.frameCount} / ${audioInfo.durationInFrames}`;
    p.text(progressText, 20, 20);
  };

  const finishRendering = () => {
    if (hasFinished) return;
    
    console.log('All frames rendered. Stopping and saving...');
    hasFinished = true;
    p.noLoop();
    capturer.stop();
    capturer.save();

    drawStatusUI('✅ Rendering Complete!\nCheck your downloads for the .tar file.', '#8f8');
  };
};