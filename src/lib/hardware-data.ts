export interface GPUSpec {
  name: string
  vendor: 'NVIDIA' | 'AMD' | 'Apple' | 'Intel'
  vram_mb: number
  memory_bandwidth_gbps?: number
  tdp_watts?: number
  architecture?: string
  msrp_usd?: number
}

export interface CPUSpec {
  name: string
  vendor: 'Intel' | 'AMD' | 'Apple'
  cores: number
  threads: number
  base_clock_mhz?: number
  boost_clock_mhz?: number
  l3_cache_mb?: number
  tdp_watts?: number
  architecture?: string
  msrp_usd?: number
}

export interface ModelSpec {
  name: string
  displayName: string
  vendor: string
  parameters_b: number
  context_length?: number
}

export const GPU_LIST: GPUSpec[] = [
  // NVIDIA - RTX 50 Series (Blackwell)
  { name: 'NVIDIA RTX 5090', vendor: 'NVIDIA', vram_mb: 32768, memory_bandwidth_gbps: 1792, tdp_watts: 575, architecture: 'Blackwell', msrp_usd: 1999 },
  { name: 'NVIDIA RTX 5080', vendor: 'NVIDIA', vram_mb: 16384, memory_bandwidth_gbps: 960, tdp_watts: 360, architecture: 'Blackwell', msrp_usd: 999 },
  { name: 'NVIDIA RTX 5070 Ti', vendor: 'NVIDIA', vram_mb: 16384, memory_bandwidth_gbps: 896, tdp_watts: 300, architecture: 'Blackwell', msrp_usd: 749 },
  { name: 'NVIDIA RTX 5070', vendor: 'NVIDIA', vram_mb: 12288, memory_bandwidth_gbps: 672, tdp_watts: 250, architecture: 'Blackwell', msrp_usd: 549 },

  // NVIDIA - RTX 40 Series
  { name: 'NVIDIA RTX 4090', vendor: 'NVIDIA', vram_mb: 24576, memory_bandwidth_gbps: 1008, tdp_watts: 450, architecture: 'Ada Lovelace', msrp_usd: 1599 },
  { name: 'NVIDIA RTX 4080 SUPER', vendor: 'NVIDIA', vram_mb: 16384, memory_bandwidth_gbps: 736, tdp_watts: 320, architecture: 'Ada Lovelace', msrp_usd: 999 },
  { name: 'NVIDIA RTX 4080', vendor: 'NVIDIA', vram_mb: 16384, memory_bandwidth_gbps: 717, tdp_watts: 320, architecture: 'Ada Lovelace', msrp_usd: 1199 },
  { name: 'NVIDIA RTX 4070 Ti SUPER', vendor: 'NVIDIA', vram_mb: 16384, memory_bandwidth_gbps: 672, tdp_watts: 285, architecture: 'Ada Lovelace', msrp_usd: 799 },
  { name: 'NVIDIA RTX 4070 Ti', vendor: 'NVIDIA', vram_mb: 12288, memory_bandwidth_gbps: 504, tdp_watts: 285, architecture: 'Ada Lovelace', msrp_usd: 799 },
  { name: 'NVIDIA RTX 4070 SUPER', vendor: 'NVIDIA', vram_mb: 12288, memory_bandwidth_gbps: 504, tdp_watts: 220, architecture: 'Ada Lovelace', msrp_usd: 599 },
  { name: 'NVIDIA RTX 4070', vendor: 'NVIDIA', vram_mb: 12288, memory_bandwidth_gbps: 504, tdp_watts: 200, architecture: 'Ada Lovelace', msrp_usd: 549 },
  { name: 'NVIDIA RTX 4060 Ti 16GB', vendor: 'NVIDIA', vram_mb: 16384, memory_bandwidth_gbps: 288, tdp_watts: 165, architecture: 'Ada Lovelace', msrp_usd: 499 },
  { name: 'NVIDIA RTX 4060 Ti 8GB', vendor: 'NVIDIA', vram_mb: 8192, memory_bandwidth_gbps: 288, tdp_watts: 160, architecture: 'Ada Lovelace', msrp_usd: 399 },
  { name: 'NVIDIA RTX 4060', vendor: 'NVIDIA', vram_mb: 8192, memory_bandwidth_gbps: 272, tdp_watts: 115, architecture: 'Ada Lovelace', msrp_usd: 299 },

  // NVIDIA - RTX 30 Series
  { name: 'NVIDIA RTX 3090 Ti', vendor: 'NVIDIA', vram_mb: 24576, memory_bandwidth_gbps: 1008, tdp_watts: 450, architecture: 'Ampere', msrp_usd: 1999 },
  { name: 'NVIDIA RTX 3090', vendor: 'NVIDIA', vram_mb: 24576, memory_bandwidth_gbps: 936, tdp_watts: 350, architecture: 'Ampere', msrp_usd: 1499 },
  { name: 'NVIDIA RTX 3080 Ti', vendor: 'NVIDIA', vram_mb: 12288, memory_bandwidth_gbps: 912, tdp_watts: 350, architecture: 'Ampere', msrp_usd: 1199 },
  { name: 'NVIDIA RTX 3080 12GB', vendor: 'NVIDIA', vram_mb: 12288, memory_bandwidth_gbps: 912, tdp_watts: 350, architecture: 'Ampere', msrp_usd: 799 },
  { name: 'NVIDIA RTX 3080 10GB', vendor: 'NVIDIA', vram_mb: 10240, memory_bandwidth_gbps: 760, tdp_watts: 320, architecture: 'Ampere', msrp_usd: 699 },
  { name: 'NVIDIA RTX 3070 Ti', vendor: 'NVIDIA', vram_mb: 8192, memory_bandwidth_gbps: 608, tdp_watts: 290, architecture: 'Ampere', msrp_usd: 599 },
  { name: 'NVIDIA RTX 3070', vendor: 'NVIDIA', vram_mb: 8192, memory_bandwidth_gbps: 448, tdp_watts: 220, architecture: 'Ampere', msrp_usd: 499 },
  { name: 'NVIDIA RTX 3060 Ti', vendor: 'NVIDIA', vram_mb: 8192, memory_bandwidth_gbps: 448, tdp_watts: 200, architecture: 'Ampere', msrp_usd: 399 },
  { name: 'NVIDIA RTX 3060 12GB', vendor: 'NVIDIA', vram_mb: 12288, memory_bandwidth_gbps: 360, tdp_watts: 170, architecture: 'Ampere', msrp_usd: 329 },

  // NVIDIA - Professional / Data Center (Blackwell)
  { name: 'NVIDIA B200', vendor: 'NVIDIA', vram_mb: 196608, memory_bandwidth_gbps: 8000, tdp_watts: 1000, architecture: 'Blackwell', msrp_usd: 40000 },
  { name: 'NVIDIA B100', vendor: 'NVIDIA', vram_mb: 196608, memory_bandwidth_gbps: 8000, tdp_watts: 700, architecture: 'Blackwell', msrp_usd: 35000 },
  { name: 'NVIDIA GB200 NVL72', vendor: 'NVIDIA', vram_mb: 196608, memory_bandwidth_gbps: 8000, tdp_watts: 1200, architecture: 'Blackwell', msrp_usd: 50000 },

  // NVIDIA - Professional / Data Center (Hopper)
  { name: 'NVIDIA H100 80GB', vendor: 'NVIDIA', vram_mb: 81920, memory_bandwidth_gbps: 3350, tdp_watts: 700, architecture: 'Hopper', msrp_usd: 30000 },
  { name: 'NVIDIA H100 PCIe', vendor: 'NVIDIA', vram_mb: 81920, memory_bandwidth_gbps: 2000, tdp_watts: 350, architecture: 'Hopper', msrp_usd: 25000 },
  { name: 'NVIDIA H200', vendor: 'NVIDIA', vram_mb: 143360, memory_bandwidth_gbps: 4800, tdp_watts: 700, architecture: 'Hopper', msrp_usd: 35000 },
  { name: 'NVIDIA A100 80GB', vendor: 'NVIDIA', vram_mb: 81920, memory_bandwidth_gbps: 2039, tdp_watts: 400, architecture: 'Ampere', msrp_usd: 15000 },
  { name: 'NVIDIA A100 40GB', vendor: 'NVIDIA', vram_mb: 40960, memory_bandwidth_gbps: 1555, tdp_watts: 400, architecture: 'Ampere', msrp_usd: 10000 },
  { name: 'NVIDIA A6000', vendor: 'NVIDIA', vram_mb: 49152, memory_bandwidth_gbps: 768, tdp_watts: 300, architecture: 'Ampere', msrp_usd: 4650 },
  { name: 'NVIDIA A5000', vendor: 'NVIDIA', vram_mb: 24576, memory_bandwidth_gbps: 768, tdp_watts: 230, architecture: 'Ampere', msrp_usd: 2500 },
  { name: 'NVIDIA A4000', vendor: 'NVIDIA', vram_mb: 16384, memory_bandwidth_gbps: 448, tdp_watts: 140, architecture: 'Ampere', msrp_usd: 1000 },
  { name: 'NVIDIA L40S', vendor: 'NVIDIA', vram_mb: 49152, memory_bandwidth_gbps: 864, tdp_watts: 350, architecture: 'Ada Lovelace', msrp_usd: 8000 },
  { name: 'NVIDIA L40', vendor: 'NVIDIA', vram_mb: 49152, memory_bandwidth_gbps: 864, tdp_watts: 300, architecture: 'Ada Lovelace', msrp_usd: 7000 },
  { name: 'NVIDIA L4', vendor: 'NVIDIA', vram_mb: 24576, memory_bandwidth_gbps: 300, tdp_watts: 72, architecture: 'Ada Lovelace', msrp_usd: 2500 },
  { name: 'NVIDIA RTX Pro 6000', vendor: 'NVIDIA', vram_mb: 98304, memory_bandwidth_gbps: 1792, tdp_watts: 350, architecture: 'Blackwell', msrp_usd: 8000 },
  { name: 'NVIDIA RTX PRO 6000 Workstation', vendor: 'NVIDIA', vram_mb: 98304, memory_bandwidth_gbps: 1792, tdp_watts: 350, architecture: 'Blackwell', msrp_usd: 8000 },

  // NVIDIA - DGX Spark (GB10 Grace Blackwell Superchip - Unified Memory System)
  { name: 'NVIDIA DGX Spark', vendor: 'NVIDIA', vram_mb: 131072, memory_bandwidth_gbps: 273, tdp_watts: 140, architecture: 'Blackwell', msrp_usd: 3999 },

  // NVIDIA - Jetson Thor (Blackwell-based robotics supercomputer)
  { name: 'NVIDIA Jetson Thor', vendor: 'NVIDIA', vram_mb: 131072, memory_bandwidth_gbps: 273, tdp_watts: 130, architecture: 'Blackwell', msrp_usd: 4999 },

  // AMD - Ryzen AI Max (Strix Halo APU - Unified Memory)
  { name: 'AMD Ryzen AI Max+ 395', vendor: 'AMD', vram_mb: 131072, memory_bandwidth_gbps: 256, tdp_watts: 120, architecture: 'RDNA 3.5', msrp_usd: 2999 },
  { name: 'AMD Ryzen AI Max 390', vendor: 'AMD', vram_mb: 131072, memory_bandwidth_gbps: 256, tdp_watts: 120, architecture: 'RDNA 3.5', msrp_usd: 2499 },
  { name: 'AMD Ryzen AI Max 385', vendor: 'AMD', vram_mb: 65536, memory_bandwidth_gbps: 256, tdp_watts: 100, architecture: 'RDNA 3.5', msrp_usd: 1999 },

  // AMD - RX 9000 Series (RDNA 4)
  { name: 'AMD RX 9070 XT', vendor: 'AMD', vram_mb: 16384, memory_bandwidth_gbps: 650, tdp_watts: 280, architecture: 'RDNA 4', msrp_usd: 599 },
  { name: 'AMD RX 9070', vendor: 'AMD', vram_mb: 16384, memory_bandwidth_gbps: 576, tdp_watts: 250, architecture: 'RDNA 4', msrp_usd: 499 },

  // AMD - RX 7000 Series
  { name: 'AMD RX 7900 XTX', vendor: 'AMD', vram_mb: 24576, memory_bandwidth_gbps: 960, tdp_watts: 355, architecture: 'RDNA 3', msrp_usd: 999 },
  { name: 'AMD RX 7900 XT', vendor: 'AMD', vram_mb: 20480, memory_bandwidth_gbps: 800, tdp_watts: 315, architecture: 'RDNA 3', msrp_usd: 899 },
  { name: 'AMD RX 7900 GRE', vendor: 'AMD', vram_mb: 16384, memory_bandwidth_gbps: 576, tdp_watts: 260, architecture: 'RDNA 3', msrp_usd: 549 },
  { name: 'AMD RX 7800 XT', vendor: 'AMD', vram_mb: 16384, memory_bandwidth_gbps: 624, tdp_watts: 263, architecture: 'RDNA 3', msrp_usd: 499 },
  { name: 'AMD RX 7700 XT', vendor: 'AMD', vram_mb: 12288, memory_bandwidth_gbps: 432, tdp_watts: 245, architecture: 'RDNA 3', msrp_usd: 449 },
  { name: 'AMD RX 7600 XT', vendor: 'AMD', vram_mb: 16384, memory_bandwidth_gbps: 288, tdp_watts: 190, architecture: 'RDNA 3', msrp_usd: 329 },
  { name: 'AMD RX 7600', vendor: 'AMD', vram_mb: 8192, memory_bandwidth_gbps: 288, tdp_watts: 165, architecture: 'RDNA 3', msrp_usd: 269 },

  // AMD - RX 6000 Series
  { name: 'AMD RX 6950 XT', vendor: 'AMD', vram_mb: 16384, memory_bandwidth_gbps: 576, tdp_watts: 335, architecture: 'RDNA 2', msrp_usd: 1099 },
  { name: 'AMD RX 6900 XT', vendor: 'AMD', vram_mb: 16384, memory_bandwidth_gbps: 512, tdp_watts: 300, architecture: 'RDNA 2', msrp_usd: 999 },
  { name: 'AMD RX 6800 XT', vendor: 'AMD', vram_mb: 16384, memory_bandwidth_gbps: 512, tdp_watts: 300, architecture: 'RDNA 2', msrp_usd: 649 },
  { name: 'AMD RX 6800', vendor: 'AMD', vram_mb: 16384, memory_bandwidth_gbps: 512, tdp_watts: 250, architecture: 'RDNA 2', msrp_usd: 579 },
  { name: 'AMD RX 6700 XT', vendor: 'AMD', vram_mb: 12288, memory_bandwidth_gbps: 384, tdp_watts: 230, architecture: 'RDNA 2', msrp_usd: 479 },

  // AMD - Professional / Data Center
  { name: 'AMD MI300X', vendor: 'AMD', vram_mb: 196608, memory_bandwidth_gbps: 5300, tdp_watts: 750, architecture: 'CDNA 3', msrp_usd: 15000 },
  { name: 'AMD MI250X', vendor: 'AMD', vram_mb: 131072, memory_bandwidth_gbps: 3277, tdp_watts: 560, architecture: 'CDNA 2', msrp_usd: 12000 },
  { name: 'AMD MI210', vendor: 'AMD', vram_mb: 65536, memory_bandwidth_gbps: 1638, tdp_watts: 300, architecture: 'CDNA 2', msrp_usd: 8000 },
  { name: 'AMD W7900', vendor: 'AMD', vram_mb: 49152, memory_bandwidth_gbps: 864, tdp_watts: 295, architecture: 'RDNA 3', msrp_usd: 3999 },
  { name: 'AMD W7800', vendor: 'AMD', vram_mb: 32768, memory_bandwidth_gbps: 576, tdp_watts: 260, architecture: 'RDNA 3', msrp_usd: 2499 },

  // Apple Silicon (Unified Memory)
  { name: 'Apple M4 Max', vendor: 'Apple', vram_mb: 131072, memory_bandwidth_gbps: 546, tdp_watts: 75, architecture: 'Apple Silicon', msrp_usd: 3199 },
  { name: 'Apple M4 Pro', vendor: 'Apple', vram_mb: 49152, memory_bandwidth_gbps: 273, tdp_watts: 60, architecture: 'Apple Silicon', msrp_usd: 1999 },
  { name: 'Apple M4', vendor: 'Apple', vram_mb: 32768, memory_bandwidth_gbps: 120, tdp_watts: 30, architecture: 'Apple Silicon', msrp_usd: 1299 },
  { name: 'Apple M3 Ultra', vendor: 'Apple', vram_mb: 196608, memory_bandwidth_gbps: 800, tdp_watts: 100, architecture: 'Apple Silicon', msrp_usd: 4999 },
  { name: 'Apple M3 Max', vendor: 'Apple', vram_mb: 131072, memory_bandwidth_gbps: 400, tdp_watts: 75, architecture: 'Apple Silicon', msrp_usd: 3199 },
  { name: 'Apple M3 Pro', vendor: 'Apple', vram_mb: 36864, memory_bandwidth_gbps: 200, tdp_watts: 50, architecture: 'Apple Silicon', msrp_usd: 1999 },
  { name: 'Apple M3', vendor: 'Apple', vram_mb: 24576, memory_bandwidth_gbps: 100, tdp_watts: 25, architecture: 'Apple Silicon', msrp_usd: 1299 },
  { name: 'Apple M2 Ultra', vendor: 'Apple', vram_mb: 196608, memory_bandwidth_gbps: 800, tdp_watts: 100, architecture: 'Apple Silicon', msrp_usd: 4999 },
  { name: 'Apple M2 Max', vendor: 'Apple', vram_mb: 98304, memory_bandwidth_gbps: 400, tdp_watts: 75, architecture: 'Apple Silicon', msrp_usd: 3099 },
  { name: 'Apple M2 Pro', vendor: 'Apple', vram_mb: 32768, memory_bandwidth_gbps: 200, tdp_watts: 50, architecture: 'Apple Silicon', msrp_usd: 1999 },
  { name: 'Apple M2', vendor: 'Apple', vram_mb: 24576, memory_bandwidth_gbps: 100, tdp_watts: 25, architecture: 'Apple Silicon', msrp_usd: 1199 },
  { name: 'Apple M1 Ultra', vendor: 'Apple', vram_mb: 131072, memory_bandwidth_gbps: 800, tdp_watts: 100, architecture: 'Apple Silicon', msrp_usd: 3999 },
  { name: 'Apple M1 Max', vendor: 'Apple', vram_mb: 65536, memory_bandwidth_gbps: 400, tdp_watts: 60, architecture: 'Apple Silicon', msrp_usd: 3099 },
  { name: 'Apple M1 Pro', vendor: 'Apple', vram_mb: 32768, memory_bandwidth_gbps: 200, tdp_watts: 40, architecture: 'Apple Silicon', msrp_usd: 1999 },
  { name: 'Apple M1', vendor: 'Apple', vram_mb: 16384, memory_bandwidth_gbps: 68, tdp_watts: 20, architecture: 'Apple Silicon', msrp_usd: 999 },

  // Intel - Battlemage (Arc B-Series)
  { name: 'Intel Arc B580', vendor: 'Intel', vram_mb: 12288, memory_bandwidth_gbps: 456, tdp_watts: 190, architecture: 'Battlemage', msrp_usd: 249 },
  { name: 'Intel Arc B570', vendor: 'Intel', vram_mb: 10240, memory_bandwidth_gbps: 380, tdp_watts: 150, architecture: 'Battlemage', msrp_usd: 219 },

  // Intel - Alchemist (Arc A-Series)
  { name: 'Intel Arc A770 16GB', vendor: 'Intel', vram_mb: 16384, memory_bandwidth_gbps: 560, tdp_watts: 225, architecture: 'Alchemist', msrp_usd: 349 },
  { name: 'Intel Arc A770 8GB', vendor: 'Intel', vram_mb: 8192, memory_bandwidth_gbps: 512, tdp_watts: 225, architecture: 'Alchemist', msrp_usd: 329 },
  { name: 'Intel Arc A750', vendor: 'Intel', vram_mb: 8192, memory_bandwidth_gbps: 512, tdp_watts: 225, architecture: 'Alchemist', msrp_usd: 289 },
  { name: 'Intel Arc A580', vendor: 'Intel', vram_mb: 8192, memory_bandwidth_gbps: 512, tdp_watts: 185, architecture: 'Alchemist', msrp_usd: 179 },
]

