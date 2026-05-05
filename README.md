# Movie Club Hub

A web app for managing a rotating movie club. Groups of people take turns picking a film, nominate titles in advance, rate and review each week's watch, and track who has actually seen it — all in one place.

## What it does

- **Groups & invites** — create a club, invite members via a shareable link, and assign roles (member, admin, owner)
- **Turn rotation** — each turn a designated picker selects the movie; the schedule advances automatically based on configurable turn lengths
- **Movie search** — search for films via the OMDb API; poster, director, genre, runtime, and year are fetched and stored automatically
- **Nominations** — members can queue up suggestions for the current picker to choose from
- **Ratings & reviews** — members submit a numeric rating and optional written review per film
- **Watch status** — members mark whether they watched the movie that turn
- **Admin controls** — admins can override the picker, extend a turn, unlock movie selection or reviews early, override votes, and transfer group ownership

## What it contains

```
.
├── go-api/                    # Go backend
│   ├── cmd/server/            # Main HTTP server binary
│   ├── cmd/migrate/           # Standalone migration runner
│   ├── cmd/seed/              # Import data from JSON fixtures into the DB
│   ├── cmd/prune-movies/      # Remove orphaned movies outside valid turn boundaries
│   ├── internal/
│   │   ├── db/                # sqlc-generated database layer
│   │   ├── handler/           # HTTP handlers (auth, groups, movies, votes, ...)
│   │   ├── middleware/        # Auth guard, request logger
│   │   └── session/           # PostgreSQL-backed session manager (scs)
│   └── migrations/            # SQL migration files (golang-migrate)
├── artifacts/movie-club/      # React frontend (Vite + TypeScript + Tailwind + Radix UI)
├── lib/
│   ├── api-client-react/      # Generated API client (React Query hooks)
│   └── db/                    # Shared TypeScript DB schema types
├── scripts/                   # Workspace utility scripts
├── run.ps1                    # Windows PowerShell task runner (mirrors make targets)
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Local PostgreSQL
└── .github/workflows/
    └── deploy.yml             # CI: test → build → push → Cloud Run deploy
```

**Backend:** Go 1.25 · chi · pgx/v5 · sqlc · golang-migrate · scs sessions
**Frontend:** React · Vite · TypeScript · Tailwind CSS · Radix UI · TanStack Query · Zod · wouter
**Database:** PostgreSQL 16
**Infra:** Docker · GCP Cloud Run · Artifact Registry · Cloud SQL

## Requirements

