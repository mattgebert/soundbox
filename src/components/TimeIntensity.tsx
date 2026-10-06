import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import styles from "../styles/TimeIntensity.module.css";
import "../styles/global.css";
import { getGlobalCSSVar } from "../util/theme";

type Props = {
  currentTime: number;
  totalTime: number;
  rmsArrayL: number[];
  rmsArrayR: number[];
  peakArrayL: number[];
  peakArrayR: number[];
  timedelta: number;

  /**
   * Called when the user clicks or drags over the graph.
   */
  onSeek: (time: number) => void;
};

function formatTime(time: number): string {
  if (!Number.isFinite(time) || time < 0) {
    return "0:00";
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Renders a canvas containing the time spectrum.
 *
 * Hovering previews a timestamp.
 * Clicking or dragging seeks the associated audio element.
 */
export default function TimeIntensity({
  currentTime,
  totalTime,
  rmsArrayL,
  rmsArrayR,
  peakArrayL,
  peakArrayR,
  timedelta,
  onSeek,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sampleCount = Math.min(
    rmsArrayL.length,
    rmsArrayR.length,
    peakArrayL.length,
    peakArrayR.length,
  );

  /**
   * Converts a pointer position into an array index and timestamp.
   *
   * Canvas drawing coordinates and CSS coordinates can be different, so the
   * pointer position must be scaled using the canvas bounding rectangle.
   */
  const getPointerPosition = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;

      if (!canvas || sampleCount === 0) {
        return null;
      }

      const bounds = canvas.getBoundingClientRect();

      if (bounds.width === 0) {
        return null;
      }

      const canvasX = (event.clientX - bounds.left) * (canvas.width / bounds.width);

      const clampedX = Math.min(Math.max(canvasX, 0), canvas.width);

      const fraction = clampedX / canvas.width;

      const index = Math.min(sampleCount - 1, Math.floor(fraction * sampleCount));

      /*
       * Use the actual audio duration for seeking. This keeps the final point
       * aligned with totalTime even if the analysis arrays contain rounding
       * differences.
       */
      const time = Math.min(totalTime, Math.max(0, fraction * totalTime));

      return {
        index,
        time,
        canvasX: clampedX,
      };
    },
    [sampleCount, totalTime],
  );

  const updateHoverPosition = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const position = getPointerPosition(event);

      if (!position) {
        return;
      }

      setHoverIndex(position.index);
      setHoverTime(position.time);
    },
    [getPointerPosition],
  );

  const seekFromPointer = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const position = getPointerPosition(event);

      if (!position) {
        return;
      }

      setHoverIndex(position.index);
      setHoverTime(position.time);
      onSeek(position.time);
    },
    [getPointerPosition, onSeek],
  );

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    updateHoverPosition(event);

    if (isDragging) {
      seekFromPointer(event);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    /*
     * Capture the pointer so dragging continues even if the pointer moves
     * outside the canvas.
     */
    event.currentTarget.setPointerCapture(event.pointerId);

    setIsDragging(true);
    seekFromPointer(event);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverIndex(null);
      setHoverTime(null);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (sampleCount === 0) {
      return;
    }

    const colorPrimary = getGlobalCSSVar("--color-primary");
    const colorSecondary = getGlobalCSSVar("--color-secondary");
    const colorTertiary = getGlobalCSSVar("--color-tertiary");

    /*
     * The color used for the hover state.
     * You can replace this with another global CSS variable, such as
     * --color-accent, if your theme defines one.
     */
    const colorHover = colorPrimary;

    const styleHorizontalLine = colorPrimary;
    const styleLRMSPlayed = colorSecondary;
    const styleRRMSPlayed = colorTertiary;

    const styleLPeakPlayed = `color-mix(in srgb, ${colorSecondary} 70%, transparent)`;

    const styleRPeakPlayed = `color-mix(in srgb, ${colorTertiary} 70%, transparent)`;

    const styleLPeakUnplayed = `color-mix(in srgb, ${colorSecondary} 20%, transparent)`;

    const styleRPeakUnplayed = `color-mix(in srgb, ${colorTertiary} 20%, transparent)`;

    const styleLRMSUnplayed = `color-mix(in srgb, ${colorSecondary} 10%, transparent)`;

    const styleRRMSUnplayed = `color-mix(in srgb, ${colorTertiary} 10%, transparent)`;

    /*
     * Each sample occupies one equal-width column.
     *
     * Using sampleCount rather than sampleCount - 1 avoids the last bar being
     * drawn beyond the right edge of the canvas.
     */
    const barWidth = canvas.width / sampleCount;

    /*
     * timedelta can describe the relationship between array entries and time.
     * Clamp the result because currentTime can sometimes be slightly greater
     * than the reported duration during playback completion.
     */
    const rawCurrentIndex =
      timedelta > 0
        ? Math.floor(currentTime / timedelta)
        : Math.floor((currentTime / totalTime) * sampleCount);

    const currentIndex = Math.min(
      sampleCount,
      Math.max(0, Number.isFinite(rawCurrentIndex) ? rawCurrentIndex : 0),
    );

    const middleY = canvas.height / 2;

    context.strokeStyle = styleHorizontalLine;
    context.beginPath();
    context.moveTo(0, middleY);
    context.lineTo(canvas.width, middleY);
    context.stroke();

    /*
     * Draw all four values in one loop rather than traversing the arrays four
     * times.
     */
    for (let index = 0; index < sampleCount; index += 1) {
      const x = index * barWidth;
      const hasPlayed = index < currentIndex;

      const peakL = Math.max(0, Math.min(1, peakArrayL[index] ?? 0));
      const rmsL = Math.max(0, Math.min(1, rmsArrayL[index] ?? 0));
      const peakR = Math.max(0, Math.min(1, peakArrayR[index] ?? 0));
      const rmsR = Math.max(0, Math.min(1, rmsArrayR[index] ?? 0));

      const peakLHeight = peakL * middleY;
      const rmsLHeight = rmsL * middleY;
      const peakRHeight = peakR * middleY;
      const rmsRHeight = rmsR * middleY;

      context.fillStyle = hasPlayed ? styleLPeakPlayed : styleLPeakUnplayed;

      context.fillRect(x, middleY - peakLHeight, barWidth, peakLHeight);

      context.fillStyle = hasPlayed ? styleLRMSPlayed : styleLRMSUnplayed;

      context.fillRect(x, middleY - rmsLHeight, barWidth, rmsLHeight);

      context.fillStyle = hasPlayed ? styleRPeakPlayed : styleRPeakUnplayed;

      context.fillRect(x, middleY, barWidth, peakRHeight);

      context.fillStyle = hasPlayed ? styleRRMSPlayed : styleRRMSUnplayed;

      context.fillRect(x, middleY, barWidth, rmsRHeight);
    }

    /*
     * Highlight the complete column underneath the pointer.
     */
    if (hoverIndex !== null) {
      const hoverX = hoverIndex * barWidth;

      context.save();

      context.fillStyle = colorHover;
      context.fillRect(hoverX, 0, 1, canvas.height);

      context.strokeStyle = colorPrimary;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(hoverX, 0);
      context.lineTo(hoverX, canvas.height);
      context.stroke();

      context.restore();
    }

    context.fillStyle = styleHorizontalLine;
    context.font = "10px Arial, sans-serif";

    const displayedTime = hoverTime ?? currentTime;
    const timeLabel =
      hoverTime === null
        ? `${formatTime(currentTime)} / ${formatTime(totalTime)}`
        : `Seek to ${formatTime(displayedTime)} / ${formatTime(totalTime)}`;

    context.fillText(timeLabel, 10, canvas.height - 10);
  }, [
    currentTime,
    totalTime,
    rmsArrayL,
    rmsArrayR,
    peakArrayL,
    peakArrayR,
    timedelta,
    sampleCount,
    hoverIndex,
    hoverTime,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={100}
      className={styles.canvas}
      aria-label="Audio timeline. Click or drag to seek."
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  );
}