export const CPU_LIST: CPUSpec[] = [
  // Intel - 14th Gen (Raptor Lake Refresh)
  { name: 'Intel Core i9-14900KS', vendor: 'Intel', cores: 24, threads: 32, base_clock_mhz: 3200, boost_clock_mhz: 6200, l3_cache_mb: 36, tdp_watts: 150, architecture: 'Raptor Lake', msrp_usd: 689 },
  { name: 'Intel Core i9-14900K', vendor: 'Intel', cores: 24, threads: 32, base_clock_mhz: 3200, boost_clock_mhz: 6000, l3_cache_mb: 36, tdp_watts: 125, architecture: 'Raptor Lake', msrp_usd: 589 },
  { name: 'Intel Core i9-14900KF', vendor: 'Intel', cores: 24, threads: 32, base_clock_mhz: 3200, boost_clock_mhz: 6000, l3_cache_mb: 36, tdp_watts: 125, architecture: 'Raptor Lake', msrp_usd: 564 },
  { name: 'Intel Core i7-14700K', vendor: 'Intel', cores: 20, threads: 28, base_clock_mhz: 3400, boost_clock_mhz: 5600, l3_cache_mb: 33, tdp_watts: 125, architecture: 'Raptor Lake', msrp_usd: 409 },
  { name: 'Intel Core i7-14700KF', vendor: 'Intel', cores: 20, threads: 28, base_clock_mhz: 3400, boost_clock_mhz: 5600, l3_cache_mb: 33, tdp_watts: 125, architecture: 'Raptor Lake', msrp_usd: 384 },
  { name: 'Intel Core i5-14600K', vendor: 'Intel', cores: 14, threads: 20, base_clock_mhz: 3500, boost_clock_mhz: 5300, l3_cache_mb: 24, tdp_watts: 125, architecture: 'Raptor Lake', msrp_usd: 319 },
  { name: 'Intel Core i5-14600KF', vendor: 'Intel', cores: 14, threads: 20, base_clock_mhz: 3500, boost_clock_mhz: 5300, l3_cache_mb: 24, tdp_watts: 125, architecture: 'Raptor Lake', msrp_usd: 294 },

  // Intel - 13th Gen (Raptor Lake)
  { name: 'Intel Core i9-13900KS', vendor: 'Intel', cores: 24, threads: 32, base_clock_mhz: 3000, boost_clock_mhz: 6000, l3_cache_mb: 36, tdp_watts: 150, architecture: 'Raptor Lake', msrp_usd: 699 },
  { name: 'Intel Core i9-13900K', vendor: 'Intel', cores: 24, threads: 32, base_clock_mhz: 3000, boost_clock_mhz: 5800, l3_cache_mb: 36, tdp_watts: 125, architecture: 'Raptor Lake', msrp_usd: 589 },
  { name: 'Intel Core i7-13700K', vendor: 'Intel', cores: 16, threads: 24, base_clock_mhz: 3400, boost_clock_mhz: 5400, l3_cache_mb: 30, tdp_watts: 125, architecture: 'Raptor Lake', msrp_usd: 409 },
  { name: 'Intel Core i5-13600K', vendor: 'Intel', cores: 14, threads: 20, base_clock_mhz: 3500, boost_clock_mhz: 5100, l3_cache_mb: 24, tdp_watts: 125, architecture: 'Raptor Lake', msrp_usd: 319 },

  // Intel - 12th Gen (Alder Lake)
  { name: 'Intel Core i9-12900KS', vendor: 'Intel', cores: 16, threads: 24, base_clock_mhz: 3400, boost_clock_mhz: 5500, l3_cache_mb: 30, tdp_watts: 150, architecture: 'Alder Lake', msrp_usd: 739 },
  { name: 'Intel Core i9-12900K', vendor: 'Intel', cores: 16, threads: 24, base_clock_mhz: 3200, boost_clock_mhz: 5200, l3_cache_mb: 30, tdp_watts: 125, architecture: 'Alder Lake', msrp_usd: 589 },
  { name: 'Intel Core i7-12700K', vendor: 'Intel', cores: 12, threads: 20, base_clock_mhz: 3600, boost_clock_mhz: 5000, l3_cache_mb: 25, tdp_watts: 125, architecture: 'Alder Lake', msrp_usd: 409 },
  { name: 'Intel Core i5-12600K', vendor: 'Intel', cores: 10, threads: 16, base_clock_mhz: 3700, boost_clock_mhz: 4900, l3_cache_mb: 20, tdp_watts: 125, architecture: 'Alder Lake', msrp_usd: 289 },

  // Intel - Xeon
  { name: 'Intel Xeon w9-3595X', vendor: 'Intel', cores: 56, threads: 112, base_clock_mhz: 2000, boost_clock_mhz: 4800, l3_cache_mb: 105, tdp_watts: 350, architecture: 'Sapphire Rapids', msrp_usd: 5889 },
  { name: 'Intel Xeon w9-3495X', vendor: 'Intel', cores: 56, threads: 112, base_clock_mhz: 1900, boost_clock_mhz: 4800, l3_cache_mb: 105, tdp_watts: 350, architecture: 'Sapphire Rapids', msrp_usd: 5289 },
  { name: 'Intel Xeon W-3475X', vendor: 'Intel', cores: 36, threads: 72, base_clock_mhz: 2200, boost_clock_mhz: 4800, l3_cache_mb: 52, tdp_watts: 300, architecture: 'Sapphire Rapids', msrp_usd: 3599 },
  { name: 'Intel Xeon W-3465X', vendor: 'Intel', cores: 28, threads: 56, base_clock_mhz: 2500, boost_clock_mhz: 4800, l3_cache_mb: 45, tdp_watts: 270, architecture: 'Sapphire Rapids', msrp_usd: 2749 },
  { name: 'Intel Xeon W-2495X', vendor: 'Intel', cores: 24, threads: 48, base_clock_mhz: 2500, boost_clock_mhz: 4800, l3_cache_mb: 45, tdp_watts: 225, architecture: 'Sapphire Rapids', msrp_usd: 2149 },

  // AMD - Ryzen 9000 Series
  { name: 'AMD Ryzen 9 9950X', vendor: 'AMD', cores: 16, threads: 32, base_clock_mhz: 4300, boost_clock_mhz: 5700, l3_cache_mb: 64, tdp_watts: 170, architecture: 'Zen 5', msrp_usd: 649 },
  { name: 'AMD Ryzen 9 9900X', vendor: 'AMD', cores: 12, threads: 24, base_clock_mhz: 4400, boost_clock_mhz: 5600, l3_cache_mb: 64, tdp_watts: 120, architecture: 'Zen 5', msrp_usd: 499 },
  { name: 'AMD Ryzen 7 9700X', vendor: 'AMD', cores: 8, threads: 16, base_clock_mhz: 3800, boost_clock_mhz: 5500, l3_cache_mb: 32, tdp_watts: 65, architecture: 'Zen 5', msrp_usd: 359 },
  { name: 'AMD Ryzen 5 9600X', vendor: 'AMD', cores: 6, threads: 12, base_clock_mhz: 3900, boost_clock_mhz: 5400, l3_cache_mb: 32, tdp_watts: 65, architecture: 'Zen 5', msrp_usd: 279 },

  // AMD - Ryzen 7000 Series
  { name: 'AMD Ryzen 9 7950X3D', vendor: 'AMD', cores: 16, threads: 32, base_clock_mhz: 4200, boost_clock_mhz: 5700, l3_cache_mb: 128, tdp_watts: 120, architecture: 'Zen 4', msrp_usd: 699 },
  { name: 'AMD Ryzen 9 7950X', vendor: 'AMD', cores: 16, threads: 32, base_clock_mhz: 4500, boost_clock_mhz: 5700, l3_cache_mb: 64, tdp_watts: 170, architecture: 'Zen 4', msrp_usd: 699 },
  { name: 'AMD Ryzen 9 7900X3D', vendor: 'AMD', cores: 12, threads: 24, base_clock_mhz: 4400, boost_clock_mhz: 5600, l3_cache_mb: 128, tdp_watts: 120, architecture: 'Zen 4', msrp_usd: 599 },
  { name: 'AMD Ryzen 9 7900X', vendor: 'AMD', cores: 12, threads: 24, base_clock_mhz: 4700, boost_clock_mhz: 5600, l3_cache_mb: 64, tdp_watts: 170, architecture: 'Zen 4', msrp_usd: 549 },
  { name: 'AMD Ryzen 7 7800X3D', vendor: 'AMD', cores: 8, threads: 16, base_clock_mhz: 4200, boost_clock_mhz: 5000, l3_cache_mb: 96, tdp_watts: 120, architecture: 'Zen 4', msrp_usd: 449 },
  { name: 'AMD Ryzen 7 7700X', vendor: 'AMD', cores: 8, threads: 16, base_clock_mhz: 4500, boost_clock_mhz: 5400, l3_cache_mb: 32, tdp_watts: 105, architecture: 'Zen 4', msrp_usd: 399 },
  { name: 'AMD Ryzen 5 7600X', vendor: 'AMD', cores: 6, threads: 12, base_clock_mhz: 4700, boost_clock_mhz: 5300, l3_cache_mb: 32, tdp_watts: 105, architecture: 'Zen 4', msrp_usd: 299 },

  // AMD - Ryzen 5000 Series
  { name: 'AMD Ryzen 9 5950X', vendor: 'AMD', cores: 16, threads: 32, base_clock_mhz: 3400, boost_clock_mhz: 4900, l3_cache_mb: 64, tdp_watts: 105, architecture: 'Zen 3', msrp_usd: 799 },
  { name: 'AMD Ryzen 9 5900X', vendor: 'AMD', cores: 12, threads: 24, base_clock_mhz: 3700, boost_clock_mhz: 4800, l3_cache_mb: 64, tdp_watts: 105, architecture: 'Zen 3', msrp_usd: 549 },
  { name: 'AMD Ryzen 7 5800X3D', vendor: 'AMD', cores: 8, threads: 16, base_clock_mhz: 3400, boost_clock_mhz: 4500, l3_cache_mb: 96, tdp_watts: 105, architecture: 'Zen 3', msrp_usd: 449 },
  { name: 'AMD Ryzen 7 5800X', vendor: 'AMD', cores: 8, threads: 16, base_clock_mhz: 3800, boost_clock_mhz: 4700, l3_cache_mb: 32, tdp_watts: 105, architecture: 'Zen 3', msrp_usd: 449 },
  { name: 'AMD Ryzen 5 5600X', vendor: 'AMD', cores: 6, threads: 12, base_clock_mhz: 3700, boost_clock_mhz: 4600, l3_cache_mb: 32, tdp_watts: 65, architecture: 'Zen 3', msrp_usd: 299 },

  // AMD - Threadripper
  { name: 'AMD Threadripper PRO 7995WX', vendor: 'AMD', cores: 96, threads: 192, base_clock_mhz: 2500, boost_clock_mhz: 5100, l3_cache_mb: 384, tdp_watts: 350, architecture: 'Zen 4', msrp_usd: 9999 },
  { name: 'AMD Threadripper PRO 7985WX', vendor: 'AMD', cores: 64, threads: 128, base_clock_mhz: 3200, boost_clock_mhz: 5100, l3_cache_mb: 256, tdp_watts: 350, architecture: 'Zen 4', msrp_usd: 7099 },
  { name: 'AMD Threadripper PRO 7975WX', vendor: 'AMD', cores: 32, threads: 64, base_clock_mhz: 4000, boost_clock_mhz: 5300, l3_cache_mb: 128, tdp_watts: 350, architecture: 'Zen 4', msrp_usd: 3299 },
  { name: 'AMD Threadripper PRO 7965WX', vendor: 'AMD', cores: 24, threads: 48, base_clock_mhz: 4200, boost_clock_mhz: 5300, l3_cache_mb: 128, tdp_watts: 350, architecture: 'Zen 4', msrp_usd: 1899 },
  { name: 'AMD Threadripper PRO 5995WX', vendor: 'AMD', cores: 64, threads: 128, base_clock_mhz: 2700, boost_clock_mhz: 4500, l3_cache_mb: 256, tdp_watts: 280, architecture: 'Zen 3', msrp_usd: 6499 },
  { name: 'AMD Threadripper PRO 5975WX', vendor: 'AMD', cores: 32, threads: 64, base_clock_mhz: 3600, boost_clock_mhz: 4500, l3_cache_mb: 128, tdp_watts: 280, architecture: 'Zen 3', msrp_usd: 2899 },

  // AMD - EPYC
  { name: 'AMD EPYC 9654', vendor: 'AMD', cores: 96, threads: 192, base_clock_mhz: 2400, boost_clock_mhz: 3700, l3_cache_mb: 384, tdp_watts: 360, architecture: 'Zen 4', msrp_usd: 11805 },
  { name: 'AMD EPYC 9554', vendor: 'AMD', cores: 64, threads: 128, base_clock_mhz: 3100, boost_clock_mhz: 3750, l3_cache_mb: 256, tdp_watts: 360, architecture: 'Zen 4', msrp_usd: 4558 },
  { name: 'AMD EPYC 9455P', vendor: 'AMD', cores: 48, threads: 96, base_clock_mhz: 2550, boost_clock_mhz: 3450, l3_cache_mb: 256, tdp_watts: 270, architecture: 'Zen 4', msrp_usd: 2375 },
  { name: 'AMD EPYC 9454', vendor: 'AMD', cores: 48, threads: 96, base_clock_mhz: 2750, boost_clock_mhz: 3650, l3_cache_mb: 256, tdp_watts: 290, architecture: 'Zen 4', msrp_usd: 3411 },
  { name: 'AMD EPYC 9354', vendor: 'AMD', cores: 32, threads: 64, base_clock_mhz: 3250, boost_clock_mhz: 3800, l3_cache_mb: 256, tdp_watts: 280, architecture: 'Zen 4', msrp_usd: 2730 },

  // AMD Ryzen AI Max (Strix Halo APU - these are SoCs with integrated RDNA 3.5 graphics)
  { name: 'AMD Ryzen AI Max+ 395', vendor: 'AMD', cores: 16, threads: 32, base_clock_mhz: 2500, boost_clock_mhz: 5100, l3_cache_mb: 64, tdp_watts: 120, architecture: 'Zen 5', msrp_usd: 2999 },
  { name: 'AMD Ryzen AI Max 390', vendor: 'AMD', cores: 12, threads: 24, base_clock_mhz: 2500, boost_clock_mhz: 5000, l3_cache_mb: 64, tdp_watts: 120, architecture: 'Zen 5', msrp_usd: 2499 },
  { name: 'AMD Ryzen AI Max 385', vendor: 'AMD', cores: 8, threads: 16, base_clock_mhz: 2500, boost_clock_mhz: 4900, l3_cache_mb: 32, tdp_watts: 100, architecture: 'Zen 5', msrp_usd: 1999 },

  // Apple Silicon
  { name: 'Apple M4 Max', vendor: 'Apple', cores: 16, threads: 16, boost_clock_mhz: 4400, l3_cache_mb: 48, tdp_watts: 75, architecture: 'Apple Silicon', msrp_usd: 3199 },
  { name: 'Apple M4 Pro', vendor: 'Apple', cores: 14, threads: 14, boost_clock_mhz: 4400, l3_cache_mb: 36, tdp_watts: 60, architecture: 'Apple Silicon', msrp_usd: 1999 },
  { name: 'Apple M4', vendor: 'Apple', cores: 10, threads: 10, boost_clock_mhz: 4400, l3_cache_mb: 16, tdp_watts: 30, architecture: 'Apple Silicon', msrp_usd: 1299 },
  { name: 'Apple M3 Ultra', vendor: 'Apple', cores: 24, threads: 24, boost_clock_mhz: 4050, l3_cache_mb: 72, tdp_watts: 100, architecture: 'Apple Silicon', msrp_usd: 4999 },
  { name: 'Apple M3 Max', vendor: 'Apple', cores: 16, threads: 16, boost_clock_mhz: 4050, l3_cache_mb: 48, tdp_watts: 75, architecture: 'Apple Silicon', msrp_usd: 3199 },
  { name: 'Apple M3 Pro', vendor: 'Apple', cores: 12, threads: 12, boost_clock_mhz: 4050, l3_cache_mb: 36, tdp_watts: 50, architecture: 'Apple Silicon', msrp_usd: 1999 },
  { name: 'Apple M3', vendor: 'Apple', cores: 8, threads: 8, boost_clock_mhz: 4050, l3_cache_mb: 16, tdp_watts: 25, architecture: 'Apple Silicon', msrp_usd: 1299 },
  { name: 'Apple M2 Ultra', vendor: 'Apple', cores: 24, threads: 24, boost_clock_mhz: 3500, l3_cache_mb: 72, tdp_watts: 100, architecture: 'Apple Silicon', msrp_usd: 4999 },
  { name: 'Apple M2 Max', vendor: 'Apple', cores: 12, threads: 12, boost_clock_mhz: 3500, l3_cache_mb: 48, tdp_watts: 75, architecture: 'Apple Silicon', msrp_usd: 3099 },
  { name: 'Apple M2 Pro', vendor: 'Apple', cores: 12, threads: 12, boost_clock_mhz: 3500, l3_cache_mb: 36, tdp_watts: 50, architecture: 'Apple Silicon', msrp_usd: 1999 },
  { name: 'Apple M2', vendor: 'Apple', cores: 8, threads: 8, boost_clock_mhz: 3500, l3_cache_mb: 16, tdp_watts: 25, architecture: 'Apple Silicon', msrp_usd: 1199 },
  { name: 'Apple M1 Ultra', vendor: 'Apple', cores: 20, threads: 20, boost_clock_mhz: 3200, l3_cache_mb: 48, tdp_watts: 100, architecture: 'Apple Silicon', msrp_usd: 3999 },
  { name: 'Apple M1 Max', vendor: 'Apple', cores: 10, threads: 10, boost_clock_mhz: 3200, l3_cache_mb: 48, tdp_watts: 60, architecture: 'Apple Silicon', msrp_usd: 3099 },
  { name: 'Apple M1 Pro', vendor: 'Apple', cores: 10, threads: 10, boost_clock_mhz: 3200, l3_cache_mb: 24, tdp_watts: 40, architecture: 'Apple Silicon', msrp_usd: 1999 },
  { name: 'Apple M1', vendor: 'Apple', cores: 8, threads: 8, boost_clock_mhz: 3200, l3_cache_mb: 16, tdp_watts: 20, architecture: 'Apple Silicon', msrp_usd: 999 },
]

