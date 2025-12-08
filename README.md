# InferBench

Community benchmark database for local LLM inference.

## Quick Start

```bash
git clone https://github.com/BinSquare/inferbench.git
cd inferbench/web
pnpm install
cp .env.example .env  # Add DATABASE_URL
pnpm db:migrate
pnpm dev
```

## Contributing

Submit benchmark results at [inferbench.com](https://inferbench.com).

Hardware data (GPUs, CPUs, models, pricing) lives in [`src/lib/hardware-data.ts`](https://github.com/BinSquare/inferbench/blob/main/src/lib/hardware-data.ts).

Run `pnpm build` before submitting PRs.

## License

MIT
