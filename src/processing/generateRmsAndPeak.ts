// Server Side Rendering (SSR)
export default async function generateRmsAndPeak(
  timedelta: number = 1.0,
  audioFilePath: string = "music/yes-jesus-loves-me.mp3",
) {
  const arrayBuffer = await fetch(audioFilePath).then((res) => res.arrayBuffer());
  const arrayBufferCopy = arrayBuffer.slice(0); // Create a copy of the ArrayBuffer to avoid issues with decoding

  // Get sample rate and length from the audio file's metadata
  const audioContext = new AudioContext();
  const audio = await audioContext.decodeAudioData(arrayBuffer);
  const sampleRate = audio.sampleRate;
  const channels = audio.numberOfChannels;
  const length = audio.length;

  if (channels < 2) {
    throw new Error("Audio file must have at least 2 channels (stereo).");
  }

  // 1. Create an offline context matching the audio file's duration/sample rate
  const offlineCtx = new OfflineAudioContext(channels, length, sampleRate);

  // 2. Decode your audio file data (ArrayBuffer from fetch/file input)
  const audioBuffer = await offlineCtx.decodeAudioData(arrayBufferCopy);

  // 3. Get the raw PCM channel data (Float32Array for the entire file)
  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = audioBuffer.getChannelData(1);

  // 4. Loop through the entire array to compute RMS or Peak Intensity
  // Create arrays of the rms
  const npoints: number = Math.floor(leftChannel.length / (timedelta * sampleRate));
  const rmsArrayL: number[] = new Array(npoints).fill(0);
  const rmsArrayR: number[] = new Array(npoints).fill(0);
  const peakArrayL: number[] = new Array(npoints).fill(0);
  const peakArrayR: number[] = new Array(npoints).fill(0);

  for (let i = 0; i < npoints; i++) {
    const startIdx = Math.floor(i * timedelta * sampleRate);
    const endIdx = Math.floor((i + 1) * timedelta * sampleRate);

    let leftTotalSquares = 0;
    let rightTotalSquares = 0;
    let leftPeak = 0;
    let rightPeak = 0;

    for (let j = startIdx; j < endIdx; j++) {
      const sampleL = leftChannel[j];
      const sampleR = rightChannel[j];

      // Track peak absolute intensity
      if (Math.abs(sampleL) > leftPeak) leftPeak = Math.abs(sampleL);
      if (Math.abs(sampleR) > rightPeak) rightPeak = Math.abs(sampleR);

      // Track sum of squares for overall RMS
      leftTotalSquares += sampleL * sampleL;
      rightTotalSquares += sampleR * sampleR;
    }

    rmsArrayL[i] = Math.sqrt(leftTotalSquares / (endIdx - startIdx));
    rmsArrayR[i] = Math.sqrt(rightTotalSquares / (endIdx - startIdx));
    peakArrayL[i] = leftPeak;
    peakArrayR[i] = rightPeak;
  }

  // Perform smoothing on the RMS and Peak arrays using a simple moving average
  function envelope(previous: number, current: number, attack = 0.35, release = 0.05) {
    const alpha = current > previous ? attack : release;
    return alpha * current + (1 - alpha) * previous;
  }

  // Apply the envelope function to smooth the arrays
  for (let i = 1; i < rmsArrayL.length; i++) {
    rmsArrayL[i] = envelope(rmsArrayL[i - 1], rmsArrayL[i]);
    rmsArrayR[i] = envelope(rmsArrayR[i - 1], rmsArrayR[i]);
    peakArrayL[i] = envelope(peakArrayL[i - 1], peakArrayL[i]);
    peakArrayR[i] = envelope(peakArrayR[i - 1], peakArrayR[i]);
  }

  // Normalize the RMS and Peak arrays to a range of 0 to 1, using the maximum value in the peak arrays for normalization
  const maxPeakL = Math.max(...peakArrayL);
  const maxPeakR = Math.max(...peakArrayR);
  const maxPeak = Math.max(maxPeakL, maxPeakR);
  for (let i = 0; i < rmsArrayL.length; i++) {
    rmsArrayL[i] /= maxPeak;
    rmsArrayR[i] /= maxPeak;
    peakArrayL[i] /= maxPeak;
    peakArrayR[i] /= maxPeak;
  }
  // Re-normalize the RMS arrays to maximize the range while ensuring values are less than Peak values
  // divide peak by rms to get the ratio, then find the max ratio, then divide rms by max ratio to get the new rms
  const ratioL: number[] = peakArrayL.map((peak, i) => peak / rmsArrayL[i]);
  const ratioR: number[] = peakArrayR.map((peak, i) => peak / rmsArrayR[i]);
  const minRatioL = Math.min(...ratioL);
  const minRatioR = Math.min(...ratioR);

  const minRatioLRoot = Math.pow(minRatioL, 0.7);
  const minRatioRRoot = Math.pow(minRatioR, 0.7);
  for (let i = 0; i < rmsArrayL.length; i++) {
    rmsArrayL[i] *= minRatioLRoot;
    rmsArrayR[i] *= minRatioRRoot;
  }

  // Do something with the computed RMS and peak arrays, e.g., store them in state or use them for visualization
  return { rmsArrayL, rmsArrayR, peakArrayL, peakArrayR, timedelta };
}
