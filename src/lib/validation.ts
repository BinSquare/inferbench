import { z } from 'zod'

// =============================================================================
// Pagination & Query Parameter Utilities
// =============================================================================

const PAGINATION_DEFAULTS = {
  limit: 50,
  offset: 0,
  maxLimit: 100,
} as const

/**
 * Safely parse an integer from a string with bounds checking
 * Returns the default value if parsing fails or value is out of bounds
 */
export function safeParseInt(
  value: string | null,
  options: {
    default: number
    min?: number
    max?: number
  }
): number {
  if (value === null) return options.default

  const parsed = parseInt(value, 10)

  // Check for NaN or non-finite values
  if (!Number.isFinite(parsed)) return options.default

  // Apply bounds
  const min = options.min ?? Number.MIN_SAFE_INTEGER
  const max = options.max ?? Number.MAX_SAFE_INTEGER

  if (parsed < min) return min
  if (parsed > max) return max

  return parsed
}

/**
 * Parse pagination parameters from URL search params with safe defaults
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  limit: number
  offset: number
} {
  return {
    limit: safeParseInt(searchParams.get('limit'), {
      default: PAGINATION_DEFAULTS.limit,
      min: 1,
      max: PAGINATION_DEFAULTS.maxLimit,
    }),
    offset: safeParseInt(searchParams.get('offset'), {
      default: PAGINATION_DEFAULTS.offset,
      min: 0,
      max: 100000, // Reasonable upper bound for offset
    }),
  }
}

// =============================================================================
// Submission Validation Schemas
// =============================================================================

const gpuEntrySchema = z.object({
  name: z.string().min(1).max(200),
  vendor: z.string().min(1).max(100),
  vram_mb: z.number().int().min(0).max(10000000), // Up to 10TB VRAM
  quantity: z.number().int().min(1).max(1000), // Up to 1000 GPUs (datacenter)
  interconnect: z.string().max(50).nullish(),
})

const cpuSchema = z.object({
  model: z.string().min(1).max(200),
  vendor: z.string().min(1).max(100),
  cores: z.number().int().min(1).max(10000),
  threads: z.number().int().min(1).max(100000),
  architecture: z.string().max(50).nullish(),
})

const memorySchema = z.object({
  total_mb: z.number().int().min(1).max(100000000), // Up to 100TB RAM
  speed_mhz: z.number().int().min(100).max(100000).nullish(),
  type: z.string().max(20).nullish(), // DDR4, DDR5, etc.
})

const hardwareSchema = z.object({
  os: z.string().min(1).max(100),
  arch: z.string().min(1).max(50),
  gpus: z.array(gpuEntrySchema).max(100).nullish(),
  cpu: cpuSchema.nullish(),
  memory: memorySchema.nullish(),
})

const latencySchema = z.object({
  p50_ms: z.number().min(0).max(1000000).nullish(),
  p90_ms: z.number().min(0).max(1000000).nullish(),
  p99_ms: z.number().min(0).max(1000000).nullish(),
})

const benchmarkSchema = z.object({
  model: z.string().min(1).max(300),
  model_parameters_b: z.number().min(0).max(10000).nullish(), // Up to 10T params
  quantization: z.string().max(50).nullish(),
  context_length: z.number().int().min(1).max(10000000).nullish(),
  backend: z.string().min(1).max(100),
  backend_version: z.string().max(50).nullish(),
  prompt_tokens: z.number().int().min(0).max(100000000).nullish(),
  generation_tokens: z.number().int().min(0).max(100000000).nullish(),
  batch_size: z.number().int().min(1).max(10000).nullish(),
})

const resultsSchema = z.object({
  tokens_per_second: z.number().min(0.001).max(1000000), // Reasonable TPS range
  prefill_tokens_per_second: z.number().min(0).max(100000000).nullish(),
  time_to_first_token_ms: z.number().min(0).max(10000000).nullish(),
  latency: latencySchema.nullish(),
  vram_used_mb: z.number().int().min(0).max(10000000).nullish(),
  ram_used_mb: z.number().int().min(0).max(100000000).nullish(),
  power_draw_watts: z.number().min(0).max(100000).nullish(),
})

const metadataSchema = z.object({
  notes: z.string().max(5000).nullish(),
})

export const submissionPayloadSchema = z.object({
  hardware: hardwareSchema,
  benchmark: benchmarkSchema,
  results: resultsSchema,
  metadata: metadataSchema.nullish(),
  source_url: z.string().url().max(2000).nullish(),
})

export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>

// =============================================================================
// Vote Validation Schema
// =============================================================================

export const votePayloadSchema = z.object({
  type: z.enum(['validate', 'question']),
  reason: z.string().max(2000).optional(),
}).refine(
  (data) => {
    // If type is 'question', reason must be at least 10 characters
    if (data.type === 'question') {
      return data.reason && data.reason.trim().length >= 10
    }
    return true
  },
  {
    message: 'Please provide a reason (at least 10 characters) when questioning a submission',
    path: ['reason'],
  }
)

export type VotePayload = z.infer<typeof votePayloadSchema>

// =============================================================================
// Query Parameter Schemas
// =============================================================================

export const gpuQuerySchema = z.object({
  vendor: z.string().max(100).optional(),
  sort: z.enum(['performance', 'value']).default('performance'),
})

export const leaderboardQuerySchema = z.object({
  model: z.string().max(300).optional(),
  backend: z.string().max(100).optional(),
  gpu_vendor: z.string().max(100).optional(),
  sort_by: z.enum(['tokens_per_second', 'created_at']).default('tokens_per_second'),
})

export const modelQuerySchema = z.object({
  vendor: z.string().max(100).optional(),
})

// =============================================================================
// Validation Helpers
// =============================================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Validate request body against a Zod schema
 * Returns a formatted error message if validation fails
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return { success: false, error: 'Invalid JSON in request body' }
  }

  const result = schema.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues.map((e) => {
      const path = e.path.join('.')
      return path ? `${path}: ${e.message}` : e.message
    })
    return { success: false, error: errors.join('; ') }
  }

  return { success: true, data: result.data }
}

/**
 * Parse query parameters against a Zod schema
 */
export function parseQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const params: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    if (value) params[key] = value
  })

  const result = schema.safeParse(params)

  if (!result.success) {
    const errors = result.error.issues.map((e) => {
      const path = e.path.join('.')
      return path ? `${path}: ${e.message}` : e.message
    })
    return { success: false, error: errors.join('; ') }
  }

  return { success: true, data: result.data }
}
