// js/components/PitchReadout.js
import store from '../store.js';

let detectorElem, pitchElem, noteElem, octaveElem;

// Updates the text in the readout display.
function updateDisplay(detectedPitch) {
  if (detectedPitch.clarity > 0.95) {
    detectorElem.classList.add('confident');
    detectorElem.classList.remove('vague');
    
    pitchElem.textContent = Math.round(detectedPitch.frequency);
    
    const noteName = store.data.noteStrings[detectedPitch.pitchClass];
    const octave = Math.floor(detectedPitch.midi / 12) - 1;
    noteElem.textContent = noteName;
    octaveElem.textContent = octave;

  } else {
    detectorElem.classList.add('vague');
    detectorElem.classList.remove('confident');

    pitchElem.textContent = '--';
    noteElem.textContent = '--';
    octaveElem.textContent = '-';
  }
}

export function initializePitchReadout() {
  detectorElem = document.getElementById('detector');
  pitchElem = document.getElementById('pitch');
  noteElem = document.getElementById('note');
  octaveElem = document.getElementById('octave');

  // Listen for pitch changes from the store and update the display.
  store.on('pitchChanged', updateDisplay);
  
  console.log('PitchReadout Initialized.');
}