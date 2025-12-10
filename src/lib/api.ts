// API calls now go through Next.js API routes
const API_BASE = '/api'

export interface LeaderboardEntry {
  rank: number
  submission_id: string
  // GPU info
  gpu_name: string | null
  total_gpu_count: number
  total_vram_mb: number
  gpus: Array<{
    name: string
    vendor: string
    vram_mb: number
    quantity: number
    interconnect: string | null
  }>
  // CPU info
  cpu_name: string | null
  // RAM info
  ram_mb: number | null
  // Benchmark config
  model: string
  model_parameters_b: number | null
  quantization: string | null
  backend: string
  // Results
  tokens_per_second: number
  created_at: string
  // Metadata
  source_url: string | null
  // Verification status
  verified: boolean
  validation_count: number
  question_count: number
  // Cost breakdown
  is_unified_soc: boolean
  gpu_msrp_usd: number | null
  cpu_msrp_usd: number | null
  ram_cost_usd: number
  total_system_cost_usd: number | null
  value_score: number | null
}

export interface GPURanking {
  rank: number
  name: string
  vendor: string
  vram_mb: number
  submission_count: number
  avg_tokens_per_second: number
  percentile: number
  msrp_usd: number | null
  value_score: number | null // tok/s per $1
}

export interface CPURanking {
  rank: number
  name: string
  vendor: string
  cores: number
  threads: number
  submission_count: number
  avg_score: number
  avg_tokens_per_second: number
  percentile: number
}

export interface GPUDetail extends GPURanking {
  architecture?: string
  all_submissions: Array<{
    id: string
    cpu_name: string
    model: string
    model_parameters_b: number | null
    quantization: string | null
    backend: string
    context_length: number | null
    tokens_per_second: number
    prefill_tokens_per_second: number | null
    created_at: string
  }>
}

export interface CPUDetail extends CPURanking {
  recent_submissions: Array<{
    id: string
    model: string
    backend: string
    tokens_per_second: number
    score: number
    created_at: string
    gpu_name: string | null
  }>
}

export async function fetchLeaderboard(params?: {
  limit?: number
  offset?: number
  model?: string
  backend?: string
  sort?: 'tokens_per_second' | 'created_at' | 'value'
}): Promise<LeaderboardEntry[]> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())
  if (params?.model) searchParams.set('model', params.model)
  if (params?.backend) searchParams.set('backend', params.backend)
  if (params?.sort) searchParams.set('sort', params.sort)

  const res = await fetch(`${API_BASE}/leaderboard?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}

export async function fetchGPURankings(params?: {
  vendor?: string
  sort?: 'performance' | 'value'
  limit?: number
  offset?: number
}): Promise<GPURanking[]> {
  const searchParams = new URLSearchParams()
  if (params?.vendor) searchParams.set('vendor', params.vendor)
  if (params?.sort) searchParams.set('sort', params.sort)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const res = await fetch(`${API_BASE}/gpus?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch GPU rankings')
  return res.json()
}

export async function fetchCPURankings(params?: {
  vendor?: string
  gpu?: string
  limit?: number
  offset?: number
}): Promise<CPURanking[]> {
  const searchParams = new URLSearchParams()
  if (params?.vendor) searchParams.set('vendor', params.vendor)
  if (params?.gpu) searchParams.set('gpu', params.gpu)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const res = await fetch(`${API_BASE}/cpus?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch CPU rankings')
  return res.json()
}

export async function fetchGPUDetail(name: string): Promise<GPUDetail> {
  const res = await fetch(`${API_BASE}/gpus/${encodeURIComponent(name)}`)
  if (!res.ok) {
    if (res.status === 404) {
      return { error: 'GPU not found' } as any
    }
    throw new Error('Failed to fetch GPU detail')
  }
  return res.json()
}

export async function fetchCPUDetail(name: string): Promise<CPUDetail> {
  const res = await fetch(`${API_BASE}/cpus/${encodeURIComponent(name)}`)
  if (!res.ok) {
    if (res.status === 404) {
      return { error: 'CPU not found' } as any
    }
    throw new Error('Failed to fetch CPU detail')
  }
  return res.json()
}

export interface ModelRanking {
  rank: number
  id: string
  name: string
  display_name: string
  vendor: string
  parameters_b: number
  context_length: number | null
  submission_count: number
  avg_tokens_per_second: number
  percentile: number
}

export interface ModelDetail extends ModelRanking {
  huggingface_url: string | null
  all_submissions: Array<{
    id: string
    gpu_name: string | null
    cpu_name: string
    quantization: string | null
    backend: string
    context_length: number | null
    tokens_per_second: number
    prefill_tokens_per_second: number | null
    total_vram_mb: number
    created_at: string
  }>
}

export async function fetchModelRankings(params?: {
  vendor?: string
  limit?: number
  offset?: number
}): Promise<ModelRanking[]> {
  const searchParams = new URLSearchParams()
  if (params?.vendor) searchParams.set('vendor', params.vendor)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const res = await fetch(`${API_BASE}/models?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch model rankings')
  return res.json()
}

export async function fetchModelDetail(name: string): Promise<ModelDetail> {
  const res = await fetch(`${API_BASE}/models/${encodeURIComponent(name)}`)
  if (!res.ok) {
    if (res.status === 404) {
      return { error: 'Model not found' } as any
    }
    throw new Error('Failed to fetch model detail')
  }
  return res.json()
}

export interface Stats {
  total_submissions: number
  total_gpus: number
  total_cpus: number
  average_tokens_per_second: number
  top_performers: Array<{
    gpu: string
    tokens_per_second: number
  }>
}

export interface ModelOption {
  model: string
  count: number
}

export interface BackendOption {
  backend: string
  count: number
}

export interface VendorOption {
  vendor: string
  count: number
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchModels(): Promise<ModelOption[]> {
  const res = await fetch(`${API_BASE}/filters/models`)
  if (!res.ok) throw new Error('Failed to fetch models')
  return res.json()
}

export async function fetchBackends(): Promise<BackendOption[]> {
  const res = await fetch(`${API_BASE}/filters/backends`)
  if (!res.ok) throw new Error('Failed to fetch backends')
  return res.json()
}

export async function fetchVendors(): Promise<VendorOption[]> {
  const res = await fetch(`${API_BASE}/filters/vendors`)
  if (!res.ok) throw new Error('Failed to fetch vendors')
  return res.json()
}

export interface GPUComparison {
  comparisons: GPURanking[]
}

export async function compareGPUs(names: string[]): Promise<GPUComparison> {
  const searchParams = new URLSearchParams()
  names.forEach(name => searchParams.append('names', name))

  const res = await fetch(`${API_BASE}/gpus/compare?${searchParams}`)
  if (!res.ok) throw new Error('Failed to compare GPUs')
  return res.json()
}

export async function submitBenchmark(payload: {
  hardware: {
    os: string
    arch: string
    gpus?: Array<{
      name: string
      vendor: string
      vram_mb: number
      quantity: number
    }> | null
    cpu?: {
      model: string
      vendor: string
      cores: number
      threads: number
      architecture: string
    } | null
    memory?: {
      total_mb: number
    } | null
  }
  benchmark: {
    model: string
    backend: string
  }
  results: {
    tokens_per_second: number
    time_to_first_token_ms?: number | null
    latency?: {
      p50_ms?: number | null
      p90_ms?: number | null
      p99_ms?: number | null
    }
  }
  source_url?: string | null
}): Promise<{ success: boolean; submission_id: string }> {
  const res = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Submission failed')
  }

  return res.json()
}
