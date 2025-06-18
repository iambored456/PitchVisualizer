// js/services/PitchService.js
import * as Tone from 'tone';
import { PitchDetector } from 'pitchy';
import store from '../store.js';

// --- Configuration ---
// REFRESH_INTERVAL_MS is no longer needed with requestAnimationFrame
const config = {
    FFT_SIZE: 2048,
    CLARITY_THRESHOLD: 0.80,
    MIN_PITCH_HZ: 60,
    MAX_PITCH_HZ: 1600,
    STABILITY_THRESHOLD: 15,
    HIGHLIGHT_FADE_SPEED: 0.2,
    MIN_VOLUME_DB: -60
};

// --- Module State ---
let mic, analyser, detector;
let animationFrameId = null; // Use this to control the loop

let stablePitchClass = -1, stablePitchCounter = 0, targetOpacity = 0, targetSize = 1.0;

function frequencyToMidi(frequency) {
    return 12 * Math.log2(frequency / 440) + 69;
}

// --- Combined Detection and Animation Loop ---
function animationLoop() {
  if (!store.state.isDetecting || !analyser || !detector) {
      animationFrameId = null;
      return;
  }
  
  // 1. Get the pitch
  const waveform = analyser.getValue();
  const [pitch, clarity] = detector.findPitch(waveform, Tone.context.sampleRate);
  let isValidPitch = pitch && clarity > config.CLARITY_THRESHOLD && pitch > config.MIN_PITCH_HZ && pitch < config.MAX_PITCH_HZ;

  // 2. Update the store (this will trigger the redraw)
  if (isValidPitch) {
    const midi = frequencyToMidi(pitch);
    store.setDetectedPitch({ frequency: pitch, clarity: clarity, midi: midi, pitchClass: Math.round(midi) % 12 });
    store.addPitchHistoryPoint({ frequency: pitch, midi: midi, time: performance.now(), clarity: clarity });
  } else {
    store.addPitchHistoryPoint({ frequency: 0, midi: 0, time: performance.now(), clarity: 0 });
  }
  
  // ... (Stability highlighting logic remains the same) ...
  const currentPitchClass = isValidPitch ? Math.round(store.state.detectedPitch.midi) % 12 : -1;
  if (currentPitchClass === stablePitchClass && currentPitchClass !== -1) stablePitchCounter++;
  else { stablePitchCounter = 0; stablePitchClass = currentPitchClass; }
  targetOpacity = (stablePitchCounter >= config.STABILITY_THRESHOLD) ? 1 : 0;
  targetSize = (stablePitchCounter >= config.STABILITY_THRESHOLD) ? 1.05 : 1.0;
  const currentStable = store.state.stablePitch;
  const newOpacity = currentStable.opacity + (targetOpacity - currentStable.opacity) * config.HIGHLIGHT_FADE_SPEED;
  const newSize = currentStable.size + (targetSize - currentStable.size) * config.HIGHLIGHT_FADE_SPEED;
  store.setStablePitch(stablePitchClass, newOpacity, newSize);

  // 3. Request the next frame
  animationFrameId = requestAnimationFrame(animationLoop);
}

async function startDetection() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  mic = new Tone.UserMedia(config.MIN_VOLUME_DB);
  analyser = new Tone.Analyser('waveform', config.FFT_SIZE);
  detector = PitchDetector.forFloat32Array(analyser.size);
  
  try {
    await mic.open();
    mic.connect(analyser);
    // Start the animation loop
    animationLoop();
  } catch (err) {
    console.error("Microphone access denied or failed.", err);
    store.toggleIsDetecting(); 
  }
}

function stopDetection() {
  if (mic) mic.close();
  // Stop the animation loop
  if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
  }
  stablePitchCounter = 0;
  stablePitchClass = -1;
  store.setStablePitch(-1, 0, 1.0);
}

export function initializePitchService() {
  store.on('isDetectingChanged', (isDetecting) => {
    isDetecting ? startDetection() : stopDetection();
  });
}