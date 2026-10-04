import { useRef, useState } from "react";

import SpectrumCanvas from "./SpectrumCanvas";

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [ready, setReady] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  async function enableVisualizer() {
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
    setReady(true);
  }

  return (
    <main>
      <h1>Soundbox</h1>

      <p>Self-hosted audio visualization</p>

      <audio ref={audioRef} controls src="./public/music/yes-jesus-loves-me.mp3" />

      <button type="button" onClick={enableVisualizer} disabled={ready}>
        {ready ? "Visualizer enabled" : "Enable visualizer"}
      </button>

      <SpectrumCanvas analyser={analyser} />
    </main>
  );
}
