import { db, submissions, submissionGpus } from '@/db'
import { desc, eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { parsePaginationParams } from '@/lib/validation'
import { GPU_LIST, CPU_LIST } from '@/lib/hardware-data'

// Create price lookup maps from hardware data
const gpuPriceMap = new Map(GPU_LIST.map(gpu => [gpu.name, gpu.msrp_usd]))
const cpuPriceMap = new Map(CPU_LIST.map(cpu => [cpu.name, cpu.msrp_usd]))

// Estimate RAM cost: ~$3/GB for DDR5, ~$2/GB for DDR4 (rough market average)
function estimateRamCost(ramMb: number): number {
  const ramGb = ramMb / 1024
  const costPerGb = 3 // Assume DDR5 pricing
  return Math.round(ramGb * costPerGb)
}

// Check if this is a unified SoC (Apple Silicon or AMD Ryzen AI Max)
// These have CPU+GPU on the same die, so we shouldn't double-count
function isUnifiedSoC(gpuName: string | null, cpuName: string): boolean {
  if (!gpuName) return false
  // Apple Silicon - GPU and CPU are the same chip
  if (gpuName.startsWith('Apple M')) return true
  // AMD Ryzen AI Max - APU with powerful integrated graphics
  if (gpuName.startsWith('AMD Ryzen AI Max')) return true
  return false
}

// Valid sort options
const VALID_SORT_OPTIONS = ['tokens_per_second', 'created_at', 'value'] as const
type SortOption = typeof VALID_SORT_OPTIONS[number]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const model = searchParams.get('model')
    const backend = searchParams.get('backend')
    const sortParam = searchParams.get('sort')
    const sort: SortOption = sortParam && VALID_SORT_OPTIONS.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : 'tokens_per_second'
    const { limit, offset } = parsePaginationParams(searchParams)

    // Build conditions
    const conditions = []
    if (model) conditions.push(eq(submissions.model, model))
    if (backend) conditions.push(eq(submissions.backend, backend))

    // For value sort, we need to fetch more data and sort in memory
    // For other sorts, we can use DB ordering
    const needsInMemorySort = sort === 'value'

    // Determine sort order for DB query
    const orderBy = sort === 'created_at'
      ? [desc(submissions.createdAt)]
      : [desc(submissions.tokensPerSecond)]

    // Get submissions with their GPUs using the query API
    const data = await db.query.submissions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: needsInMemorySort ? [desc(submissions.tokensPerSecond)] : orderBy,
      limit: needsInMemorySort ? 500 : limit, // Fetch more for in-memory sort
      offset: needsInMemorySort ? 0 : offset,
      with: {
        gpus: true,
      },
    })

    // Format response with value calculation
    let entries = data.map((sub) => {
      // Check if this is a unified SoC (Apple Silicon, AMD Ryzen AI Max)
      const unifiedSoC = isUnifiedSoC(sub.primaryGpuName, sub.cpuName)

      // Calculate component costs
      const gpuMsrp = sub.primaryGpuName ? gpuPriceMap.get(sub.primaryGpuName) : null
      const cpuMsrp = cpuPriceMap.get(sub.cpuName)

      // For unified SoCs, RAM is included in the chip price (unified memory)
      // For discrete systems, estimate RAM cost separately
      const ramCost = unifiedSoC ? 0 : estimateRamCost(sub.ramMb)

      // Calculate total GPU cost (multiply by quantity for multi-GPU setups)
      let totalGpuCost: number | null = null
      if (sub.gpus.length > 0) {
        totalGpuCost = 0
        for (const gpu of sub.gpus) {
          const price = gpuPriceMap.get(gpu.gpuName)
          if (price) {
            totalGpuCost += price * gpu.quantity
          }
        }
        if (totalGpuCost === 0) totalGpuCost = null
      }

      // Calculate total system cost
      // For unified SoCs: use only the SoC price (GPU entry), don't add CPU separately
      // For discrete systems: GPU + CPU + RAM
      let totalSystemCost: number
      if (unifiedSoC) {
        // SoC price includes CPU, GPU, and unified memory
        totalSystemCost = totalGpuCost || 0
      } else {
        totalSystemCost = (totalGpuCost || 0) + (cpuMsrp || 0) + ramCost
      }

      // Value score based on total system cost
      const valueScore = totalSystemCost > 0 && sub.tokensPerSecond > 0
        ? Math.round((sub.tokensPerSecond / totalSystemCost) * 1000) / 1000 // tok/s per $1
        : null

      return {
        submission_id: sub.id,
        rank: 0, // Will be set after sorting
        // GPU info
        gpu_name: sub.primaryGpuName,
        total_gpu_count: sub.totalGpuCount,
        total_vram_mb: sub.totalVramMb,
        gpus: sub.gpus.map(g => ({
          name: g.gpuName,
          vendor: g.gpuVendor,
          vram_mb: g.gpuVramMb,
          quantity: g.quantity,
          interconnect: g.interconnect,
        })),
        // CPU info
        cpu_name: sub.cpuName,
        // RAM info
        ram_mb: sub.ramMb,
        // Benchmark config
        model: sub.model,
        model_parameters_b: sub.modelParametersB,
        quantization: sub.quantization,
        backend: sub.backend,
        // Results
        tokens_per_second: sub.tokensPerSecond,
        created_at: sub.createdAt.toISOString(),
        // Cost breakdown
        is_unified_soc: unifiedSoC,
        gpu_msrp_usd: totalGpuCost,
        cpu_msrp_usd: unifiedSoC ? null : (cpuMsrp || null), // Don't show separate CPU cost for SoCs
        ram_cost_usd: ramCost,
        total_system_cost_usd: totalSystemCost > 0 ? totalSystemCost : null,
        value_score: valueScore,
      }
    })

    // Sort by value if needed (best value first, nulls last)
    if (sort === 'value') {
      entries.sort((a, b) => {
        if (a.value_score === null && b.value_score === null) return 0
        if (a.value_score === null) return 1
        if (b.value_score === null) return -1
        return b.value_score - a.value_score
      })
      // Apply pagination after sorting
      entries = entries.slice(offset, offset + limit)
    }

    // Add ranks
    entries = entries.map((entry, index) => ({
      ...entry,
      rank: offset + index + 1,
    }))

    return NextResponse.json(entries)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
