import { useRef, useState } from "react";

import SpectrumCanvas from "./components/SpectrumCanvas";
import TimeIntensity from "./components/TimeIntensity";
import generateRmsAndPeak from "./processing/generateRmsAndPeak";

export default function App() {
  // Client Side:
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [readySpectra, setReadySpectra] = useState(false);
  const [readyTime, setReadyTime] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [rmsArrayL, setRmsArrayL] = useState<number[]>([]);
  const [rmsArrayR, setRmsArrayR] = useState<number[]>([]);
  const [peakArrayL, setPeakArrayL] = useState<number[]>([]);
  const [peakArrayR, setPeakArrayR] = useState<number[]>([]);
  const [timedelta, setTimedelta] = useState<number>(0.05);

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
    setReadySpectra(true);
  }

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
    setReadyTime(true);
  }

  // Update state on audio time change
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  return (
    <main>
      <h1>Soundbox</h1>

      <p>Self-hosted audio visualization</p>

      <h2>Example</h2>
      <audio
        ref={audioRef}
        controls
        src="music/yes-jesus-loves-me.mp3"
        onTimeUpdate={handleTimeUpdate}
      />

      <h3>Spectrum Canvas</h3>

      <button type="button" onClick={enableSpectrumAnalyser} disabled={readySpectra}>
        {readySpectra ? "FFT Spectrum enabled" : "Enable FFT Spectrum"}
      </button>
      <br />

      <SpectrumCanvas analyser={analyser} />

      <h3>Time Intensity</h3>

      <button type="button" onClick={enableTimeIntensity} disabled={readyTime}>
        {readyTime ? "Time intensity enabled" : "Enable time intensity"}
      </button>

      <br />

      <TimeIntensity
        currentTime={currentTime}
        totalTime={totalTime}
        rmsArrayL={rmsArrayL}
        rmsArrayR={rmsArrayR}
        peakArrayL={peakArrayL}
        peakArrayR={peakArrayR}
        timedelta={timedelta}
      />
    </main>
  );
}
