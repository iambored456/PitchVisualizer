// js/services/AudioService.js
import * as Tone from 'tone';
import store from '../store.js';

let synth;
let isInitialized = false;

function createDroneSynth() {
  // THE FIX:
  // - Changed oscillator type to 'sine' for a pure tone.
  // - Changed envelope attack to 0.02s for an immediate start.
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.02, release: 1 },
    volume: -24,
  }).toDestination();
}

function getMidiFromTonic(tonic, octave) {
    const parsableTonic = tonic.replace('♯', '#').replace('♭', 'b');
    return Tone.Frequency(parsableTonic + octave).toMidi();
}

function getDroneNotes(tonic, octave) {
  const tonicMidi = getMidiFromTonic(tonic, octave);
  if (isNaN(tonicMidi)) {
      console.error(`Could not parse tonic: ${tonic}${octave}`);
      return [];
  }
  return [Tone.Frequency(tonicMidi, 'midi').toNote()];
}

async function updateDrone() {
  if (!isInitialized || !synth) return;
  
  await Tone.start();
  const { isPlaying, octave, volume } = store.state.drone;
  const { tonic } = store.state;

  synth.volume.value = volume;
  
  // Ensure any previous sound is stopped before starting a new one.
  synth.releaseAll();

  if (isPlaying) {
    const notes = getDroneNotes(tonic, octave);
    if (notes.length === 0) {
        console.error("Aborting drone: Invalid notes calculated.");
        return;
    }
    synth.triggerAttack(notes, Tone.now());
  }
}

export function initializeAudio() {
  if (!isInitialized) {
    synth = createDroneSynth();
    store.on('droneShouldUpdate', updateDrone);
    
    isInitialized = true;
    console.log('AudioService Initialized.');
  }
}