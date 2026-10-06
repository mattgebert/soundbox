import { useEffect, useRef } from "react";

type Props = {
  analyser: AnalyserNode | null;
};

// CSS
import styles from "../styles/SpectrumCanvas.module.css";
import "../styles/global.css";
import { primaryColor, secondaryColor, tertiaryColor } from "../util/colors.tsx";

function hexMap(value: number, base: string = tertiaryColor): string {
  const r = parseInt(base.slice(1, 3), 16);
  const g = parseInt(base.slice(3, 5), 16);
  const b = parseInt(base.slice(5, 7), 16);
  const frac = value / 255.0;
  const newR = Math.min(255, Math.floor(r * frac));
  const newG = Math.min(255, Math.floor(g * frac));
  const newB = Math.min(255, Math.floor(b * frac));
  return `rgb(${newR}, ${newG}, ${newB})`;
}

/**
 * Renders a canvas containing the frequency spectrum provided by an
 * AnalyserNode.
 */
export default function SpectrumCanvas({ analyser }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!analyser) {
      return;
    }
    const activeAnalyser = analyser;

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }
    const activeCanvas = canvas;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }
    const activeContext = context;

    // Get the frequency data from the analyser and draw it to the canvas.
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const dfreq = activeAnalyser.context.sampleRate / activeAnalyser.fftSize;

    const octaveCount: number = 12;
    const C0 = 16.35; // Frequency of C0 in Hz
    const octaves: number[] = Array.from(
      { length: octaveCount },
      (_, i) => C0 * Math.pow(2, i),
    ); // Frequencies of octaves
    const min_log_f = Math.log2(octaves[0] + 1); // +1 to avoid log2(0)
    const max_log_f = Math.log2(octaves[octaveCount - 1] + 1);
    const dx: number = activeCanvas.width / (max_log_f - min_log_f);

    let animationId = 0;

    function draw() {
      activeAnalyser.getByteFrequencyData(frequencyData);
      activeContext.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

      // Draw octave lines and labels
      for (let i = 0; i < octaves.length; i += 1) {
        const octave: number = octaves[i];
        const log2_octave: number = Math.log2(octave + 1); // +1 to avoid log2(0)
        const x: number = (log2_octave - min_log_f) * dx;
        activeContext.strokeStyle = secondaryColor; // Red color with some transparency
        activeContext.beginPath();
        activeContext.moveTo(x, 0);
        activeContext.lineTo(x, activeCanvas.height);
        activeContext.stroke();
        activeContext.fillStyle = primaryColor;
        activeContext.fillText(`${octave.toFixed(2)} Hz`, x + 5, 10); // Label with frequency in Hz
        // also label which C for each octave
        activeContext.fillText(`C${i}`, x + 5, 25); // Label with the nearest C note
      }

      // Draw the frequency spectrum
      for (let index = 0; index < frequencyData.length; index += 1) {
        const fraction: number = frequencyData[index] / 255.0;
        const height: number = fraction * activeCanvas.height;
        const freq = index * dfreq;
        if (freq < octaves[0] || freq > octaves[octaveCount - 1]) {
          continue; // Skip frequencies outside the range of interest
        }

        const freq_min = freq - dfreq / 2;
        const freq_max = freq + dfreq / 2;

        const x_min = (Math.log2(freq_min + 1) - min_log_f) * dx; // +1 to avoid log2(0)
        const x_max = (Math.log2(freq_max + 1) - min_log_f) * dx; // +1 to avoid log2(0)

        // Use the hexMap function to set the fill style
        const col = hexMap(frequencyData[index]);

        // Draw a rectangle for the frequency bin
        activeContext.fillStyle = col;
        activeContext.fillRect(
          x_min,
          activeCanvas.height - height,
          Math.max(1, x_max - x_min),
          height,
        );
      }

      // Add a label at the bottom left corner for the sampling rate
      activeContext.fillStyle = primaryColor;
      activeContext.font = "12px Arial";
      activeContext.fillText(
        `Sampling Rate: ${activeAnalyser.context.sampleRate} Hz` +
          `, FFT Size: ${activeAnalyser.fftSize}` +
          `,\nDfreq: ${dfreq.toFixed(2)} Hz`,
        10,
        activeCanvas.height - 10,
      );

      /*
       * Schedule the next frame from inside draw().
       */
      animationId = requestAnimationFrame(draw);
    }

    draw();

    /*
     * Stop the animation if the component unmounts or if the analyser
     * changes.
     */
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser]);

  return <canvas ref={canvasRef} width={1000} height={300} className={styles.canvas} />;
}
