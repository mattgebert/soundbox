import { useEffect, useRef, useState } from "react";
import { MdSettings } from "react-icons/md";
import { Box, Fade, IconButton } from "@mui/material";

type Props = {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
};

// CSS
import styles from "../styles/SpectrumCanvas.module.css";
import "../styles/global.css";

import { getGlobalCSSVar } from "../util/theme";

/**
 * Renders a canvas containing the frequency spectrum provided by an
 * AnalyserNode.
 */
export default function SpectrumCanvas({
  analyser,
  width = 1000,
  height = 300,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hover, setHover] = useState(false);

  const dpr = window.devicePixelRatio || 1;

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

    // Setup the canvas dimensions for high-DPI displays
    activeCanvas.width = width * dpr;
    activeCanvas.height = height * dpr;
    activeContext.font = "12px Arial";

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

      // Load colors from CSS variables
      const colorPrimary: string = getGlobalCSSVar("--color-primary");
      const colorSecondary: string = getGlobalCSSVar("--color-secondary");
      const colorTertiary: string = getGlobalCSSVar("--color-tertiary");

      // Draw octave lines and labels
      for (let i = 0; i < octaves.length; i += 1) {
        const octave: number = octaves[i];
        const log2_octave: number = Math.log2(octave + 1); // +1 to avoid log2(0)
        const x: number = (log2_octave - min_log_f) * dx;
        const xp1: number = (Math.log2(octave * 2 + 1) - min_log_f) * dx; // Next octave
        activeContext.strokeStyle = colorSecondary; // Red color with some transparency
        activeContext.beginPath();
        activeContext.moveTo(x, 0);
        activeContext.lineTo(x, activeCanvas.height);
        activeContext.stroke();
        activeContext.fillStyle = colorPrimary; // Use primary color for text
        activeContext.fillText(`${octave.toFixed(2)} Hz`, x + 5, 10, xp1 - 5); // Label with frequency in Hz
        // also label which C for each octave
        activeContext.fillText(`C${i}`, x + 5, 25, xp1 - 5); // Label with the nearest C note
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
        const col =
          "color-mix(in srgb, " +
          colorTertiary +
          " " +
          Math.floor(fraction * 100) +
          "%, transparent)"; // Use CSS color-mix to blend with transparency

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
      activeContext.fillStyle = colorPrimary; // Use primary color for text
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

  return (
    <Box
      sx={{ position: "relative" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Add 200 px height to the canvas */}
      <canvas ref={canvasRef} className={styles.canvas} />
      <Fade in={hover}>
        <IconButton
          className={styles.settingsButton}
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            borderRadius: 1,
            color: getGlobalCSSVar("--color-primary"),
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: getGlobalCSSVar("--color-bg-secondary"),
            },
          }}
        >
          <MdSettings />
        </IconButton>
      </Fade>
    </Box>
  );
}