export const RAM_OPTIONS = [
  { label: '8 GB', value: 8192 },
  { label: '16 GB', value: 16384 },
  { label: '32 GB', value: 32768 },
  { label: '48 GB', value: 49152 },
  { label: '64 GB', value: 65536 },
  { label: '96 GB', value: 98304 },
  { label: '128 GB', value: 131072 },
  { label: '192 GB', value: 196608 },
  { label: '256 GB', value: 262144 },
  { label: '384 GB', value: 393216 },
  { label: '512 GB', value: 524288 },
  { label: '768 GB', value: 786432 },
  { label: '1 TB', value: 1048576 },
  { label: '1.5 TB', value: 1572864 },
  { label: '2 TB', value: 2097152 },
]

export const RAM_TYPE_OPTIONS = [
  { label: 'DDR4', value: 'DDR4' },
  { label: 'DDR5', value: 'DDR5' },
  { label: 'Unified (Apple)', value: 'Unified' },
  { label: 'HBM2', value: 'HBM2' },
  { label: 'HBM2e', value: 'HBM2e' },
  { label: 'HBM3', value: 'HBM3' },
]

export const RAM_SPEED_OPTIONS = [
  { label: '2400 MHz', value: 2400 },
  { label: '2666 MHz', value: 2666 },
  { label: '3000 MHz', value: 3000 },
  { label: '3200 MHz', value: 3200 },
  { label: '3600 MHz', value: 3600 },
  { label: '4000 MHz', value: 4000 },
  { label: '4800 MHz', value: 4800 },
  { label: '5200 MHz', value: 5200 },
  { label: '5600 MHz', value: 5600 },
  { label: '6000 MHz', value: 6000 },
  { label: '6400 MHz', value: 6400 },
  { label: '7200 MHz', value: 7200 },
  { label: '8000 MHz', value: 8000 },
]

