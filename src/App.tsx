import { useRef, useState, useEffect, useCallback } from "react";

// Components
import SpectrumCanvas from "./components/SpectrumCanvas";
import TimeIntensity from "./components/TimeIntensity";
import HeaderBar from "./components/HeaderBar";

// Processing
import generateRmsAndPeak from "./processing/generateRmsAndPeak";

export default function App() {
  // Client Side:
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [rmsArrayL, setRmsArrayL] = useState<number[]>([]);
  const [rmsArrayR, setRmsArrayR] = useState<number[]>([]);
  const [peakArrayL, setPeakArrayL] = useState<number[]>([]);
  const [peakArrayR, setPeakArrayR] = useState<number[]>([]);
  const [timedelta, setTimedelta] = useState<number>(0.05);

  // --------------------------------------------------------
  // Functions for the SpectrumCanvas component
  // --------------------------------------------------------

  // Pre-generate the RMS and peak arrays for the known audio file. In a real application, you might want to do this on the server side or in a Web Worker to avoid blocking the main thread.
  async function enableSpectrumAnalyser() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    /*
     * Do not create a second MediaElementAudioSourceNode for the
     * same HTMLAudioElement.
     */
    if (analyserRef.current) {
      return;
    }

    const context = new AudioContext();

    /*
     * Browsers can initially suspend an AudioContext until the user
     * interacts with the page.
     */
    if (context.state === "suspended") {
      await context.resume();
    }

    const source = context.createMediaElementSource(audio);
    const newAnalyser = context.createAnalyser();

    // newAnalyser.fftSize = 2048;
    newAnalyser.fftSize = 8192;
    newAnalyser.smoothingTimeConstant = 0.8;

    source.connect(newAnalyser);
    newAnalyser.connect(context.destination);

    audioContextRef.current = context;
    analyserRef.current = newAnalyser;

    /*
     * Updating state causes React to render SpectrumCanvas below.
     */
    setAnalyser(newAnalyser);
  }

  // --------------------------------------------------------
  // Functions for the TimeIntensity component
  // --------------------------------------------------------
  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(audio.duration)) {
      return;
    }

    const clampedTime = Math.min(audio.duration, Math.max(0, time));

    audio.currentTime = clampedTime;

    /*
     * timeupdate is not guaranteed to fire immediately after assigning
     * currentTime, so update React state directly for immediate visual
     * feedback.
     */
    setCurrentTime(clampedTime);
  }, []);

  async function enableTimeIntensity() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const { rmsArrayL, rmsArrayR, peakArrayL, peakArrayR, timedelta } =
      await generateRmsAndPeak(1, "music/yes-jesus-loves-me.mp3");

    setRmsArrayL(rmsArrayL);
    setRmsArrayR(rmsArrayR);
    setPeakArrayL(peakArrayL);
    setPeakArrayR(peakArrayR);
    setTimedelta(timedelta);
    setTotalTime(audio.duration);
    setCurrentTime(audio.currentTime);
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setTotalTime(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const handleDurationChange = () => {
      setTotalTime(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
    };
  }, []);

  const handleOnReady = () => {
    enableTimeIntensity();
    enableSpectrumAnalyser();
  };

  return (
    <main>
      {/* Add a header bar with the h1 title and the darktheme toggle, use FontAwesome icons */}
      <HeaderBar />

      {/* Add a 80% width container for the example audio player */}
      <div style={{ width: "80%", margin: "0 auto" }}>
        <h2>Song Demo: Jesus Loves Me</h2>
        <p>
          In the style of Kings Kaleidoscope "Oxygen". This audio element can be hidden,
          as visualizations can host the audio.
        </p>
        <audio
          ref={audioRef}
          controls
          src="music/yes-jesus-loves-me.mp3"
          onTimeUpdate={handleTimeUpdate}
          onCanPlayThrough={handleOnReady}
        />

        <h3>Spectrum Canvas</h3>

        <SpectrumCanvas analyser={analyser} />

        <h3>Time Intensity</h3>

        <TimeIntensity
          currentTime={currentTime}
          totalTime={totalTime}
          rmsArrayL={rmsArrayL}
          rmsArrayR={rmsArrayR}
          peakArrayL={peakArrayL}
          peakArrayR={peakArrayR}
          timedelta={timedelta}
          onSeek={handleSeek}
        />
      </div>
    </main>
  );
}
