// js/components/ControlPanel.js
import * as Tone from 'tone';
import store from '../store.js';

function updateActiveButton(container, activeValue) {
  container.querySelectorAll('button').forEach(btn => {
    const btnValue = btn.dataset.octave;
    if (btnValue) {
      btn.classList.toggle('active', btnValue === activeValue.toString());
    }
  });
}

export function initializeControlPanel() {
  const startBtn = document.getElementById('startBtn');
  const tonicSelect = document.getElementById('tonicSelect');
  const labelToggle = document.getElementById('labelToggle');
  const accidentalsToggle = document.getElementById('accidentalsToggle');
  const droneBtn = document.getElementById('droneBtn');
  const octaveToggles = document.getElementById('octaveToggles');
  const volumeSlider = document.getElementById('volumeSlider');
  const yAxisUpperExpandBtn = document.getElementById('yAxisUpperExpandBtn');
  const yAxisUpperContractBtn = document.getElementById('yAxisUpperContractBtn');
  const yAxisLowerExpandBtn = document.getElementById('yAxisLowerExpandBtn');
  const yAxisLowerContractBtn = document.getElementById('yAxisLowerContractBtn');

  startBtn.addEventListener('click', async () => {
    await Tone.start();
    store.toggleIsDetecting();
  });

  tonicSelect.addEventListener('change', (e) => {
    store.setTonic(e.target.value);
  });

  labelToggle.addEventListener('change', (e) => store.setUseDegrees(e.target.checked));
  accidentalsToggle.addEventListener('change', (e) => store.setShowAccidentals(e.target.checked));

  droneBtn.addEventListener('click', async () => {
    await Tone.start();
    store.toggleDrone();
  });

  octaveToggles.addEventListener('click', (e) => {
    if (e.target.matches('.octaveBtn')) {
      store.setDroneOctave(parseInt(e.target.dataset.octave, 10));
    }
  });

  volumeSlider.addEventListener('input', (e) => {
    store.setDroneVolume(parseInt(e.target.value, 10));
  });

  yAxisUpperExpandBtn.addEventListener('click', () => store.setYAxisRange('expand', 'upper'));
  yAxisUpperContractBtn.addEventListener('click', () => store.setYAxisRange('contract', 'upper'));
  yAxisLowerExpandBtn.addEventListener('click', () => store.setYAxisRange('expand', 'lower'));
  yAxisLowerContractBtn.addEventListener('click', () => store.setYAxisRange('contract', 'lower'));

  store.on('isDetectingChanged', (isDetecting) => {
    startBtn.textContent = isDetecting ? 'Stop' : 'Start';
    startBtn.classList.toggle('active', isDetecting);
  });

  store.on('droneStateChanged', (droneState) => {
    droneBtn.classList.toggle('active', droneState.isPlaying);
  });

  store.on('droneOctaveChanged', (octave) => {
    updateActiveButton(octaveToggles, octave);
  });
  
  console.log('ControlPanel Initialized.');
}