export const MODEL_LIST: ModelSpec[] = [
  // OpenAI GPT-OSS (Open Source)
  { name: 'openai/gpt-oss-120b', displayName: 'GPT-OSS 120B', vendor: 'OpenAI', parameters_b: 117, context_length: 128000 },
  { name: 'openai/gpt-oss-20b', displayName: 'GPT-OSS 20B', vendor: 'OpenAI', parameters_b: 21, context_length: 128000 },

  // Llama 3.3 (December 2024)
  { name: 'meta-llama/Llama-3.3-70B-Instruct', displayName: 'Llama 3.3 70B Instruct', vendor: 'Meta', parameters_b: 70, context_length: 128000 },

  // Llama 3.2
  { name: 'meta-llama/Llama-3.2-1B', displayName: 'Llama 3.2 1B', vendor: 'Meta', parameters_b: 1, context_length: 128000 },
  { name: 'meta-llama/Llama-3.2-3B', displayName: 'Llama 3.2 3B', vendor: 'Meta', parameters_b: 3, context_length: 128000 },
  { name: 'meta-llama/Llama-3.2-1B-Instruct', displayName: 'Llama 3.2 1B Instruct', vendor: 'Meta', parameters_b: 1, context_length: 128000 },
  { name: 'meta-llama/Llama-3.2-3B-Instruct', displayName: 'Llama 3.2 3B Instruct', vendor: 'Meta', parameters_b: 3, context_length: 128000 },
  { name: 'meta-llama/Llama-3.2-11B-Vision-Instruct', displayName: 'Llama 3.2 11B Vision', vendor: 'Meta', parameters_b: 11, context_length: 128000 },
  { name: 'meta-llama/Llama-3.2-90B-Vision-Instruct', displayName: 'Llama 3.2 90B Vision', vendor: 'Meta', parameters_b: 90, context_length: 128000 },

  // Llama 3.1
  { name: 'meta-llama/Llama-3.1-8B', displayName: 'Llama 3.1 8B', vendor: 'Meta', parameters_b: 8, context_length: 128000 },
  { name: 'meta-llama/Llama-3.1-8B-Instruct', displayName: 'Llama 3.1 8B Instruct', vendor: 'Meta', parameters_b: 8, context_length: 128000 },
  { name: 'meta-llama/Llama-3.1-70B', displayName: 'Llama 3.1 70B', vendor: 'Meta', parameters_b: 70, context_length: 128000 },
  { name: 'meta-llama/Llama-3.1-70B-Instruct', displayName: 'Llama 3.1 70B Instruct', vendor: 'Meta', parameters_b: 70, context_length: 128000 },
  { name: 'meta-llama/Llama-3.1-405B', displayName: 'Llama 3.1 405B', vendor: 'Meta', parameters_b: 405, context_length: 128000 },
  { name: 'meta-llama/Llama-3.1-405B-Instruct', displayName: 'Llama 3.1 405B Instruct', vendor: 'Meta', parameters_b: 405, context_length: 128000 },

  // DeepSeek V3 (December 2024)
  { name: 'deepseek-ai/DeepSeek-V3', displayName: 'DeepSeek V3', vendor: 'DeepSeek', parameters_b: 671, context_length: 128000 },
  { name: 'deepseek-ai/DeepSeek-V2.5', displayName: 'DeepSeek V2.5', vendor: 'DeepSeek', parameters_b: 236, context_length: 128000 },
  { name: 'deepseek-ai/DeepSeek-V2', displayName: 'DeepSeek V2', vendor: 'DeepSeek', parameters_b: 236, context_length: 128000 },
  { name: 'deepseek-ai/deepseek-llm-67b-chat', displayName: 'DeepSeek 67B Chat', vendor: 'DeepSeek', parameters_b: 67, context_length: 4096 },
  { name: 'deepseek-ai/deepseek-coder-33b-instruct', displayName: 'DeepSeek Coder 33B', vendor: 'DeepSeek', parameters_b: 33, context_length: 16384 },
  { name: 'deepseek-ai/deepseek-coder-6.7b-instruct', displayName: 'DeepSeek Coder 6.7B', vendor: 'DeepSeek', parameters_b: 6.7, context_length: 16384 },

  // Qwen 2.5 (including Coder)
  { name: 'Qwen/Qwen2.5-72B-Instruct', displayName: 'Qwen 2.5 72B Instruct', vendor: 'Alibaba', parameters_b: 72, context_length: 131072 },
  { name: 'Qwen/Qwen2.5-32B-Instruct', displayName: 'Qwen 2.5 32B Instruct', vendor: 'Alibaba', parameters_b: 32, context_length: 131072 },
  { name: 'Qwen/Qwen2.5-14B-Instruct', displayName: 'Qwen 2.5 14B Instruct', vendor: 'Alibaba', parameters_b: 14, context_length: 131072 },
  { name: 'Qwen/Qwen2.5-7B-Instruct', displayName: 'Qwen 2.5 7B Instruct', vendor: 'Alibaba', parameters_b: 7, context_length: 131072 },
  { name: 'Qwen/Qwen2.5-3B-Instruct', displayName: 'Qwen 2.5 3B Instruct', vendor: 'Alibaba', parameters_b: 3, context_length: 32768 },
  { name: 'Qwen/Qwen2.5-1.5B-Instruct', displayName: 'Qwen 2.5 1.5B Instruct', vendor: 'Alibaba', parameters_b: 1.5, context_length: 32768 },
  { name: 'Qwen/Qwen2.5-0.5B-Instruct', displayName: 'Qwen 2.5 0.5B Instruct', vendor: 'Alibaba', parameters_b: 0.5, context_length: 32768 },
  { name: 'Qwen/Qwen2.5-Coder-32B-Instruct', displayName: 'Qwen 2.5 Coder 32B', vendor: 'Alibaba', parameters_b: 32, context_length: 131072 },
  { name: 'Qwen/Qwen2.5-Coder-14B-Instruct', displayName: 'Qwen 2.5 Coder 14B', vendor: 'Alibaba', parameters_b: 14, context_length: 131072 },
  { name: 'Qwen/Qwen2.5-Coder-7B-Instruct', displayName: 'Qwen 2.5 Coder 7B', vendor: 'Alibaba', parameters_b: 7, context_length: 131072 },
  { name: 'Qwen/Qwen2.5-Coder-3B-Instruct', displayName: 'Qwen 2.5 Coder 3B', vendor: 'Alibaba', parameters_b: 3, context_length: 32768 },
  { name: 'Qwen/Qwen2.5-Coder-1.5B-Instruct', displayName: 'Qwen 2.5 Coder 1.5B', vendor: 'Alibaba', parameters_b: 1.5, context_length: 32768 },
  { name: 'Qwen/QwQ-32B-Preview', displayName: 'QwQ 32B Preview', vendor: 'Alibaba', parameters_b: 32, context_length: 32768 },

  // Mistral (2024)
  { name: 'mistralai/Mistral-Large-Instruct-2411', displayName: 'Mistral Large 2411', vendor: 'Mistral', parameters_b: 123, context_length: 128000 },
  { name: 'mistralai/Mistral-Small-Instruct-2409', displayName: 'Mistral Small 2409', vendor: 'Mistral', parameters_b: 22, context_length: 32768 },
  { name: 'mistralai/Pixtral-12B-2409', displayName: 'Pixtral 12B', vendor: 'Mistral', parameters_b: 12, context_length: 128000 },
  { name: 'mistralai/Mistral-Nemo-Instruct-2407', displayName: 'Mistral Nemo 12B', vendor: 'Mistral', parameters_b: 12, context_length: 128000 },
  { name: 'mistralai/Codestral-22B-v0.1', displayName: 'Codestral 22B', vendor: 'Mistral', parameters_b: 22, context_length: 32768 },
  { name: 'mistralai/Mixtral-8x22B-Instruct-v0.1', displayName: 'Mixtral 8x22B Instruct', vendor: 'Mistral', parameters_b: 141, context_length: 65536 },
  { name: 'mistralai/Mixtral-8x7B-Instruct-v0.1', displayName: 'Mixtral 8x7B Instruct', vendor: 'Mistral', parameters_b: 47, context_length: 32768 },
  { name: 'mistralai/Mistral-7B-Instruct-v0.3', displayName: 'Mistral 7B Instruct v0.3', vendor: 'Mistral', parameters_b: 7, context_length: 32768 },

  // Phi-4 (December 2024)
  { name: 'microsoft/phi-4', displayName: 'Phi-4', vendor: 'Microsoft', parameters_b: 14, context_length: 16384 },
  { name: 'microsoft/Phi-3.5-mini-instruct', displayName: 'Phi-3.5 Mini', vendor: 'Microsoft', parameters_b: 3.8, context_length: 128000 },
  { name: 'microsoft/Phi-3.5-MoE-instruct', displayName: 'Phi-3.5 MoE', vendor: 'Microsoft', parameters_b: 42, context_length: 128000 },
  { name: 'microsoft/phi-3-medium-128k-instruct', displayName: 'Phi-3 Medium 128K', vendor: 'Microsoft', parameters_b: 14, context_length: 128000 },
  { name: 'microsoft/phi-3-mini-128k-instruct', displayName: 'Phi-3 Mini 128K', vendor: 'Microsoft', parameters_b: 3.8, context_length: 128000 },

  // Gemma 2
  { name: 'google/gemma-2-27b-it', displayName: 'Gemma 2 27B Instruct', vendor: 'Google', parameters_b: 27, context_length: 8192 },
  { name: 'google/gemma-2-9b-it', displayName: 'Gemma 2 9B Instruct', vendor: 'Google', parameters_b: 9, context_length: 8192 },
  { name: 'google/gemma-2-2b-it', displayName: 'Gemma 2 2B Instruct', vendor: 'Google', parameters_b: 2, context_length: 8192 },

  // Cohere Command R
  { name: 'CohereForAI/c4ai-command-r-plus-08-2024', displayName: 'Command R+ (Aug 2024)', vendor: 'Cohere', parameters_b: 104, context_length: 128000 },
  { name: 'CohereForAI/c4ai-command-r-08-2024', displayName: 'Command R (Aug 2024)', vendor: 'Cohere', parameters_b: 35, context_length: 128000 },

  // SmolLM2 (Hugging Face)
  { name: 'HuggingFaceTB/SmolLM2-1.7B-Instruct', displayName: 'SmolLM2 1.7B', vendor: 'Hugging Face', parameters_b: 1.7, context_length: 8192 },
  { name: 'HuggingFaceTB/SmolLM2-360M-Instruct', displayName: 'SmolLM2 360M', vendor: 'Hugging Face', parameters_b: 0.36, context_length: 8192 },
  { name: 'HuggingFaceTB/SmolLM2-135M-Instruct', displayName: 'SmolLM2 135M', vendor: 'Hugging Face', parameters_b: 0.135, context_length: 8192 },

  // OLMo 2 (AI2)
  { name: 'allenai/OLMo-2-1124-13B-Instruct', displayName: 'OLMo 2 13B', vendor: 'AI2', parameters_b: 13, context_length: 4096 },
  { name: 'allenai/OLMo-2-1124-7B-Instruct', displayName: 'OLMo 2 7B', vendor: 'AI2', parameters_b: 7, context_length: 4096 },

  // Yi (01.AI)
  { name: '01-ai/Yi-1.5-34B-Chat', displayName: 'Yi 1.5 34B Chat', vendor: '01.AI', parameters_b: 34, context_length: 4096 },
  { name: '01-ai/Yi-1.5-9B-Chat', displayName: 'Yi 1.5 9B Chat', vendor: '01.AI', parameters_b: 9, context_length: 4096 },
  { name: '01-ai/Yi-1.5-6B-Chat', displayName: 'Yi 1.5 6B Chat', vendor: '01.AI', parameters_b: 6, context_length: 4096 },

  // Falcon (TII)
  { name: 'tiiuae/Falcon3-10B-Instruct', displayName: 'Falcon 3 10B', vendor: 'TII', parameters_b: 10, context_length: 32768 },
  { name: 'tiiuae/Falcon3-7B-Instruct', displayName: 'Falcon 3 7B', vendor: 'TII', parameters_b: 7, context_length: 32768 },
  { name: 'tiiuae/Falcon3-3B-Instruct', displayName: 'Falcon 3 3B', vendor: 'TII', parameters_b: 3, context_length: 32768 },
  { name: 'tiiuae/Falcon3-1B-Instruct', displayName: 'Falcon 3 1B', vendor: 'TII', parameters_b: 1, context_length: 32768 },

  // StarCoder
  { name: 'bigcode/starcoder2-15b-instruct-v0.1', displayName: 'StarCoder2 15B Instruct', vendor: 'BigCode', parameters_b: 15, context_length: 16384 },
  { name: 'bigcode/starcoder2-7b', displayName: 'StarCoder2 7B', vendor: 'BigCode', parameters_b: 7, context_length: 16384 },
  { name: 'bigcode/starcoder2-3b', displayName: 'StarCoder2 3B', vendor: 'BigCode', parameters_b: 3, context_length: 16384 },

  // Llama 3 (legacy)
  { name: 'meta-llama/Meta-Llama-3-70B', displayName: 'Llama 3 70B', vendor: 'Meta', parameters_b: 70, context_length: 8192 },
  { name: 'meta-llama/Meta-Llama-3-70B-Instruct', displayName: 'Llama 3 70B Instruct', vendor: 'Meta', parameters_b: 70, context_length: 8192 },
  { name: 'meta-llama/Meta-Llama-3-8B', displayName: 'Llama 3 8B', vendor: 'Meta', parameters_b: 8, context_length: 8192 },
  { name: 'meta-llama/Meta-Llama-3-8B-Instruct', displayName: 'Llama 3 8B Instruct', vendor: 'Meta', parameters_b: 8, context_length: 8192 },
]

