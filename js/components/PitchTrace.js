// js/components/PitchTrace.js
import store from '../store.js';

// --- Canvas and Context ---
let noteCanvas, noteCtx;
let container;

// --- Constants ---
const yAxisWidth = 200;
const plotPadding = 5;
const timeWindow = 4000;
const proximityThreshold = 35; 
const maxConnections = 3;

const labelBackgroundColors = [
  "#ef8aab", "#f48e7d", "#e89955", "#cdaa42", "#a4ba57", "#6ec482",
  "#2dc8b1", "#16c3da", "#58b8f6", "#8fa9ff", "#ba9bf2", "#db8fd4"
];

// --- Helper Functions ---
function hexToRgb(hex) {
  let bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function interpolateRgb(c1, c2, factor) {
  return c1.map((v, i) => Math.round(v + factor * (c2[i] - v)));
}

function getCurrentTonicPC() {
    return store.data.tonicToSemisFromC[store.state.tonic] || 0;
}

function colorFromNoteCustom(pitch) {
  const midiFloor = Math.floor(pitch);
  const fraction = pitch - midiFloor;
  const tonicPC = getCurrentTonicPC();
  const relativePC = ((midiFloor % 12) - tonicPC + 12) % 12;
  const nextRelativePC = (relativePC + 1) % 12;
  const baseColor = hexToRgb(labelBackgroundColors[relativePC]);
  const nextColor = hexToRgb(labelBackgroundColors[nextRelativePC]);
  return interpolateRgb(baseColor, nextColor, fraction);
}

function scaleY(midiValue, range) {
    if (range.maxMidi === range.minMidi) return noteCanvas.height / 2;
    const normalized = (midiValue - range.minMidi) / (range.maxMidi - range.minMidi);
    return noteCanvas.height - (normalized * noteCanvas.height);
}

// --- Drawing Function ---
function drawPitchTrace() {
    if (!noteCtx) return;

    noteCtx.clearRect(0, 0, noteCanvas.width, noteCanvas.height);
    const history = store.state.pitchHistory;
    if (history.length < 1) return;

    const range = store.state.yAxisRange;
    const currentTime = performance.now();
    const plotAreaX = yAxisWidth + plotPadding;
    const plotAreaWidth = noteCanvas.width - (yAxisWidth + plotPadding) * 2;
    
    const notePoints = history
        .filter(p => p.midi > 0) // Filter by midi instead of frequency
        .map(point => {
            // THE FIX: Use the 'midi' value directly from the point object.
            // Do NOT recalculate it here.
            const { time, clarity, midi } = point; 
            return {
                x: plotAreaX + plotAreaWidth * (1 - (currentTime - time) / timeWindow),
                y: scaleY(midi, range), 
                clarity: clarity,
                color: colorFromNoteCustom(midi)
            };
        })
        .filter(p => p.x >= plotAreaX);

    if (notePoints.length < 1) return;

    // Draw connector lines
    noteCtx.strokeStyle = 'rgba(0,0,0,0.4)';
    noteCtx.lineWidth = 2.5;
    noteCtx.beginPath();
    for (let i = 0; i < notePoints.length; i++) {
        let connections = 0;
        for (let j = i + 1; j < notePoints.length && connections < maxConnections; j++) {
            const dx = notePoints[i].x - notePoints[j].x;
            const dy = notePoints[i].y - notePoints[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= proximityThreshold) {
                noteCtx.moveTo(notePoints[i].x, notePoints[i].y);
                noteCtx.lineTo(notePoints[j].x, notePoints[j].y);
                connections++;
            }
        }
    }
    noteCtx.stroke();

    // Draw circles
    notePoints.forEach(pt => {
        const opacity = Math.min(pt.clarity * 0.9, 1); 
        noteCtx.fillStyle = `rgba(${pt.color[0]}, ${pt.color[1]}, ${pt.color[2]}, ${opacity})`;
        noteCtx.beginPath();
        noteCtx.arc(pt.x, pt.y, 9.5, 0, 2 * Math.PI);
        noteCtx.fill();
    });
}

// --- Initialization ---
export function initializePitchTrace() {
    container = document.getElementById('plotContainer');
    noteCanvas = document.getElementById('noteCanvas');
    noteCtx = noteCanvas.getContext('2d');
    store.on('pitchHistoryChanged', drawPitchTrace);
    store.on('settingsChanged', drawPitchTrace);
    window.addEventListener('resize', () => {
        noteCanvas.width = container.clientWidth;
        noteCanvas.height = container.clientHeight;
        drawPitchTrace();
    });
    noteCanvas.width = container.clientWidth;
    noteCanvas.height = container.clientHeight;
}