import { pgTable, uuid, text, integer, real, timestamp, index, boolean, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// =============================================================================
// HARDWARE CATALOG TABLES
// =============================================================================

export const gpus = pgTable('gpus', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // Identity
  name: text('name').unique().notNull(),
  vendor: text('vendor').notNull(), // NVIDIA, AMD, Apple, Intel
  architecture: text('architecture'), // Ada Lovelace, RDNA3, etc.

  // Specs
  vramMb: integer('vram_mb').notNull(),
  memoryBandwidthGbps: real('memory_bandwidth_gbps'), // Critical for LLM inference
  tdpWatts: integer('tdp_watts'),

  // Pricing
  msrpUsd: integer('msrp_usd'), // Launch MSRP
  currentPriceUsd: integer('current_price_usd'), // Current market price (can be updated)

  // Metadata
  releaseDate: timestamp('release_date', { withTimezone: true }),

  // Aggregated stats (computed from submissions)
  submissionCount: integer('submission_count').default(0).notNull(),
  avgScore: real('avg_score').default(0).notNull(),
  avgTokensPerSecond: real('avg_tokens_per_second').default(0).notNull(),
}, (table) => [
  index('idx_gpus_avg_score').on(table.avgScore),
  index('idx_gpus_vendor').on(table.vendor),
  index('idx_gpus_vram').on(table.vramMb),
  index('idx_gpus_msrp').on(table.msrpUsd),
])

export const cpus = pgTable('cpus', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // Identity
  name: text('name').unique().notNull(),
  vendor: text('vendor').notNull(), // Intel, AMD, Apple
  architecture: text('architecture'), // Zen 4, Raptor Lake, etc.

  // Specs
  cores: integer('cores').notNull(),
  threads: integer('threads').notNull(),
  baseClockMhz: integer('base_clock_mhz'),
  boostClockMhz: integer('boost_clock_mhz'),
  l3CacheMb: integer('l3_cache_mb'), // Important for CPU inference
  tdpWatts: integer('tdp_watts'),

  // Pricing
  msrpUsd: integer('msrp_usd'),
  currentPriceUsd: integer('current_price_usd'),

  // Metadata
  releaseDate: timestamp('release_date', { withTimezone: true }),

  // Aggregated stats
  submissionCount: integer('submission_count').default(0).notNull(),
  avgScore: real('avg_score').default(0).notNull(),
  avgTokensPerSecond: real('avg_tokens_per_second').default(0).notNull(),
}, (table) => [
  index('idx_cpus_avg_score').on(table.avgScore),
  index('idx_cpus_vendor').on(table.vendor),
  index('idx_cpus_cores').on(table.cores),
  index('idx_cpus_msrp').on(table.msrpUsd),
])

export const models = pgTable('models', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // Identity
  name: text('name').unique().notNull(), // e.g., "meta-llama/Llama-3.1-8B-Instruct"
  displayName: text('display_name').notNull(), // e.g., "Llama 3.1 8B Instruct"
  vendor: text('vendor').notNull(), // Meta, Mistral, Google, etc.

  // Model specs
  parametersB: real('parameters_b').notNull(), // 7, 13, 70, etc.
  contextLength: integer('context_length'), // 4096, 8192, 128000, etc.

  // Metadata
  releaseDate: timestamp('release_date', { withTimezone: true }),
  huggingfaceUrl: text('huggingface_url'),

  // Aggregated stats
  submissionCount: integer('submission_count').default(0).notNull(),
  avgScore: real('avg_score').default(0).notNull(),
  avgTokensPerSecond: real('avg_tokens_per_second').default(0).notNull(),
}, (table) => [
  index('idx_models_name').on(table.name),
  index('idx_models_vendor').on(table.vendor),
  index('idx_models_params').on(table.parametersB),
])

