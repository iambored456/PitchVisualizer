// js/main.js
import { initializeStore } from './store.js';
import { initializeAudio } from './services/AudioService.js';
import { initializePitchService } from './services/PitchService.js';
import { initializeStaff } from './components/Staff.js';
import { initializePitchTrace } from './components/PitchTrace.js';
import { initializeControlPanel } from './components/ControlPanel.js';
import { initializePitchReadout } from './components/PitchReadout.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Pitch Visualizer: Initializing application...');

  initializeStore();
  
  // Initialize UI Components
  initializeStaff();
  // initializePitchHighlight(); // This component is now removed.
  initializePitchTrace();
  initializeControlPanel();
  initializePitchReadout();

  // Initialize Services
  initializeAudio();
  initializePitchService();
  
  console.log('Pitch Visualizer: Application initialized.');
});