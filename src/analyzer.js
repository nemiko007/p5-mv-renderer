/**
 * p5.js sketch for analyzing audio and exporting metadata.
 * This script runs in "Analyzer Mode". (p5.js v2.0 compatible)
 */
export const sketch = (p) => {
    // --- Configuration ---
    const TARGET_FPS = 60;
    const AUDIO_PATH = "/nknk.mp3"; // Make sure this file exists in /public

    // --- State ---
    let sound;
    let fft;
    let amplitude;
    const audioData = [];
    let isPlaying = false;
    let hasFinished = false;
    let isSaving = false;
    let isReady = false; // Flag to indicate if setup is complete

    /**
     * Initializes the canvas and audio processing objects.
     * This is now an async function to handle asset loading.
     */
    p.setup = async () => {
        p.createCanvas(1280, 720);
        p.frameRate(TARGET_FPS);
        p.textAlign(p.CENTER, p.CENTER);

        // --- Load Audio Asynchronously ---
        drawStatusUI('Loading audio file...');
        try {
            // Promisify p.loadSound
            sound = await new Promise((resolve, reject) => {
                p.loadSound(AUDIO_PATH, resolve, (err) => reject(new Error(err.message)));
            });
            console.log("Audio loaded successfully!");
        } catch (error) {
            console.error("Failed to load audio:", error);
            drawStatusUI('❌ Error: Failed to load audio file.\nCheck console and file path.', '#ff4d4d');
            p.noLoop();
            return;
        }

        // Initialize p5.sound objects
        fft = new p5.FFT(0.8, 1024);
        amplitude = new p5.Amplitude();

        isReady = true; // Signal that setup is complete
        drawInitialUI();
    };

    /**
     * Main draw loop for analysis and visualization.
     */
    p.draw = () => {
        p.background(30);
        if (!isReady) return; // Don't do anything if setup hasn't finished

        if (hasFinished) {
            drawStatusUI('✅ Saved audio-metadata.json', '#0f5');
            p.noLoop();
            return;
        }

        if (!isPlaying) {
            drawInstructions();
            return;
        }

        // --- Data Collection ---
        collectAudioData();

        // --- Live Visualization ---
        drawVisualization();

        // --- End Condition ---
        if (!sound.isPlaying() && isPlaying && !isSaving) {
            if (audioData.length > 10) { // Check if we have some data
                console.log("Playback finished!");
                saveAudioData(); // Auto-save on completion
            }
        }
    };
    
    const collectAudioData = () => {
        const spectrum = fft.analyze();
        audioData.push({
            frame: p.frameCount,
            level: amplitude.getLevel(),
            bass: fft.getEnergy("bass"),
            mid: fft.getEnergy("mid"),
            treble: fft.getEnergy("treble"),
            fullSpectrum: Array.from(spectrum),
        });
    };

    p.mousePressed = () => {
        if (!isReady || hasFinished) return;
        if (!isPlaying) {
            // Reset frameCount on play to match data array index
            p.frameCount = 0; 
            sound.play();
            isPlaying = true;
        }
    };

    p.keyPressed = () => {
        if (p.key.toLowerCase() === "s") saveAudioData();
        if (p.key.toLowerCase() === "p") togglePlayback();
    };

    const togglePlayback = () => {
        if (!isReady || hasFinished) return;
        if (sound.isPlaying()) {
            sound.pause();
            isPlaying = false;
        } else {
            sound.play();
            isPlaying = true;
        }
    };

    const saveAudioData = () => {
        if (isSaving || audioData.length === 0) return;
        
        isSaving = true;
        isPlaying = false;
        if (sound.isPlaying()) sound.stop();

        console.log(`Saving ${audioData.length} frames of audio data...`);
        const jsonOutput = {
            targetFps: TARGET_FPS,
            durationInFrames: audioData.length,
            data: audioData,
        };
        p.saveJSON(jsonOutput, "audio-metadata.json");
        hasFinished = true; // Set flag to show completion message
    };

    // --- UI & Visualization Functions ---
    const drawStatusUI = (message, color = '#fff') => {
        p.background(30);
        p.fill(color);
        p.textSize(24);
        p.text(message, p.width / 2, p.height / 2);
    };
    
    const drawInitialUI = () => {
        p.background(30);
        p.fill(255);
        p.textSize(28);
        p.text("Analyzer Mode", p.width / 2, p.height / 2 - 100);
        p.textSize(20);
        p.text("Audio loaded. Click to start analysis.", p.width / 2, p.height / 2);
    };

    const drawInstructions = () => {
        if (!isReady) return;
        let txt = "▶ Click to Play";
        if (sound.isPaused()) txt = "⏸ Paused. Click to resume.";
        
        drawInitialUI(); // Re-draw the main text
        p.fill(200);
        p.textSize(18);
        p.text(txt, p.width / 2, p.height - 100);
        p.text("Press 'P' to Play/Pause | Press 'S' to Save JSON", p.width / 2, p.height - 60);
    };

    const drawVisualization = () => {
        const { level, bass, mid, treble } = audioData[audioData.length - 1];
        const w = p.width * 0.8;
        const x = p.width * 0.1;

        p.fill(255);
        p.noStroke();
        p.textSize(20);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`Frame: ${p.frameCount} | Data Points: ${audioData.length}`, 20, 20);
        p.textAlign(p.CENTER, p.CENTER);

        // Level
        p.fill(0, 255, 0); p.rect(x, 150, level * w, 20); p.text("Level", x - 40, 160);
        // Bass, Mid, Treble
        p.fill(255, 0, 0); p.rect(x, 180, (bass / 255) * w, 20); p.text("Bass", x - 40, 190);
        p.fill(0, 255, 255); p.rect(x, 210, (mid / 255) * w, 20); p.text("Mid", x - 40, 220);
        p.fill(255, 255, 0); p.rect(x, 240, (treble / 255) * w, 20); p.text("Treble", x - 40, 250);
    };
};