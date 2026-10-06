import { useEffect, useRef } from "react";

import styles from "../styles/TimeIntensity.module.css";
import "../styles/global.css";
import {
  primaryColor,
  secondaryColor,
  tertiaryColor,
  darken_hex,
} from "../util/colors.tsx";

type Props = {
  currentTime: number;
  totalTime: number;
  rmsArrayL: number[];
  rmsArrayR: number[];
  peakArrayL: number[];
  peakArrayR: number[];
  timedelta: number;
};

// Use primary and secondary colors of global css.
const styleHorizontalLine = primaryColor;
const styleLRMSPlayed = secondaryColor;
const styleRRMSPlayed = tertiaryColor;
const styleLPeakPlayed = darken_hex(styleLRMSPlayed, 0.7);
const styleRPeakPlayed = darken_hex(styleRRMSPlayed, 0.7);
const styleLPeakUnplayed = darken_hex(styleLPeakPlayed, 0.2);
const styleLRMSUnplayed = darken_hex(styleLRMSPlayed, 0.2);
const styleRPeakUnplayed = darken_hex(styleRPeakPlayed, 0.2);
const styleRRMSUnplayed = darken_hex(styleRRMSPlayed, 0.2);

/**
 * Renders a canvas containing the time spectrum provided by an
 * AnalyserNode.
 */
export default function TimeIntensity({
  currentTime,
  totalTime,
  rmsArrayL,
  rmsArrayR,
  peakArrayL,
  peakArrayR,
  timedelta,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
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

    let animationId = 0;

    // Get the current index in the rmsArray and peakArray based on the current time
    const currentIndex = Math.floor(currentTime / timedelta);
    const maxIndex =
      Math.min(
        rmsArrayL.length,
        rmsArrayR.length,
        peakArrayL.length,
        peakArrayR.length,
      ) - 1;
    const barWidth = activeCanvas.width / maxIndex;

    function draw() {
      // Draw a graph from 0 to x

      activeContext.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      // Draw a horizontal line in the middle of the canvas
      activeContext.strokeStyle = styleHorizontalLine;
      activeContext.beginPath();
      activeContext.moveTo(0, activeCanvas.height / 2);
      activeContext.lineTo(activeCanvas.width, activeCanvas.height / 2);
      activeContext.stroke();

      // Bars
      activeContext.globalAlpha = 0.8; // Set transparency for bars
      for (let i = 0; i <= maxIndex; i++) {
        const xi = activeCanvas.width * (i / maxIndex);
        const yi = activeCanvas.height / 2 - (peakArrayL[i] * activeCanvas.height) / 2;
        activeContext.fillStyle =
          i < currentIndex ? styleLPeakPlayed : styleLPeakUnplayed;
        activeContext.fillRect(
          xi,
          yi,
          barWidth,
          (peakArrayL[i] * activeCanvas.height) / 2,
        );
      }
      for (let i = 0; i <= maxIndex; i++) {
        const xi = activeCanvas.width * (i / maxIndex);
        const yi = activeCanvas.height / 2 - (rmsArrayL[i] * activeCanvas.height) / 2;
        activeContext.fillStyle =
          i < currentIndex ? styleLRMSPlayed : styleLRMSUnplayed;
        activeContext.fillRect(
          xi,
          yi,
          barWidth,
          (rmsArrayL[i] * activeCanvas.height) / 2,
        );
      }
      for (let i = 0; i <= maxIndex; i++) {
        const xi = activeCanvas.width * (i / maxIndex);
        const yi = activeCanvas.height / 2;
        activeContext.fillStyle =
          i < currentIndex ? styleRPeakPlayed : styleRPeakUnplayed;
        activeContext.fillRect(
          xi,
          yi,
          barWidth,
          (peakArrayR[i] * activeCanvas.height) / 2,
        );
      }
      for (let i = 0; i <= maxIndex; i++) {
        const xi = activeCanvas.width * (i / maxIndex);
        const yi = activeCanvas.height / 2;
        activeContext.fillStyle =
          i < currentIndex ? styleRRMSPlayed : styleRRMSUnplayed;
        activeContext.fillRect(
          xi,
          yi,
          barWidth,
          (rmsArrayR[i] * activeCanvas.height) / 2,
        );
      }

      activeContext.fillStyle = primaryColor;
      activeContext.font = "10px Arial";
      const time_mins = Math.floor(currentTime / 60);
      const time_secs = Math.floor((currentTime % 60) * 10) / 10;
      const total_mins = Math.floor(totalTime / 60);
      const total_secs = Math.floor((totalTime % 60) * 10) / 10;
      activeContext.fillText(
        `${time_mins}:${time_secs.toString().padStart(4, "0")}` +
          ` / ` +
          `${total_mins}:${total_secs.toString().padStart(4, "0")}`,
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
  }, [currentTime, totalTime, rmsArrayL, rmsArrayR, peakArrayL, peakArrayR, timedelta]);

  return <canvas ref={canvasRef} width={1000} height={100} className={styles.canvas} />;
}