// =============================================================================
// SUBMISSIONS TABLE
// =============================================================================

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  // --- Hardware Setup ---
  // GPU info is now in submission_gpus junction table
  // These fields store computed totals for easy querying
  totalGpuCount: integer('total_gpu_count').default(0).notNull(),
  totalVramMb: integer('total_vram_mb').default(0).notNull(),
  primaryGpuName: text('primary_gpu_name'), // For display purposes (first/main GPU)

  // CPU (optional - at least one GPU or CPU required)
  cpuName: text('cpu_name'),
  cpuVendor: text('cpu_vendor'),
  cpuCores: integer('cpu_cores'),
  cpuThreads: integer('cpu_threads'),

  // RAM (optional)
  ramMb: integer('ram_mb'),
  ramSpeedMhz: integer('ram_speed_mhz'), // DDR speed
  ramType: text('ram_type'), // DDR4, DDR5, etc.

  // System
  os: text('os').notNull(),
  arch: text('arch').notNull(),

  // --- Benchmark Configuration ---
  model: text('model').notNull(), // HuggingFace model ID
  modelParametersB: real('model_parameters_b'), // Redundant but useful for queries
  quantization: text('quantization'), // FP16, INT8, INT4, Q4_K_M, AWQ, GPTQ, etc.
  contextLength: integer('context_length'), // Context length used in benchmark

  backend: text('backend').notNull(), // vLLM, llama.cpp, transformers, etc.
  backendVersion: text('backend_version'), // e.g., "0.4.1"

  // --- Benchmark Parameters ---
  promptTokens: integer('prompt_tokens'), // Input tokens
  generationTokens: integer('generation_tokens'), // Output tokens generated
  batchSize: integer('batch_size').default(1),

  // --- Results ---
  // Speed metrics
  tokensPerSecond: real('tokens_per_second').notNull(), // Generation speed
  prefillTokensPerSecond: real('prefill_tokens_per_second'), // Prompt processing speed
  timeToFirstTokenMs: real('time_to_first_token_ms'),

  // Latency metrics
  latencyP50Ms: real('latency_p50_ms'),
  latencyP90Ms: real('latency_p90_ms'),
  latencyP99Ms: real('latency_p99_ms'),

  // Resource usage
  vramUsedMb: integer('vram_used_mb'), // Peak VRAM during inference
  ramUsedMb: integer('ram_used_mb'), // Peak RAM during inference
  powerDrawWatts: real('power_draw_watts'), // Measured power consumption

  // Computed score
  score: integer('score').notNull(),

  // --- Metadata ---
  submitterNotes: text('submitter_notes'), // Optional notes from submitter
  verified: boolean('verified').default(false), // For future verification system
  sourceUrl: text('source_url'), // Link to original source (Reddit, GitHub, forum post, etc.)

  // --- Community Feedback ---
  validationCount: integer('validation_count').default(0).notNull(),
  questionCount: integer('question_count').default(0).notNull(),
}, (table) => [
  index('idx_submissions_score').on(table.score),
  index('idx_submissions_primary_gpu').on(table.primaryGpuName),
  index('idx_submissions_cpu_name').on(table.cpuName),
  index('idx_submissions_model').on(table.model),
  index('idx_submissions_backend').on(table.backend),
  index('idx_submissions_quantization').on(table.quantization),
  index('idx_submissions_created_at').on(table.createdAt),
  index('idx_submissions_total_gpu_count').on(table.totalGpuCount),
  index('idx_submissions_total_vram').on(table.totalVramMb),
  index('idx_submissions_params').on(table.modelParametersB),
])

// =============================================================================
// JUNCTION TABLE FOR MULTI-GPU SUPPORT
// =============================================================================

export const submissionGpus = pgTable('submission_gpus', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),

  // GPU info
  gpuName: text('gpu_name').notNull(),
  gpuVendor: text('gpu_vendor').notNull(),
  gpuVramMb: integer('gpu_vram_mb').notNull(),

  // Quantity of this GPU type
  quantity: integer('quantity').default(1).notNull(),

  // Optional: interconnect info for this GPU set
  interconnect: text('interconnect'), // NVLink, PCIe, etc.
}, (table) => [
  index('idx_submission_gpus_submission_id').on(table.submissionId),
  index('idx_submission_gpus_gpu_name').on(table.gpuName),
])

// =============================================================================
// SUBMISSION QUESTIONS (for flagged submissions)
// =============================================================================

export const submissionQuestions = pgTable('submission_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(), // Why the submission seems questionable
  resolved: boolean('resolved').default(false).notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolverNotes: text('resolver_notes'), // Notes from reviewer when resolving
}, (table) => [
  index('idx_submission_questions_submission_id').on(table.submissionId),
  index('idx_submission_questions_resolved').on(table.resolved),
])

// =============================================================================
// RELATIONS
// =============================================================================

export const submissionsRelations = relations(submissions, ({ many }) => ({
  gpus: many(submissionGpus),
  questions: many(submissionQuestions),
}))

export const submissionQuestionsRelations = relations(submissionQuestions, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionQuestions.submissionId],
    references: [submissions.id],
  }),
}))

export const submissionGpusRelations = relations(submissionGpus, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionGpus.submissionId],
    references: [submissions.id],
  }),
}))

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert

export type SubmissionGpu = typeof submissionGpus.$inferSelect
export type NewSubmissionGpu = typeof submissionGpus.$inferInsert

export type GPU = typeof gpus.$inferSelect
export type NewGPU = typeof gpus.$inferInsert

export type CPU = typeof cpus.$inferSelect
export type NewCPU = typeof cpus.$inferInsert

export type Model = typeof models.$inferSelect
export type NewModel = typeof models.$inferInsert

export type SubmissionQuestion = typeof submissionQuestions.$inferSelect
export type NewSubmissionQuestion = typeof submissionQuestions.$inferInsert
