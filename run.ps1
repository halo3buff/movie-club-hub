param([Parameter(Position = 0)][string]$Command = "help")

# Load .env if present
if (Test-Path .env) {
    Get-Content .env | Where-Object { $_ -match '^[^#\s].*=' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $k = $parts[0].Trim()
        $v = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($k, $v, 'Process')
    }
}

# Defaults (same as Makefile)
if (-not $env:DEV_DB_URL)      { $env:DEV_DB_URL      = "postgres://dev:dev@localhost:5433/movieclub?sslmode=disable" }
if (-not $env:DATABASE_URL)    { $env:DATABASE_URL    = "pgx5://dev:dev@localhost:5433/movieclub?sslmode=disable" }
if (-not $env:SESSION_SECRET)  { $env:SESSION_SECRET  = "dev-secret" }
if (-not $env:PORT)            { $env:PORT            = "8080" }

function Run-InGoApi([scriptblock]$Block) {
    Push-Location go-api
    try { & $Block } finally { Pop-Location }
}

switch ($Command) {
    "help" {
        Write-Host ""
        Write-Host "  Usage: .\run.ps1 <command>"
        Write-Host ""
        Write-Host "  Commands:"
        Write-Host "    check-tools   Check all required tools are installed"
        Write-Host "    install       Install pnpm dependencies"
        Write-Host "    dev           Run Go API with hot reload (air)"
        Write-Host "    fe-dev        Run React frontend dev server (Vite HMR)"
        Write-Host "    seed          Seed the database from JSON fixtures"
        Write-Host "    seed-fresh    Wipe and re-seed the database"
        Write-Host "    docker-up     Start local PostgreSQL container"
        Write-Host "    docker-down   Stop Docker Compose services"
        Write-Host "    docker-logs   Stream Docker Compose logs"
        Write-Host "    migrate-up    Apply all pending database migrations"
        Write-Host "    test          Run Go tests"
        Write-Host "    lint          Run go vet"
        Write-Host "    build         Full production build (frontend + Go binary)"
        Write-Host ""
    }

    "check-tools" {
        $tools = @(
            @{ Name = "go";     Hint = "https://go.dev/dl/" },
            @{ Name = "node";   Hint = "https://nodejs.org/" },
            @{ Name = "pnpm";   Hint = "Run: corepack enable" },
            @{ Name = "docker"; Hint = "https://www.docker.com/" },
            @{ Name = "air";    Hint = "Run: go install github.com/air-verse/air@latest" }
        )
        $allOk = $true
        foreach ($tool in $tools) {
            if (Get-Command $tool.Name -ErrorAction SilentlyContinue) {
                Write-Host "  v $($tool.Name)" -ForegroundColor Green
            } else {
                Write-Host "  x $($tool.Name)  ->  $($tool.Hint)" -ForegroundColor Red
                $allOk = $false
            }
        }
        if (-not $allOk) {
            Write-Host ""
            Write-Host "Fix the above, then re-run: .\run.ps1 check-tools" -ForegroundColor Yellow
            exit 1
        }
    }

    "install" {
        pnpm install
    }

    "dev" {
        Run-InGoApi {
            $env:DATABASE_URL   = $env:DEV_DB_URL
            $env:SESSION_SECRET = $env:SESSION_SECRET
            $env:PORT           = $env:PORT
            air
        }
    }

    "fe-dev" {
        pnpm --filter movie-club dev
    }

    "seed" {
        Run-InGoApi {
            $env:DATABASE_URL = $env:DEV_DB_URL
            go run ./cmd/seed
        }
    }

    "seed-fresh" {
        Run-InGoApi {
            $env:DATABASE_URL = $env:DEV_DB_URL
            go run ./cmd/seed -reset
        }
    }

    "docker-up" {
        docker compose up -d postgres
    }

    "docker-down" {
        docker compose down
    }

    "docker-logs" {
        docker compose logs -f
    }

    "migrate-up" {
        Run-InGoApi {
            go run -tags migrate cmd/migrate/main.go -dir migrations -db $env:DATABASE_URL up
        }
    }

    "test" {
        Run-InGoApi {
            go test ./...
        }
    }

    "lint" {
        Run-InGoApi {
            go vet ./...
        }
    }

    "build" {
        pnpm --filter movie-club build
        Remove-Item -Recurse -Force go-api/cmd/server/static/* -ErrorAction SilentlyContinue
        Copy-Item -Recurse artifacts/movie-club/dist/public/* go-api/cmd/server/static/
        Run-InGoApi {
            go build -o bin/server ./cmd/server
        }
    }

    default {
        Write-Error "Unknown command: '$Command'. Run .\run.ps1 help"
        exit 1
    }
}