export const QUANTIZATION_OPTIONS = [
  { label: 'FP32 (Full Precision)', value: 'FP32' },
  { label: 'FP16 (Half Precision)', value: 'FP16' },
  { label: 'BF16 (Brain Float)', value: 'BF16' },
  { label: 'INT8', value: 'INT8' },
  { label: 'INT4', value: 'INT4' },
  { label: 'GPTQ (4-bit)', value: 'GPTQ' },
  { label: 'AWQ (4-bit)', value: 'AWQ' },
  { label: 'GGUF Q8_0', value: 'Q8_0' },
  { label: 'GGUF Q6_K', value: 'Q6_K' },
  { label: 'GGUF Q5_K_M', value: 'Q5_K_M' },
  { label: 'GGUF Q5_K_S', value: 'Q5_K_S' },
  { label: 'GGUF Q4_K_M', value: 'Q4_K_M' },
  { label: 'GGUF Q4_K_S', value: 'Q4_K_S' },
  { label: 'GGUF Q3_K_M', value: 'Q3_K_M' },
  { label: 'GGUF Q3_K_S', value: 'Q3_K_S' },
  { label: 'GGUF Q2_K', value: 'Q2_K' },
  { label: 'GGUF IQ4_XS', value: 'IQ4_XS' },
  { label: 'GGUF IQ3_XS', value: 'IQ3_XS' },
  { label: 'GGUF IQ2_XS', value: 'IQ2_XS' },
  { label: 'EXL2 (4-bit)', value: 'EXL2' },
  { label: 'NF4 (QLoRA)', value: 'NF4' },
]

