# GEMINI.md — Google Skills Arcade 2026 Discord Bot

> Note: Written in English since GEMINI Code parses English instructions more reliably.

---

## 1. Project Overview

- Name: Skills Arcade Facilitator Bot
- Description: A Discord bot that facilitates the Google Skills Boost Arcade 2026 program for a community/campus cohort — handling participant registration, lab/badge submission tracking, XP & leaderboard, deadline reminders, and role/verification management.
- Goal: Reduce manual admin work for facilitators (tracking who submitted which lab, who's verified, sending reminders) and give participants a self-service way to check their progress inside Discord.
- Target Users: Facilitator/admin (you), and cohort participants (students) in a Discord server.
- Version: v0.1.0 (initial build)
- Status: Active development

---

## 2. Tech Stack

- Language: TypeScript
- Framework: discord.js (v14+)
- Styling: N/A (bot, no UI framework)
- UI Library: N/A — uses discord.js native components (Embeds, Buttons, Modals, Select Menus)
- Database: Supabase (Postgres)
- ORM: Supabase JS client (`@supabase/supabase-js`) — no separate ORM
- Auth: Discord OAuth is not used directly; "auth" = Discord role-based permission checks
- State Management: N/A (stateless bot process; state lives in Supabase)
- Data Fetching: axios (for Google Calendar / GitHub / Google Cloud Skills Boost API calls)
- Package Manager: npm
- Deployment: VPS (e.g. a small droplet/Railway) running the bot as a long-lived Node process (pm2 or similar)

### Core Libraries

| Package | Purpose |
|---|---|
| `discord.js` | Slash commands, buttons, modals, select menus, embeds, roles, channels, events |
| `dotenv` | Load `TOKEN`, `CLIENT_ID`, `GUILD_ID`, Supabase keys from `.env` |
| `@supabase/supabase-js` | Database: users, XP, verification, submission progress |
| `chalk` | Colored terminal logs (`[READY]`, `[COMMAND]`, `[ERROR]`) |
| `pino` | Structured/fast logging (replaces `console.log` in production paths) |
| `node-cron` | Scheduled reminders (e.g. daily 8 PM "submit your lab" reminder) |
| `axios` | External API calls (Google Calendar, GitHub, Google Cloud Skills Boost) |
| `@napi-rs/canvas` | Generate welcome images ("Welcome, Dendra! — Google Skills Arcade") |
| `ms` | Parse human time strings (`1h`, `5m`, `2d`) into milliseconds |
| `zod` | Validate `.env` config and command/API payloads at runtime |

> Never use `mongoose` in this project — Supabase is the single source of truth for all persistent data.

---

## 3. Commands

```bash
# Development
npm run dev            # Run bot with ts-node / tsx + auto-reload
npm run build           # Compile TypeScript to dist/
npm run start           # Run compiled bot (production)
npm run lint            # ESLint
npm run format           # Prettier

# Package Management
npm install [package]

# Testing
npm run test            # Run all tests
npm run test:unit        # Unit tests only

# Discord-specific
npm run deploy:commands   # Register/refresh slash commands (guild or global)
npm run deploy:commands:guild   # Fast registration to GUILD_ID only (for dev)

# Database
npm run db:seed          # Seed initial data (e.g. arcade lab list, badge point values)
```

> Package manager: npm only. Do not switch to yarn/pnpm/bun without confirmation.

---

## 4. Project Structure

Architecture: by feature, with a thin handler layer for Discord wiring.

```
skills-arcade-bot/
  src/
    commands/          # One file per slash command (e.g. register.ts, submit.ts, progress.ts, leaderboard.ts)
    events/             # Discord.js event handlers (ready.ts, interactionCreate.ts, guildMemberAdd.ts)
    components/         # Buttons, modals, select menus (grouped by feature, not by type)
    services/           # Business logic + external calls (supabase.service.ts, calendar.service.ts, github.service.ts)
    db/                 # Supabase client init, query helpers, table types
    jobs/               # node-cron scheduled tasks (reminders, deadline checks)
    utils/              # logger.ts (pino+chalk wrapper), time.ts (ms wrapper), embeds.ts (embed builders)
    config/             # env.ts (zod-validated config loader), constants.ts (XP values, role IDs, channel IDs)
    types/               # Shared TypeScript types/interfaces
    index.ts            # Entry point — client init, event/command loader
  assets/               # Static images/fonts used by canvas (welcome banner background, logo)
  public/               # N/A for a bot — omit unless a small web healthcheck endpoint is added
  .env.example
  tsconfig.json
  package.json
```

Placement rules:

- Every new slash command → its own file in `commands/`, one command per file.
- Any logic that talks to Supabase or an external API → `services/`, never directly inside a command file.
- Any scheduled task → `jobs/`, registered from `index.ts`.
- Shared Discord types (e.g. `ParticipantRecord`) → `types/`.
- Do not create new top-level folders under `src/` without confirmation first.

---

## 5. Naming Conventions

```
# Files and Folders
- Command file      : camelCase       e.g. submitLab.ts, checkProgress.ts
- Event file         : camelCase       e.g. interactionCreate.ts, guildMemberAdd.ts
- Service file       : camelCase.service.ts   e.g. supabase.service.ts
- Job file           : camelCase.job.ts       e.g. dailyReminder.job.ts
- Folder             : kebab-case (if multi-word) or camelCase for feature dirs
- Test file          : [name].test.ts

# Inside Code
- Variables      : camelCase        e.g. userXp, isVerified
- Constants       : UPPER_SNAKE     e.g. MAX_SUBMISSIONS_PER_DAY, ARCADE_ROLE_ID
- Functions       : camelCase       e.g. getParticipantByDiscordId, calculateXp
- Types/Interfaces: PascalCase      e.g. ParticipantRecord, SubmissionPayload
- Enum            : PascalCase      e.g. SubmissionStatus, BadgeTier
- Slash command names: kebab-case or single word (Discord requirement) e.g. /leaderboard, /submit-lab

# Git Branch
- New feature   : feat/[feature-name]
- Bug fix        : fix/[bug-name]
- Hotfix         : hotfix/[name]
- Refactor       : refactor/[name]
```

---

## 6. Code Conventions

```
# Approach
- Follow clean code + DRY principles
- Avoid duplicating logic — extract to a service function if reused
- Prefer readable code over clever one-liners

# TypeScript
- Strict mode enabled in tsconfig
- No 'any' type — use 'unknown' + narrowing, or a proper type, instead
- Always write explicit return types on functions, especially command execute() and service functions
- Use interface for object shapes (e.g. participant records), type for unions/intersections

# Import Order
1. External libraries (discord.js, axios, etc.)
2. Internal absolute (@/services, @/utils, if path aliases are set up)
3. Internal relative (./helper, ../config)
4. Types and interfaces
5. Assets/constants

# Export Pattern
- Named exports for services, utils, event handlers
- Default export only for a command file's command object where discord.js loader expects it (confirm loader convention before assuming)

# Error Handling
- Always wrap async command execute() and service calls in try-catch
- Never let an uncaught error crash the whole bot process — log it via pino and reply to the user with a friendly error embed
- Write specific, informative error messages (include which command/service failed)
```

---

## 7. Component Rules

(Interpreted for Discord "components" — buttons, modals, select menus — since this isn't a web UI project.)

```
# Order within a command/component file
1. Imports
2. Types/interfaces for command data or modal fields
3. Command/component definition (data + execute)
4. Helper/local functions
5. Export

# Interaction Rules
- Always defer long-running interactions (interaction.deferReply()) before hitting Supabase or external APIs
- Always validate interaction.user permissions/roles before executing privileged actions (e.g. admin-only commands)
- Buttons/modals tied to a specific command should live next to that command's file or in components/, not duplicated

# Slash Command Structure
- One command = one file, exporting { data: SlashCommandBuilder, execute(interaction) }
- Keep execute() thin — delegate real logic to services/

# Reusable Embeds/Components
- Extract to utils/embeds.ts or components/ if used in more than one command (e.g. a standard "error" embed, a standard "success" embed)
```

---

## 8. Styling Rules

(Interpreted as "Discord presentation" rules — embeds, colors, canvas images — since there's no CSS in a bot.)

```
# Embeds
- Use a consistent color scheme per message type:
    Success  : green
    Error    : red
    Info     : blue
    Arcade brand color: [define once you pick it, e.g. Google blue #4285F4]
- Always set a footer (e.g. "Google Skills Arcade 2026") for brand consistency
- Keep embed descriptions concise — use fields for structured data (XP, badges, deadline)

# Canvas (Welcome Images)
- Keep a single reusable template function in utils/, don't duplicate canvas drawing code per event
- Store fonts/background assets in assets/, reference by relative path, never hardcode absolute paths

# Constants
- Define all color hex codes, role IDs, and channel IDs once in config/constants.ts
- Never hardcode a role ID or channel ID directly inside a command file
```

---

## 9. API & Data Fetching Rules

```
# Server vs Client Fetch
- N/A in the web sense — but distinguish between:
    "on-demand" fetch: triggered by a slash command (e.g. /progress checks Supabase live)
    "scheduled" fetch: triggered by node-cron jobs (e.g. daily check of Google Calendar for upcoming deadlines)

# Response Format (internal service functions)
- Every service function returns a consistent shape:
  { success: boolean, data: T | null, message: string }

# Error Handling
- Always try-catch around axios calls and Supabase queries
- Never expose raw error stack traces to Discord users — log full error via pino, show a short friendly message to the user
- Retry transient external API failures (e.g. Google Calendar) with basic backoff before giving up

# Fetch Function Location
- All Supabase queries → db/ or services/, never inline in a command file
- All external API calls (Google Calendar, GitHub, Google Cloud Skills Boost) → services/, one service file per external integration

# Environment
- All secrets and URLs come from environment variables, validated via zod at startup
- Never hardcode TOKEN, CLIENT_ID, GUILD_ID, or Supabase keys anywhere in source
```

---

## 10. State Management Rules

```
# State Hierarchy
1. In-memory (per-interaction) state: fine for short-lived collectors (e.g. awaiting a modal submit)
2. Persisted state: anything that must survive a bot restart (XP, verification, submissions) → Supabase, never in-memory only

# When to Use Supabase
- Participant registration data
- XP / points per participant
- Verification status (linked Google Cloud Skills Boost profile, linked GitHub, etc.)
- Lab/badge submission history and status
- Reminder schedule state (e.g. "has this user already been reminded today")

# Data Access Rules
- Access Supabase only through db/ or services/ helper functions — never call the Supabase client directly from a command file
- Don't store derived/computable values (e.g. don't store "rank" if it can be computed from XP at read time)
- Use typed query helpers (typed return values, not raw `any` rows)
```

---

## 11. Performance Rules

```
# Command Loading
- Lazy-load heavy command modules only if the bot grows large; for now, load all commands at startup is fine

# Canvas / Image Generation
- Reuse a single loaded font/background asset across calls — don't re-read from disk on every welcome event
- Keep generated image dimensions reasonable (Discord embed image limits) to avoid slow uploads

# Cron Jobs
- Keep node-cron job bodies short — delegate actual work to a service function so the job itself is just scheduling glue
- Avoid overlapping runs: if a job might run long, add a simple lock/flag so a new run doesn't start before the previous finishes

# API Calls
- Batch or cache repeated external API calls where possible (e.g. don't re-fetch the same Google Calendar event list per user — fetch once per cron tick)

# Bundle/Startup
- Import only what's needed, not entire libraries
  Correct: import { SlashCommandBuilder } from 'discord.js'
  Avoid   : importing entire unused submodules
```

---

## 12. Git Rules

Every time GEMINI Code finishes a change or addition, commit to GitHub before moving to the next task.
This makes it possible to compare old vs new code and roll back if a result doesn't match expectations.

```
# Commit Message Format
feat     : [new feature description]
fix      : [bug fix description]
refactor : [refactor description]
style    : [styling/formatting change]
docs     : [documentation change]
test     : [test addition/change]
chore    : [config/tooling change]

# Examples
feat: add /register command with Supabase participant insert
fix: resolve daily reminder cron firing twice on restart
refactor: extract Google Calendar polling into calendar.service.ts

# Additional Rules
- Never commit .env or any file containing secrets (TOKEN, Supabase service key, etc.)
- One commit per specific change
- Don't bundle unrelated changes into a single commit
```

---

## 13. Features

```
# Done and working
- [x] Bot skeleton: client init, command/event loader
- [x] Supabase schema: participants, submissions, xp_log tables
- [x] Welcome Embed message on new member join

# In progress — don't change without confirmation
- [ ] (none yet)

# Not started
- [ ] /register — link Discord account to arcade participant record
- [ ] /submit-lab — submit a completed lab/badge for verification
- [ ] /progress — show a participant's current XP, badges, rank
- [ ] /leaderboard — show top participants by XP
- [ ] Verification role auto-assign on successful submission review
- [ ] Daily reminder cron (node-cron) for pending submissions
- [ ] Welcome image on new member join (canvas)
- [ ] Google Calendar integration for arcade deadline announcements
- [ ] GitHub API integration (if tracking repo-based tasks)
```

> Update this section as work progresses — this is the section GEMINI Code should check first before starting new work.

---

## 14. Testing

```
# Approach
- Type      : Unit tests for services/utils; manual testing in a dev Discord server for commands
- Framework : Vitest

# What to Test
- XP calculation logic
- Time parsing helpers (ms wrapper usage)
- Supabase service functions (with a mocked client)
- Reminder scheduling logic (does it correctly identify "who to remind today")

# What Not to Test
- discord.js internals
- Simple embed builder functions with no logic branches
- Config loading (covered implicitly by zod validation failing fast)

# Test Writing Rules
- One test file per tested file
- Descriptive test names: 'should [expected behavior] when [condition]'
- Arrange, Act, Assert pattern

# Coverage Target
- Minimum coverage: 60% to start (bot logic is I/O-heavy; prioritize service/util coverage over command wiring)
- Priority: XP/business logic > services > command wiring
```

---

## 15. Do Not

If an instruction or prompt is ambiguous, ASK FIRST before coding. Don't assume and proceed without confirmation.

```
# Structure and Files
- Don't create new folders without confirmation
- Don't delete files without confirmation
- Don't move files without confirmation
- Don't change the existing folder structure

# Code
- Don't use 'any' in TypeScript
- Don't hardcode values that should come from environment variables
- Don't commit .env or any file containing secrets
- Don't install a new package without confirmation
- Don't remove or change already-working features without a clear instruction

# Forbidden Patterns
- Don't use mongoose — this project uses Supabase only
- Don't call the Supabase client directly from a command file — go through services/db
- Don't put business logic inside event handlers — delegate to services/

# Database
- Don't run commands that alter or delete production data
- Don't create a new Supabase table/migration without confirmation
- Don't expose Supabase service-role keys anywhere client-reachable (this is a bot, so "client" means logs, error messages, or Discord replies)

# Security
- Don't expose TOKEN, Supabase keys, or any secret in Discord replies, logs shown to users, or committed code
- Don't skip try-catch around Discord API or external API calls
- Don't trust user-supplied modal/command input without zod validation before it reaches a service function
```

---

## 16. Environment Variables

```
# Setup
- Copy .env.example to .env for local development
- Never commit .env to the repository

# Discord
TOKEN                # Discord bot token — server only, never log this
CLIENT_ID            # Discord application/client ID
GUILD_ID             # Dev/test guild ID for fast slash command registration

# Supabase
SUPABASE_URL         # Supabase project URL
SUPABASE_ANON_KEY    # Public anon key (safe-ish, but still keep server-side only in a bot)
SUPABASE_SERVICE_ROLE_KEY   # Server-only — full DB access, never expose in logs or errors

# External APIs
GOOGLE_CALENDAR_API_KEY   # For fetching Arcade event/deadline schedule
GITHUB_TOKEN              # If tracking GitHub-based submissions
GOOGLE_CLOUD_SKILLS_BOOST_API_KEY   # If/when an official API or scraping endpoint is used

# Bot Config
DEFAULT_REMINDER_CRON    # e.g. "0 20 * * *" for 8 PM daily reminder
ARCADE_ROLE_ID           # Role ID granted to verified/registered participants
LOG_LEVEL                # pino log level, e.g. "info" or "debug"
```

---

_Isi bagian yang masih generic (warna brand, nama command final, jadwal cron pasti) begitu detail programnya sudah fix. Update file ini tiap kali struktur project atau scope fitur berubah, supaya GEMINI Code selalu kerja berdasarkan konteks yang akurat._