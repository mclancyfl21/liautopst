# LinkedIn AutoPost (Content Engine)

## Project Overview
LinkedIn AutoPost is a Next.js-based content hub designed to manage a high-volume inventory of LinkedIn posts. It acts as a central repository for content received via an Inbound API or generated internally via AI, featuring a Kanban-style "drag-to-post" workspace and automated scheduling capabilities.

## Technical Stack
- **Framework:** Next.js (App Router)
- **Frontend:** React, Tailwind CSS
- **Drag-and-Drop:** `@hello-pangea/dnd`
- **ORM:** Drizzle ORM
- **Database:** SQLite (Local `sqlite.db`)
- **Deployment:** AWS Ubuntu Server (Managed via PM2/Nginx)
- **Automation:** `node-cron` (Server-side)
- **External APIs:** LinkedIn Community Management API, OpenAI API

## Building and Running
*Note: The project is currently in the planning phase. Commands below are standard for Next.js and will be applicable once scaffolded.*

- **Install Dependencies:** `npm install` (TODO)
- **Development Server:** `npm run dev` (TODO)
- **Production Build:** `npm run build` (TODO)
- **Production Start:** `npm run start` (TODO)
- **Database Migrations:** `npx drizzle-kit push:pg` (TODO)

## Development Conventions & Key Rules
- **Emoji Enforcement:** A core requirement where every single paragraph in a LinkedIn post body must start with an emoji.
- **Card Layout:** UI components for posts must feature the image on top and the post body on the bottom.
- **Workspace Structure:** A dual-pane interface with Inventory on the left and Action Zones (Post Now/Scheduled) on the right.
- **Inbound API:** All content ingestion via the REST endpoint must be protected and pass through the Emoji Enforcement utility.
- **Random Mode:** A server-side feature that picks random unposted inventory items for distribution based on a set frequency.

## Key Files
- `LinkedInAutoPost.md`: The primary Product Requirements Document (PRD) and technical specification.
- `GEMINI.md`: This instructional context file.
