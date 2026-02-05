/**
 * p5.js sketch for analyzing audio and exporting metadata.
 * This script runs in "Analyzer Mode".
 */
export const sketch = (p) => {
    // --- Configuration ---
    const TARGET_FPS = 60;
    const AUDIO_PATH = "/nknk.mp3"; // Vite serves files from `public` at the root.

    // --- State ---
    let sound;
    let fft;
    let amplitude;
    const audioData = [];
    let isPlaying = false;
    let hasFinished = false;
    let isSaving = false;

    /**
     * Preloads the audio file before setup.
     */
    p.preload = () => {
        // p5.sound is loaded via CDN, so it attaches to the global p5 object.
        // We can use p.loadSound thanks to p5's instance mode handling.
        p.soundFormats("mp3", "wav");
        sound = p.loadSound(AUDIO_PATH);
    };

    /**
     * Initializes the canvas and audio processing objects.
     */
    p.setup = () => {
        p.createCanvas(1280, 720);
        p.frameRate(TARGET_FPS);

        // Initialize p5.sound objects in instance mode
        fft = new p5.FFT(0.8, 1024);
        amplitude = new p5.Amplitude();

        // Initial UI
        drawInitialUI();
    };

    /**
     * Main draw loop for analysis and visualization.
     */
    p.draw = () => {
        p.background(30);

        if (!isPlaying || hasFinished) {
            // Show instructions if not playing
            drawInstructions();
            return;
        }

        // --- Data Collection ---
        const spectrum = fft.analyze();
        audioData.push({
            frame: p.frameCount,
            level: amplitude.getLevel(),
            bass: fft.getEnergy("bass"),
            mid: fft.getEnergy("mid"),
            treble: fft.getEnergy("treble"),
            fullSpectrum: Array.from(spectrum), // Convert TypedArray to a regular array
        });

        // --- Live Visualization ---
        drawVisualization();

        // --- End Condition ---
        // Check if the sound has finished playing naturally
        if (!sound.isPlaying() && isPlaying && !isSaving) {
            // A small frame buffer helps prevent premature stops
            if (p.frameCount > 10) {
                console.log("Playback finished!");
                hasFinished = true;
                isPlaying = false;
                saveAudioData(); // Auto-save on completion
            }
        }
    };

    /**
     * Handles user input for starting/stopping playback.
     */
    p.mousePressed = () => {
        if (hasFinished) return;
        if (sound.isLoaded() && !isPlaying) {
            sound.play();
            isPlaying = true;
        }
    };

    /**
     * Handles keyboard shortcuts.
     */
    p.keyPressed = () => {
        if (p.key.toLowerCase() === "s") {
            saveAudioData();
        }
        if (p.key.toLowerCase() === "p") {
            togglePlayback();
        }
    };

    /**
     * Toggles audio playback between play and pause.
     */
    const togglePlayback = () => {
        if (hasFinished) return;
        if (sound.isPlaying()) {
            sound.pause();
            isPlaying = false;
        } else {
            sound.play();
            isPlaying = true;
        }
    };

    /**
     * Saves the collected audio data to a JSON file.
     */
    const saveAudioData = () => {
        if (isSaving || audioData.length === 0) {
            console.warn("Save aborted. Already saving or no data collected.");
            return;
        }
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
        console.log("File saved!");

        // Update UI to show completion
        p.background(30);
        p.fill(0, 255, 150);
        p.text("✅ Saved audio-metadata.json", p.width / 2, p.height / 2);

        hasFinished = true;
    };

    // --- UI & Visualization Functions ---

    const drawInitialUI = () => {
        p.background(30);
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(28);
        p.text("Analyzer Mode", p.width / 2, p.height / 2 - 100);
        p.textSize(20);
        p.text("Click to start playback.", p.width / 2, p.height / 2);
    };

    const drawInstructions = () => {
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(18);
        let txt = "▶ Click to Play";
        if (sound.isPaused()) {
            txt = "⏸ Paused. Click to resume.";
        }
        p.text(txt, p.width / 2, p.height - 100);
        p.text(
            "Press 'P' to Play/Pause | Press 'S' to Save JSON",
            p.width / 2,
            p.height - 60,
        );
    };

    const drawVisualization = () => {
        const { level, bass, mid, treble } = audioData[audioData.length - 1];
        const w = p.width * 0.8;
        const x = p.width * 0.1;

        p.fill(255);
        p.noStroke();
        p.textSize(20);
        p.textAlign(p.LEFT, p.TOP);
        p.text(
            `Frame: ${p.frameCount} | Data Points: ${audioData.length}`,
            20,
            20,
        );
        p.textAlign(p.CENTER, p.CENTER);

        // Level
        p.fill(0, 255, 0);
        p.rect(x, 150, level * w, 20);
        p.text("Level", x - 40, 160);

        // Bass, Mid, Treble
        p.fill(255, 0, 0);
        p.rect(x, 180, (bass / 255) * w, 20);
        p.text("Bass", x - 40, 190);

        p.fill(0, 255, 255);
        p.rect(x, 210, (mid / 255) * w, 20);
        p.text("Mid", x - 40, 220);

        p.fill(255, 255, 0);
        p.rect(x, 240, (treble / 255) * w, 20);
        p.text("Treble", x - 40, 250);
    };
};
