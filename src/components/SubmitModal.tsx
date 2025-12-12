'use client'

import { useEffect, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { GPU_LIST, CPU_LIST, RAM_OPTIONS, MODEL_LIST, BACKEND_LIST, OS_LIST } from '@/lib/hardware-data'
import { submitBenchmark } from '@/lib/api'

interface SubmitModalProps {
  isOpen: boolean
  onClose: () => void
}

interface GpuEntry {
  id: string
  name: string
  quantity: number
}

export function SubmitModal({ isOpen, onClose }: SubmitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [gpuEntries, setGpuEntries] = useState<GpuEntry[]>([])
  const [formData, setFormData] = useState({
    cpuName: '',
    ramMb: '',
    os: 'linux',
    model: '',
    backend: 'transformers',
    quantization: '',
    tokensPerSecond: '',
    timeToFirstToken: '',
    latencyP50: '',
    latencyP90: '',
    latencyP99: '',
    sourceUrl: '',
  })

  // Check if this is a unified SoC (Apple Silicon or AMD Ryzen AI Max)
  const isUnifiedSoC = (gpuName: string) => {
    return gpuName.startsWith('Apple M') || gpuName.startsWith('AMD Ryzen AI Max')
  }

  // Check if any GPU is a unified SoC
  const hasUnifiedSoC = useMemo(() => {
    return gpuEntries.some(entry => isUnifiedSoC(entry.name))
  }, [gpuEntries])

  // Get the unified SoC name if present
  const unifiedSoCName = useMemo(() => {
    const socEntry = gpuEntries.find(entry => isUnifiedSoC(entry.name))
    return socEntry?.name || null
  }, [gpuEntries])

  // Get selected CPU specs
  const selectedCPU = useMemo(() =>
    CPU_LIST.find(c => c.name === formData.cpuName),
    [formData.cpuName]
  )

  // Validation: at least one GPU or CPU required
  const hasHardware = gpuEntries.length > 0 || formData.cpuName !== ''

  // Auto-select matching CPU when unified SoC GPU is selected
  useEffect(() => {
    if (unifiedSoCName) {
      const matchingCpu = CPU_LIST.find(c => c.name === unifiedSoCName)
      if (matchingCpu && formData.cpuName !== unifiedSoCName) {
        setFormData(prev => ({ ...prev, cpuName: unifiedSoCName }))
      }
    }
  }, [unifiedSoCName])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const formatVram = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(0)} GB`
    }
    return `${mb} MB`
  }

  const addGpu = () => {
    setGpuEntries(prev => [...prev, { id: crypto.randomUUID(), name: '', quantity: 1 }])
  }

  const removeGpu = (id: string) => {
    setGpuEntries(prev => prev.filter(entry => entry.id !== id))
  }

  const updateGpu = (id: string, field: 'name' | 'quantity', value: string | number) => {
    setGpuEntries(prev => prev.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ))
  }

  const resetForm = () => {
    setGpuEntries([])
    setFormData({
      cpuName: '',
      ramMb: '',
      os: 'linux',
      model: '',
      backend: 'transformers',
      quantization: '',
      tokensPerSecond: '',
      timeToFirstToken: '',
      latencyP50: '',
      latencyP90: '',
      latencyP99: '',
      sourceUrl: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasHardware) {
      setSubmitError('Please select at least one GPU or CPU')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    // Build GPU array
    const gpus = gpuEntries
      .filter(entry => entry.name)
      .map(entry => {
        const gpuSpec = GPU_LIST.find(g => g.name === entry.name)
        return gpuSpec ? {
          name: gpuSpec.name,
          vendor: gpuSpec.vendor as string,
          vram_mb: gpuSpec.vram_mb,
          quantity: entry.quantity,
        } : null
      })
      .filter((gpu): gpu is NonNullable<typeof gpu> => gpu !== null)

    // Build CPU object (optional)
    const cpu = formData.cpuName ? {
      model: selectedCPU?.name || formData.cpuName,
      vendor: selectedCPU?.vendor || 'Unknown',
      cores: selectedCPU?.cores || 1,
      threads: selectedCPU?.threads || 1,
      architecture: selectedCPU?.architecture || 'unknown',
    } : null

    // Build memory object (optional)
    const memory = formData.ramMb ? {
      total_mb: parseInt(formData.ramMb),
    } : null

    const payload = {
      hardware: {
        os: formData.os,
        arch: 'x86_64',
        gpus: gpus.length > 0 ? gpus : null,
        cpu,
        memory,
      },
      benchmark: {
        model: formData.model,
        backend: formData.backend,
        quantization: formData.quantization || null,
      },
      results: {
        tokens_per_second: parseFloat(formData.tokensPerSecond) || 0,
        time_to_first_token_ms: parseFloat(formData.timeToFirstToken) || null,
        latency: {
          p50_ms: parseFloat(formData.latencyP50) || null,
          p90_ms: parseFloat(formData.latencyP90) || null,
          p99_ms: parseFloat(formData.latencyP99) || null,
        },
      },
      source_url: formData.sourceUrl.trim() || null,
    }

    try {
      await submitBenchmark(payload)

      setSubmitSuccess(true)
      setTimeout(() => {
        onClose()
        setSubmitSuccess(false)
        resetForm()
      }, 2000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Group GPUs by vendor
  const gpusByVendor = GPU_LIST.reduce((acc, gpu) => {
    if (!acc[gpu.vendor]) acc[gpu.vendor] = []
    acc[gpu.vendor].push(gpu)
    return acc
  }, {} as Record<string, typeof GPU_LIST>)

  // Group CPUs by vendor
  const cpusByVendor = CPU_LIST.reduce((acc, cpu) => {
    if (!acc[cpu.vendor]) acc[cpu.vendor] = []
    acc[cpu.vendor].push(cpu)
    return acc
  }, {} as Record<string, typeof CPU_LIST>)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">Submit Benchmark Result</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {submitSuccess ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">Submitted Successfully!</h3>
                  <p className="text-stone-500">Your benchmark result has been added to the leaderboard.</p>
                </div>
              ) : (
                <>
                  {/* Hardware Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">Hardware</h3>
                    <p className="text-xs text-stone-500 mb-4">At least one GPU or CPU is required.</p>

                    {/* GPU List */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-stone-700">GPUs</label>
                        <button
                          type="button"
                          onClick={addGpu}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          + Add GPU
                        </button>
                      </div>

                      {gpuEntries.length === 0 ? (
                        <div className="text-sm text-stone-400 italic py-2">
                          No GPUs added (CPU-only benchmark)
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {gpuEntries.map((entry) => {
                            const gpuSpec = GPU_LIST.find(g => g.name === entry.name)
                            return (
                              <div key={entry.id} className="flex gap-2 items-start">
                                <select
                                  value={entry.name}
                                  onChange={(e) => updateGpu(entry.id, 'name', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                >
                                  <option value="">Select GPU...</option>
                                  {Object.entries(gpusByVendor).map(([vendor, gpus]) => (
                                    <optgroup key={vendor} label={vendor}>
                                      {gpus.map(gpu => (
                                        <option key={gpu.name} value={gpu.name}>
                                          {gpu.name} ({formatVram(gpu.vram_mb)})
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                                <div className="w-20">
                                  <select
                                    value={entry.quantity}
                                    onChange={(e) => updateGpu(entry.id, 'quantity', parseInt(e.target.value))}
                                    className="w-full px-2 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                  >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                      <option key={n} value={n}>{n}x</option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeGpu(entry.id)}
                                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {gpuEntries.length > 0 && gpuEntries.some(e => e.name) && (
                        <div className="mt-2 text-xs text-stone-500">
                          Total: {gpuEntries.filter(e => e.name).reduce((sum, e) => sum + e.quantity, 0)} GPU(s)
                        </div>
                      )}
                    </div>

                    {/* CPU Dropdown */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-stone-700 mb-1">CPU</label>
                      {hasUnifiedSoC ? (
                        // Unified SoC - CPU is same as GPU, show as locked
                        <>
                          <div className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm bg-stone-50 text-stone-700">
                            {unifiedSoCName}
                          </div>
                          <div className="mt-2 text-xs text-stone-500 italic">
                            Unified SoC - CPU is integrated with the selected chip
                          </div>
                        </>
                      ) : (
                        // Discrete system - show CPU dropdown
                        <>
                          <select
                            name="cpuName"
                            value={formData.cpuName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                          >
                            <option value="">Select CPU (optional)...</option>
                            {Object.entries(cpusByVendor).map(([vendor, cpus]) => (
                              <optgroup key={vendor} label={vendor}>
                                {cpus.map(cpu => (
                                  <option key={cpu.name} value={cpu.name}>
                                    {cpu.name} ({cpu.cores}C/{cpu.threads}T)
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          {selectedCPU && (
                            <div className="mt-2 text-xs text-stone-500 flex gap-4">
                              <span>Vendor: <span className="font-medium text-stone-700">{selectedCPU.vendor}</span></span>
                              <span>Cores: <span className="font-medium text-stone-700">{selectedCPU.cores}</span></span>
                              <span>Threads: <span className="font-medium text-stone-700">{selectedCPU.threads}</span></span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* RAM and OS */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">RAM</label>
                        <select
                          name="ramMb"
                          value={formData.ramMb}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select RAM (optional)...</option>
                          {RAM_OPTIONS.map(ram => (
                            <option key={ram.value} value={ram.value}>
                              {ram.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Operating System</label>
                        <select
                          name="os"
                          value={formData.os}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        >
                          {OS_LIST.map(os => (
                            <option key={os.value} value={os.value}>
                              {os.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Validation warning */}
                    {!hasHardware && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">Please add at least one GPU or select a CPU.</p>
                      </div>
                    )}
                  </div>

                  {/* Benchmark Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">Benchmark Results</h3>

                    {/* Model and Backend */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Model <span className="text-red-500">*</span></label>
                        <select
                          name="model"
                          value={formData.model}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select Model...</option>
                          {MODEL_LIST.map(model => (
                            <option key={model.name} value={model.name}>
                              {model.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Backend</label>
                        <select
                          name="backend"
                          value={formData.backend}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        >
                          {BACKEND_LIST.map(backend => (
                            <option key={backend.value} value={backend.value}>
                              {backend.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quantization */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-stone-700 mb-1">Quantization</label>
                      <select
                        name="quantization"
                        value={formData.quantization}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="">None / Not specified</option>
                        <option value="FP32">FP32 (32-bit floating point)</option>
                        <option value="FP16">FP16 (16-bit floating point)</option>
                        <option value="BF16">BF16 (Brain float 16)</option>
                        <option value="INT8">INT8 (8-bit integer)</option>
                        <option value="INT4">INT4 (4-bit integer)</option>
                        <option value="AWQ">AWQ (Activation-aware Weight Quantization)</option>
                        <option value="GPTQ">GPTQ (Post-training quantization)</option>
                        <option value="GGUF">GGUF (llama.cpp format)</option>
                      </select>
                      <p className="mt-1 text-xs text-stone-500">
                        Select the quantization format used for the model weights
                      </p>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Tokens/sec <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          step="0.01"
                          name="tokensPerSecond"
                          value={formData.tokensPerSecond}
                          onChange={handleInputChange}
                          placeholder="e.g., 45.5"
                          required
                          className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Time to First Token (ms)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="timeToFirstToken"
                          value={formData.timeToFirstToken}
                          onChange={handleInputChange}
                          placeholder="e.g., 150"
                          className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Latency */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Latency P50 (ms)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="latencyP50"
                          value={formData.latencyP50}
                          onChange={handleInputChange}
                          placeholder="e.g., 22"
                          className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Latency P90 (ms)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="latencyP90"
                          value={formData.latencyP90}
                          onChange={handleInputChange}
                          placeholder="e.g., 35"
                          className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Latency P99 (ms)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="latencyP99"
                          value={formData.latencyP99}
                          onChange={handleInputChange}
                          placeholder="e.g., 50"
                          className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Source URL */}
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">Source (Optional)</h3>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Source URL</label>
                      <input
                        type="url"
                        name="sourceUrl"
                        value={formData.sourceUrl}
                        onChange={handleInputChange}
                        placeholder="e.g., https://reddit.com/r/LocalLLaMA/..."
                        className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-stone-500">
                        Link to the original post if this data comes from Reddit, GitHub, or another source
                      </p>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !hasHardware}
                      className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium rounded transition-colors"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Result'}
                    </button>
                  </div>
                </>
              )}
            </form>
        </div>
      </div>
    </div>
  )
}