| Tool | Version | Install |
|---|---|---|
| Go | 1.25+ | [go.dev/dl](https://go.dev/dl/) |
| Node.js | 24+ | [nodejs.org](https://nodejs.org/) |
| pnpm | 9+ | `corepack enable` |
| Docker + Docker Compose v2 | any recent | [docker.com](https://www.docker.com/) |
| air | latest | `go install github.com/air-verse/air@latest` |
| sqlc | latest | Optional — only needed to regenerate the DB layer from SQL |
| gcloud CLI | any recent | Optional — only needed for GCP deployments |

> **Windows:** Native PowerShell is supported via `run.ps1` — WSL2 is not required. All `make` commands have a `.\run.ps1 <command>` equivalent.

## Environment variables

`.env` is not committed. Copy the example file first:

```sh
# Mac / Linux
cp .env.example .env
```

```powershell
# Windows (PowerShell)
copy .env.example .env
```

Most values in `.env.example` work for local development with no changes. The exceptions are noted below.

| Variable | Local default | What you need to do |
|---|---|---|
| `DATABASE_URL` | `postgres://dev:dev@localhost:5433/movieclub` | Nothing — points to the Docker container |
| `DEV_DB_URL` | same as above | Nothing |
| `SESSION_SECRET` | `change-me-in-development` | Nothing for local dev; set a strong random value in production |
| `OMDB_API_KEY` | *(empty)* | **Get a free key at [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx).** Without it the server starts fine but movie search returns no results. |
| `PORT` | `8080` | Nothing |
| `LOG_LEVEL` | `info` | Nothing |
| `NODE_ENV` | `development` | Nothing for local dev |

GCP variables (`GCP_PROJECT_ID`, `CLOUD_SQL_CONNECTION_NAME`, etc.) are only needed for deployment — leave them blank for local development.

## Running locally

Each step shows the Mac/Linux command first, then Windows PowerShell.

### 0. Verify required tools

Before anything else, confirm all required tools are installed:

```sh
make check-tools
```

```powershell
.\run.ps1 check-tools
```

This scans for `go`, `node`, `pnpm`, `docker`, and `air`, and prints install instructions for anything missing. Fix any gaps before continuing.

### 1. Install dependencies

```sh
make install
```

```powershell
.\run.ps1 install
```

### 2. Start PostgreSQL

```sh
make docker-up
```

```powershell
.\run.ps1 docker-up
```

Starts a PostgreSQL 16 container on port `5433` (avoids conflicting with a local install on `5432`). The credentials (`dev:dev`, database `movieclub`) match the defaults in `.env.example`.

### 3. Run database migrations

```sh
make migrate-up
```

```powershell
.\run.ps1 migrate-up
```

Migrations also run automatically on server startup, but running them once now makes the first boot faster.

### 4. (Optional) Seed test data

```sh
make seed
```

```powershell
.\run.ps1 seed
```

Loads sample groups, films, turns, nominations, and reviews so you have real data to work with immediately. The seed creates these test accounts:

| Username | Password | Notes |
|---|---|---|
| `ameen_gooch` | `tamerFollicle9` | Member in all 3 groups |
| `dingle_documentary` | unknown | Owner of Thursday Night Cinema; reset if needed (see below) |
| `film_buff_kai` | unknown | Owner of Cult Classics Club |
| `cinephile_sara` | unknown | Owner of Sci-Fi Sundays |
| `movieguru_omar` | unknown | Member in multiple groups |
| `reel_talk_priya` | unknown | Member in multiple groups |

To reset a password for any account:

```sh
make reset-password ENV=dev USER=dingle_documentary PASS=newpassword
```

To wipe the database and re-seed from scratch:

```sh
make seed-fresh
```

```powershell
.\run.ps1 seed-fresh
```

### 5. Start the backend

```sh
make dev
```

```powershell
.\run.ps1 dev
```

The Go server starts on `http://localhost:8080` with hot reload (via `air`). It serves both the API (`/api/...`) and the embedded React SPA.

### 6. (Optional) Start the frontend dev server

For hot module replacement during frontend work, run this in a second terminal:

```sh
make fe-dev
```

```powershell
.\run.ps1 fe-dev
```

The Vite dev server starts on `http://localhost:5173` and proxies API calls to the Go server.

## Viewing the database locally

Once PostgreSQL is running (`make docker-up` / `.\run.ps1 docker-up`), connect any SQL client using these credentials:

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `movieclub` |
| Username | `dev` |
| Password | `dev` |
| SSL | disabled |

> Port `5433` is intentional — the container maps its internal `5432` to `5433` on your machine to avoid colliding with any local PostgreSQL install.

### Beekeeper Studio

Free and works on Mac and Windows.

1. Download from [beekeeperstudio.io](https://www.beekeeperstudio.io/)
2. Open → **New Connection** → choose **PostgreSQL**
3. Fill in the credentials above
4. Click **Test** → **Connect**

### DBeaver

Free, works on Mac and Windows.

1. Download from [dbeaver.io](https://dbeaver.io/)
2. **Database** → **New Database Connection** → **PostgreSQL**
3. Fill in the credentials above
4. Click **Test Connection** (it will prompt to download the JDBC driver on first use — accept it)
5. Click **Finish**

### TablePlus

Mac only (free tier available).

1. Download from [tableplus.com](https://tableplus.com/)
2. Click **+** → **PostgreSQL**
3. Fill in the credentials above
4. Click **Test** → **Connect**

### psql (command line)

If you have `psql` installed locally:

```sh
psql postgres://dev:dev@localhost:5433/movieclub
```

```powershell
psql postgres://dev:dev@localhost:5433/movieclub
```

Or if `psql` isn't installed locally, run it through Docker:

```sh
docker exec -it $(docker ps -qf "ancestor=postgres:16-alpine") psql -U dev -d movieclub
```

```powershell
docker exec -it (docker ps -qf "ancestor=postgres:16-alpine") psql -U dev -d movieclub
```

## Running with Docker

Build and run the full production image locally:

```sh
make docker-up          # start postgres
make docker-build       # build the image
make docker-run         # run the image against local postgres
```

The production image is a multi-stage build: it compiles the React frontend, then the Go binary, and produces a minimal Alpine runtime image (~20 MB).

## All available commands

```sh
make help          # Mac / Linux
```

```powershell
.\run.ps1 help     # Windows
```

Key groups:

| Category | Commands |
|---|---|
| Local dev | `dev`, `fe-dev`, `fe-serve`, `install` |
| Build | `build`, `frontend`, `copy-frontend`, `clean` |
| Test & quality | `test`, `test-verbose`, `test-cover`, `lint`, `typecheck`, `fe-typecheck`, `sqlc` |
| Database | `docker-up`, `docker-down`, `docker-logs`, `migrate-up`, `migrate-down`, `seed`, `seed-fresh`, `db-proxy` |
| Docker | `docker-build`, `docker-run` |
| GCP | `gcp-auth`, `gcp-push`, `gcp-deploy`, `gcp-logs`, `gcp-status`, `gcp-url` |

## CI / CD

GitHub Actions runs on every push to `main`:

1. **Test** — `go test ./...`
2. **Build & push** — builds the Docker image and pushes two tags (`latest` + commit SHA) to GCP Artifact Registry
3. **Deploy** — deploys the commit-SHA-tagged image to Cloud Run with Cloud SQL, secrets from Secret Manager, and zero-to-three auto-scaling

The workflow requires these GitHub secrets:

| Secret | Description |
|---|---|
| `GCP_PROJECT_ID` | GCP project ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload identity provider for keyless auth |
| `GCP_SERVICE_ACCOUNT` | Service account email for deployment |
| `CLOUD_SQL_CONNECTION_NAME` | Cloud SQL instance connection name |

Database credentials, session secret, and OMDb key are stored in GCP Secret Manager and mounted at runtime — they are never in the image or workflow.

## GCP manual deployment

For a one-off manual push (assuming you are already authenticated with `gcloud`):

```sh
export GCP_PROJECT_ID=your-project-id

make gcp-auth      # configure Docker for Artifact Registry
make gcp-push      # build + push image (tagged with current git SHA)
make gcp-deploy    # deploy to Cloud Run
make gcp-url       # print the live service URL
```

Note: manual deploys via the Makefile skip the Cloud SQL and Secret Manager flags that the CI workflow sets. Use these targets for quick iteration on an already-configured service, not for first-time setup.
