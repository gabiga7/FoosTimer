export const computeRms = (samples: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
};

export const computePeak = (samples: Float32Array): number => {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }
  return peak;
};

export const computeDelta = (currentRms: number, previousAverage: number): number => {
  return currentRms - previousAverage;
};

export const percentile = (arr: number[], p: number): number => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * (p / 100);
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
};

export const median = (arr: number[]): number => percentile(arr, 50);

export const movingAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

export const computeHighFrequencyRatio = (freqData: Uint8Array): number => {
  if (freqData.length === 0) return 0;
  // We consider high frequencies to be the upper half of the spectrum
  const half = Math.floor(freqData.length / 2);
  let lowSum = 0;
  let highSum = 0;
  for (let i = 0; i < half; i++) lowSum += freqData[i];
  for (let i = half; i < freqData.length; i++) highSum += freqData[i];
  return highSum / (lowSum + highSum + 1);
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
