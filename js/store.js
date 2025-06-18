// js/store.js
import { pitchData } from './data/pitchData.js';

const PubSub = {
  _subscribers: {},
  on(event, callback) {
    if (!this._subscribers[event]) this._subscribers[event] = [];
    this._subscribers[event].push(callback);
  },
  emit(event, data) {
    if (this._subscribers[event]) {
      this._subscribers[event].forEach(callback => callback(data));
    }
  },
};

const STATIC_DATA = {
  pitchData: pitchData,
  noteStrings: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"],
  tonicToSemisFromC: { "C": 0, "C♯": 1, "D♭": 1, "D": 2, "D♯": 3, "E♭": 3, "E": 4, "F♭": 4, "F": 5, "E♯": 5, "F♯": 6, "G♭": 6, "G": 7, "G♯": 8, "A♭": 8, "A": 9, "A♯": 10, "B♭": 10, "B": 11 },
  majorScales: { "C": [0, 2, 4, 5, 7, 9, 11], "C♯": [1, 3, 5, 6, 8, 10, 0], "D♭": [1, 3, 5, 6, 8, 10, 0], "D": [2, 4, 6, 7, 9, 11, 1], "E♭": [3, 5, 7, 8, 10, 0, 2], "E": [4, 6, 8, 9, 11, 1, 3], "F": [5, 7, 9, 10, 0, 2, 4], "F♯": [6, 8, 10, 11, 1, 3, 5], "G♭": [6, 8, 10, 11, 1, 3, 5], "G": [7, 9, 11, 0, 2, 4, 6], "A♭": [8, 10, 0, 1, 3, 5, 7], "A": [9, 11, 1, 2, 4, 6, 8], "B♭": [10, 0, 2, 3, 5, 7, 9], "B": [11, 1, 3, 4, 6, 8, 10] },
};

const state = {
  isDetecting: false,
  detectedPitch: { frequency: 0, clarity: 0, midi: 0, pitchClass: 0, },
  tonic: 'C',
  useDegrees: false,
  showAccidentals: true,
  yAxisRange: { minMidi: 33, maxMidi: 81 },
  drone: { isPlaying: false, octave: 3, volume: -12, },
  stablePitch: { pitchClass: null, opacity: 0, size: 1.0, },
  pitchHistory: [],
};

const actions = {
  toggleIsDetecting() {
    state.isDetecting = !state.isDetecting;
    if (!state.isDetecting) {
        state.pitchHistory = [];
        state.detectedPitch = { frequency: 0, clarity: 0, midi: 0, pitchClass: 0 };
        PubSub.emit('pitchChanged', state.detectedPitch);
        PubSub.emit('pitchHistoryChanged', state.pitchHistory);
    }
    PubSub.emit('isDetectingChanged', state.isDetecting);
  },
  setDetectedPitch(pitchResult) {
    state.detectedPitch = pitchResult;
    PubSub.emit('pitchChanged', state.detectedPitch);
  },
  addPitchHistoryPoint(point) {
      state.pitchHistory.push(point);
      
      // THE FIX: Increase history length to hold enough data for the 4-second window,
      // even on high-refresh-rate monitors. 500 is a safe, generous number.
      if (state.pitchHistory.length > 500) {
        state.pitchHistory.shift();
      }

      PubSub.emit('pitchHistoryChanged', state.pitchHistory);
  },
  setTonic(newTonic) {
    state.tonic = newTonic;
    PubSub.emit('settingsChanged');
    PubSub.emit('droneShouldUpdate');
  },
  setUseDegrees(useDegrees) {
    state.useDegrees = useDegrees;
    PubSub.emit('settingsChanged');
  },
  setShowAccidentals(showAccidentals) {
    state.showAccidentals = showAccidentals;
    PubSub.emit('settingsChanged');
  },
  setYAxisRange(action, boundary) {
      const { minMidi, maxMidi } = state.yAxisRange;
      const ULTIMATE_MAX = 81;
      const ULTIMATE_MIN = 33;
      if (boundary === 'upper') {
          if (action === 'expand' && maxMidi < ULTIMATE_MAX) state.yAxisRange.maxMidi++;
          if (action === 'contract' && maxMidi > minMidi + 12) state.yAxisRange.maxMidi--;
      }
      if (boundary === 'lower') {
          if (action === 'expand' && minMidi > ULTIMATE_MIN) state.yAxisRange.minMidi--;
          if (action === 'contract' && minMidi < maxMidi - 12) state.yAxisRange.minMidi++;
      }
      PubSub.emit('settingsChanged');
  },
  toggleDrone() {
    state.drone.isPlaying = !state.drone.isPlaying;
    PubSub.emit('droneShouldUpdate');
  },
  setDroneOctave(newOctave) {
    state.drone.octave = newOctave;
    PubSub.emit('droneOctaveChanged', newOctave);
    PubSub.emit('droneShouldUpdate');
  },
  setDroneVolume(newVolume) {
    state.drone.volume = newVolume;
    PubSub.emit('droneShouldUpdate');
  },
  setStablePitch(pitchClass, opacity, size) {
    state.stablePitch = { pitchClass, opacity, size };
    PubSub.emit('stablePitchChanged');
  },
};

const store = { state, data: STATIC_DATA, ...actions, ...PubSub };
export function initializeStore() {}
export default store;