import { useRef, useState } from "react";

import SpectrumCanvas from "./components/SpectrumCanvas";

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [readySpectra, setReadySpectra] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

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

  return (
    <main>
      <h1>Soundbox</h1>

      <p>Self-hosted audio visualization</p>

      <h2>Example</h2>
      <audio ref={audioRef} controls src="music/yes-jesus-loves-me.mp3" />

      <h3>Spectrum Canvas</h3>

      <button type="button" onClick={enableSpectrumAnalyser} disabled={readySpectra}>
        {readySpectra ? "FFT Spectrum enabled" : "Enable FFT Spectrum"}
      </button>
      <br />

      <SpectrumCanvas analyser={analyser} />
    </main>
  );
}