export const BACKEND_LIST = [
  { value: 'transformers', label: 'Transformers' },
  { value: 'vllm', label: 'vLLM' },
  { value: 'llama.cpp', label: 'llama.cpp' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'tgi', label: 'TGI (Text Generation Inference)' },
  { value: 'mlx', label: 'MLX' },
  { value: 'exllama', label: 'ExLlama' },
  { value: 'exllamav2', label: 'ExLlamaV2' },
  { value: 'ctransformers', label: 'CTransformers' },
  { value: 'tensorrt-llm', label: 'TensorRT-LLM' },
  { value: 'onnx', label: 'ONNX Runtime' },
  { value: 'candle', label: 'Candle' },
  { value: 'other', label: 'Other' },
]

export const OS_LIST = [
  { value: 'linux', label: 'Linux' },
  { value: 'darwin', label: 'macOS' },
  { value: 'windows', label: 'Windows' },
]

export const GPU_COUNT_OPTIONS = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '6', value: 6 },
  { label: '8', value: 8 },
]

export const INTERCONNECT_OPTIONS = [
  { value: 'pcie_3', label: 'PCIe 3.0', bandwidth_gbps: 32 },
  { value: 'pcie_4', label: 'PCIe 4.0', bandwidth_gbps: 64 },
  { value: 'pcie_5', label: 'PCIe 5.0', bandwidth_gbps: 128 },
  { value: 'nvlink_2', label: 'NVLink 2.0 (V100)', bandwidth_gbps: 300 },
  { value: 'nvlink_3', label: 'NVLink 3.0 (A100)', bandwidth_gbps: 600 },
  { value: 'nvlink_4', label: 'NVLink 4.0 (H100)', bandwidth_gbps: 900 },
  { value: 'nvlink_5', label: 'NVLink 5.0 (Blackwell)', bandwidth_gbps: 1800 },
  { value: 'infinity_fabric', label: 'AMD Infinity Fabric', bandwidth_gbps: 200 },
  { value: 'unified', label: 'Unified Memory (Apple)', bandwidth_gbps: 0 },
  { value: 'none', label: 'No Interconnect (Single GPU)', bandwidth_gbps: 0 },
]

// Helper type for multi-GPU entry in submission form
export interface GpuFormEntry {
  name: string
  vendor: string
  vram_mb: number
  quantity: number
  interconnect?: string
}
