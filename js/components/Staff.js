// js/components/Staff.js
import store from '../store.js';

let plotCanvas, plotCtx;
let container;
const yAxisWidth = 200;
const plotPadding = 5;

function findPitchData(midi) {
    const C4_MIDI = 60;
    const value = midi - C4_MIDI;
    return store.data.pitchData.find(p => p.value === value);
}

function getNoteLabel(midi, state) {
    const pitchInfo = findPitchData(midi);
    if (!pitchInfo) return "";

    const pc = midi % 12;
    const tonicPC = store.data.tonicToSemisFromC[state.tonic] || 0;
    const isDiatonic = store.data.majorScales[state.tonic]?.includes(pc);

    if (!isDiatonic && !state.showAccidentals) return "";

    if (state.useDegrees) {
        const offsetPC = (pc - tonicPC + 12) % 12;
        const degreeMap = { 0: "1", 1: "♭2", 2: "2", 3: "♭3", 4: "3", 5: "4", 6: "♭5", 7: "5", 8: "♭6", 9: "6", 10: "♭7", 11: "7" };
        const accidentalMap = { 1: "#1/♭2", 3: "#2/♭3", 6: "#4/♭5", 8: "#5/♭6", 10: "#6/♭7" };
        return isDiatonic ? degreeMap[offsetPC] : accidentalMap[offsetPC] || "";
    } else {
        return pitchInfo.pitch;
    }
}

function getLineStyle(offsetPC) {
    switch (offsetPC) {
        case 0: return { color: "#000000", width: 2, dash: [] };
        case 2:
        case 6:
        case 8:
        case 10: return { color: "#A0A0A0", width: 1, dash: [] };
        case 4: return { color: "#A0A0A0", width: 1, dash: [5, 5] };
        case 7: return "greyRect";
        default: return null;
    }
}

function scaleY(midiValue, range) {
    if (range.maxMidi === range.minMidi) return plotCanvas.height / 2;
    const normalized = (midiValue - range.minMidi) / (range.maxMidi - range.minMidi);
    return plotCanvas.height - (normalized * plotCanvas.height);
}

function drawStaff() {
    plotCtx.clearRect(0, 0, plotCanvas.width, plotCanvas.height);
    const { yAxisRange, tonic, stablePitch } = store.state;
    const { minMidi, maxMidi } = yAxisRange;
    const tonicPC = store.data.tonicToSemisFromC[tonic] || 0;
    const defaultColA = [0, 2, 4, 6, 8, 10];
    const colA = defaultColA.includes(tonicPC) ? defaultColA : [1, 3, 5, 7, 9, 11];
    const innerX = yAxisWidth * 0.75;
    const outerX = yAxisWidth * 0.25;

    const noteMetrics = {};
    for (let midi = Math.floor(minMidi) - 1; midi <= Math.ceil(maxMidi) + 1; midi++) {
        noteMetrics[midi] = { y: scaleY(midi, yAxisRange) };
    }
    for (let midi = Math.floor(minMidi); midi <= Math.ceil(maxMidi); midi++) {
        const gap = (noteMetrics[midi - 1].y - noteMetrics[midi + 1].y) / 2;
        noteMetrics[midi].cellTop = noteMetrics[midi].y - gap;
        noteMetrics[midi].cellHeight = 2 * gap;
    }

    // === PASS 1: Draw all background elements (lines and grey rectangles) ===
    for (let midi = Math.floor(minMidi); midi <= Math.ceil(maxMidi); midi++) {
        const metrics = noteMetrics[midi];
        const offsetPC = (midi % 12 - tonicPC + 12) % 12;
        const lineStyle = getLineStyle(offsetPC);

        if (lineStyle === "greyRect") {
            plotCtx.fillStyle = '#E8E8E8';
            plotCtx.fillRect(0, metrics.cellTop, plotCanvas.width, metrics.cellHeight);
        } else if (lineStyle) {
            plotCtx.strokeStyle = lineStyle.color;
            plotCtx.lineWidth = lineStyle.width;
            plotCtx.setLineDash(lineStyle.dash);
            plotCtx.beginPath();
            plotCtx.moveTo(0, metrics.y);
            plotCtx.lineTo(plotCanvas.width, metrics.y);
            plotCtx.stroke();
        }
    }

    // === PASS 2: Draw all foreground label backgrounds and text ===
    for (let midi = Math.floor(minMidi); midi <= Math.ceil(maxMidi); midi++) {
        const pitchInfo = findPitchData(midi);
        if (!pitchInfo) continue;

        const metrics = noteMetrics[midi];
        const isColA = pitchInfo.column === 'A';
        const label = getNoteLabel(midi, store.state);
        const isStable = (stablePitch.pitchClass === midi % 12);

        if (label) {
            const leftX = isColA ? innerX : outerX;
            const rightX = plotCanvas.width - leftX;

            // --- THE FIX: Logic for drawing label backgrounds and highlights ---
            
            // First, always draw the original background color.
            plotCtx.fillStyle = pitchInfo.hex;
            plotCtx.fillRect(leftX - yAxisWidth/4, metrics.cellTop, yAxisWidth/2, metrics.cellHeight);
            plotCtx.fillRect(rightX - yAxisWidth/4, metrics.cellTop, yAxisWidth/2, metrics.cellHeight);

            // If the note is stable, draw the yellow highlight ON TOP of the original color.
            // The opacity will animate from 0 to 1, creating the fade-in effect.
            if (isStable && stablePitch.opacity > 0.01) {
                plotCtx.fillStyle = `rgba(255, 255, 0, ${stablePitch.opacity})`;
                plotCtx.fillRect(leftX - yAxisWidth/4, metrics.cellTop, yAxisWidth/2, metrics.cellHeight);
                plotCtx.fillRect(rightX - yAxisWidth/4, metrics.cellTop, yAxisWidth/2, metrics.cellHeight);
            }

            // Finally, draw the text label, ensuring it's on top of everything else.
            const fontSize = Math.max(8, Math.floor(metrics.cellHeight * 0.7));
            plotCtx.font = `${fontSize}px "Atkinson Hyperlegible", sans-serif`;
            plotCtx.textAlign = 'center';
            plotCtx.textBaseline = 'middle';
            plotCtx.fillStyle = '#000'; // Black text for visibility
            plotCtx.fillText(label, leftX, metrics.y);
            plotCtx.fillText(label, rightX, metrics.y);
        }
    }
}


export function initializeStaff() {
  container = document.getElementById('plotContainer');
  plotCanvas = document.getElementById('plotCanvas');
  plotCtx = plotCanvas.getContext('2d');

  store.on('settingsChanged', drawStaff);
  store.on('stablePitchChanged', drawStaff);
  window.addEventListener('resize', () => {
      plotCanvas.width = container.clientWidth;
      plotCanvas.height = container.clientHeight;
      drawStaff();
  });
  
  plotCanvas.width = container.clientWidth;
  plotCanvas.height = container.clientHeight;
  drawStaff(); 

  console.log('Staff Component Initialized.');
}