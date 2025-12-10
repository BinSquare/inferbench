import { pgTable, uuid, text, integer, real, timestamp, index, boolean, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// =============================================================================
// SUBMISSIONS TABLE
// =============================================================================
// This is the primary table - all GPU/CPU/Model stats are computed dynamically
// from submissions data. Hardware specs come from src/lib/hardware-data.ts.
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

export type SubmissionQuestion = typeof submissionQuestions.$inferSelect
export type NewSubmissionQuestion = typeof submissionQuestions.$inferInsert
