# InferBench

A community-driven benchmark database for local LLM inference performance. Compare GPUs, models, and configurations to find the optimal setup for your use case.

## Features

- **GPU Rankings** - Compare average inference performance across different GPUs
- **Model Rankings** - See which models perform best and on what hardware
- **Value Sorting** - Find the best performance per dollar
- **Community Submissions** - User-submitted benchmark results with validation
- **Detailed Stats** - Tokens/sec, prefill speed, VRAM usage, and more

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **State Management**: TanStack Query

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database (Supabase recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/inferbench.git
cd inferbench/web
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database connection string:
```
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

4. Push the database schema:
```bash
pnpm db:push
```

5. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database Commands

```bash
pnpm db:generate  # Generate migrations from schema changes
pnpm db:migrate   # Run pending migrations
pnpm db:push      # Push schema directly (dev only)
pnpm db:studio    # Open Drizzle Studio GUI
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── gpu/            # GPU detail pages
│   ├── gpus/           # GPU rankings page
│   ├── model/          # Model detail pages
│   ├── models/         # Model rankings page
│   └── submissions/    # Submissions page
├── components/         # React components
├── db/                 # Database schema and connection
└── lib/               # Utilities, API client, validation
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leaderboard` | GET | Fetch leaderboard entries |
| `/api/gpus` | GET | Fetch GPU rankings |
| `/api/gpus/[name]` | GET | Fetch GPU details |
| `/api/models` | GET | Fetch model rankings |
| `/api/models/[name]` | GET | Fetch model details |
| `/api/submissions` | GET/POST | List or create submissions |
| `/api/submissions/[id]/vote` | POST | Validate or question a submission |
| `/api/stats` | GET | Fetch aggregate statistics |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Run `pnpm build` before submitting to ensure no type errors
2. Follow existing code patterns and naming conventions
3. Add validation for any new API endpoints using Zod schemas

## Data Sources

All benchmark data is community-submitted. Results may vary based on:
- Hardware configuration
- Software versions
- Testing conditions
- Quantization settings

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- ORM by [Drizzle](https://orm.drizzle.team/)
