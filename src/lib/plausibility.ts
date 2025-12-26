/**
 * Plausibility validation for benchmark submissions
 *
 * Checks if claimed performance metrics are physically plausible
 * given the hardware configuration.
 */

// VRAM requirements per quantization (bytes per parameter)
const BYTES_PER_PARAM: Record<string, number> = {
  // Full precision
  FP32: 4,
  FP16: 2,
  BF16: 2,

  // Integer quantization
  INT8: 1,
  INT4: 0.5,

  // GGUF quantization formats
  Q8_0: 1,
  Q6_K: 0.75,
  Q5_K_M: 0.625,
  Q5_K_S: 0.625,
  Q4_K_M: 0.5,
  Q4_K_S: 0.5,
  Q3_K_M: 0.375,
  Q3_K_S: 0.375,
  Q2_K: 0.25,

  // GGUF importance quantization
  IQ4_XS: 0.5,
  IQ3_XS: 0.375,
  IQ2_XS: 0.25,

  // Other formats
  GPTQ: 0.5,
  AWQ: 0.5,
  EXL2: 0.5,
  NF4: 0.5,
}

const DEFAULT_BYTES_PER_PARAM = 2 // Assume FP16 if unknown
const OVERHEAD_MULTIPLIER = 1.2  // 20% overhead for KV cache, activations, etc.

/**
 * Calculate the approximate VRAM required for a model in MB
 */
export function calculateRequiredVramMb(
  modelParametersB: number,
  quantization: string | null
): number {
  const bytesPerParam = quantization
    ? (BYTES_PER_PARAM[quantization] ?? DEFAULT_BYTES_PER_PARAM)
    : DEFAULT_BYTES_PER_PARAM

  // Convert billions of params to bytes, then to MB
  const baseVramMb = (modelParametersB * 1e9 * bytesPerParam) / (1024 * 1024)

  return Math.ceil(baseVramMb * OVERHEAD_MULTIPLIER)
}

export type PlausibilityResult =
  | { plausible: true }
  | { plausible: false; warningLevel: 'unlikely' | 'very_unlikely'; reason: string }

/**
 * Check if a benchmark submission is plausible based on VRAM requirements
 *
 * @param totalVramMb - Total VRAM available across all GPUs (in MB)
 * @param modelParametersB - Model size in billions of parameters
 * @param quantization - Quantization format (e.g., FP16, Q4_K_M)
 * @returns Plausibility result with warning if implausible
 */
export function checkVramPlausibility(
  totalVramMb: number,
  modelParametersB: number,
  quantization: string | null
): PlausibilityResult {
  const requiredVramMb = calculateRequiredVramMb(modelParametersB, quantization)

  // Convert to GB for human-readable messages
  const requiredVramGb = Math.ceil(requiredVramMb / 1024)
  const availableVramGb = Math.ceil(totalVramMb / 1024)

  const ratio = requiredVramMb / totalVramMb

  if (ratio > 3) {
    // Model needs 3x+ available VRAM - very suspicious
    return {
      plausible: false,
      warningLevel: 'very_unlikely',
      reason: `Model requires ~${requiredVramGb}GB VRAM but only ${availableVramGb}GB available (${ratio.toFixed(1)}x over). This likely requires significant CPU offload which would severely impact performance.`,
    }
  }

  if (ratio > 1) {
    // Model slightly exceeds VRAM - possible with CPU offload
    return {
      plausible: false,
      warningLevel: 'unlikely',
      reason: `Model requires ~${requiredVramGb}GB VRAM but only ${availableVramGb}GB available. Verify if CPU offload was used.`,
    }
  }

  return { plausible: true }
}
