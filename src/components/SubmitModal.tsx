'use client'

import { useEffect, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { GPU_LIST, CPU_LIST, RAM_OPTIONS, MODEL_LIST, BACKEND_LIST, OS_LIST } from '@/lib/hardware-data'
import { submitBenchmark } from '@/lib/api'

interface SubmitModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SubmitModal({ isOpen, onClose }: SubmitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    gpuName: '',
    cpuName: '',
    ramMb: '',
    os: 'linux',
    model: '',
    backend: 'transformers',
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

  // Get selected GPU/CPU specs automatically
  const selectedGPU = useMemo(() =>
    GPU_LIST.find(g => g.name === formData.gpuName),
    [formData.gpuName]
  )

  const selectedCPU = useMemo(() =>
    CPU_LIST.find(c => c.name === formData.cpuName),
    [formData.cpuName]
  )

  // Auto-select matching CPU when unified SoC GPU is selected
  useEffect(() => {
    if (formData.gpuName && isUnifiedSoC(formData.gpuName)) {
      // For unified SoCs, the CPU name matches the GPU name
      const matchingCpu = CPU_LIST.find(c => c.name === formData.gpuName)
      if (matchingCpu && formData.cpuName !== formData.gpuName) {
        setFormData(prev => ({ ...prev, cpuName: formData.gpuName }))
      }
    }
  }, [formData.gpuName])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    const payload = {
      hardware: {
        os: formData.os,
        arch: 'x86_64',
        gpus: selectedGPU ? [{
          name: selectedGPU.name,
          vendor: selectedGPU.vendor,
          vram_mb: selectedGPU.vram_mb,
          quantity: 1,
        }] : null,
        cpu: {
          model: selectedCPU?.name || formData.cpuName,
          vendor: selectedCPU?.vendor || 'Unknown',
          cores: selectedCPU?.cores || 1,
          threads: selectedCPU?.threads || 1,
          architecture: 'x86_64',
        },
        memory: {
          total_mb: parseInt(formData.ramMb) || 0,
        },
      },
      benchmark: {
        model: formData.model,
        backend: formData.backend,
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
        setFormData({
          gpuName: '',
          cpuName: '',
          ramMb: '',
          os: 'linux',
          model: '',
          backend: 'transformers',
          tokensPerSecond: '',
          timeToFirstToken: '',
          latencyP50: '',
          latencyP90: '',
          latencyP99: '',
          sourceUrl: '',
        })
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

                    {/* GPU Dropdown */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-stone-700 mb-1">GPU</label>
                      <select
                        name="gpuName"
                        value={formData.gpuName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="">No GPU / CPU Only</option>
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
                      {selectedGPU && (
                        <div className="mt-2 text-xs text-stone-500 flex gap-4">
                          <span>Vendor: <span className="font-medium text-stone-700">{selectedGPU.vendor}</span></span>
                          <span>VRAM: <span className="font-medium text-stone-700">{formatVram(selectedGPU.vram_mb)}</span></span>
                        </div>
                      )}
                    </div>

                    {/* CPU Dropdown */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-stone-700 mb-1">CPU <span className="text-red-500">*</span></label>
                      {formData.gpuName && isUnifiedSoC(formData.gpuName) ? (
                        // Unified SoC - CPU is same as GPU, show as locked
                        <>
                          <div className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm bg-stone-50 text-stone-700">
                            {formData.gpuName}
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
                            required
                            className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                          >
                            <option value="">Select CPU...</option>
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
                        <label className="block text-sm font-medium text-stone-700 mb-1">RAM <span className="text-red-500">*</span></label>
                        <select
                          name="ramMb"
                          value={formData.ramMb}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select RAM...</option>
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
                      disabled={isSubmitting}
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
