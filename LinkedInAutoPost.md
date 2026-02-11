# PRD: L-Inventory (LinkedIn Content Engine)

## 1. Project Overview

L-Inventory is a Next.js-based content hub designed to manage a high-volume inventory of LinkedIn posts. It accepts content via an **Inbound API** or **Internal AI generation**, allowing users to manage distribution through a "drag-to-post" workspace or automated "Random Mode."

## 2. Technical Stack

- **Framework:** Next.js (App Router)
    
- **Frontend:** React, Tailwind CSS
    
- **Drag-and-Drop:** `@hello-pangea/dnd`
    
- **ORM:** Drizzle ORM
    
- **Database:** PostgreSQL (Self-hosted)
    
- **Deployment:** AWS Ubuntu Server (Managed via PM2/Nginx)
    
- **Automation:** `node-cron` (Server-side)
    
- **External APIs:** LinkedIn Community Management API, OpenAI API
    

## 3. Functional Requirements

### 3.1 Inbound API Capability

- The application must expose a protected REST endpoint to receive content externally.
    
- **Input:** Image files (or hosted URLs) and post body text.
    
- **Processing:** All incoming text must be processed by an "Emoji Enforcement" utility.
    

### 3.2 UI & Kanban Workspace

- **Card Design:** React cards featuring the **Image on top** and the **Post Body on the bottom**.
    
- **Emoji Requirement:** Every single paragraph in the post body **must start with an emoji**.
    
- **Dual-Pane Interface:**
    
    - **Left Side (Inventory):** A scrollable list of available post/image combinations.
        
    - **Right Side (Action Zone):** Drop targets for "Post Now" (Immediate) and "Scheduled Queue."
        
- **Archive:** A separate section/tab for "Already Posted" items.
    

### 3.3 Automation & Scheduling

- **Random Mode:** A server-side toggle that, when active, picks a random unposted item from the inventory and posts it to LinkedIn based on a set frequency (Daily/Every 2 Days).
    
- **7-Day Queue:** Users can drag 7 items into a specific list; the system posts one per day via a cron job and moves them to the archive upon completion.
    

### 3.4 Administrative Pages

- **Credential Page:** A secure UI to input and update:
    
    - LinkedIn OAuth Credentials (Client ID/Secret) and Company URN.
        
    - OpenAI API Keys for the AI generation tab.
        
    - Inbound API authentication tokens.
        

### 3.5 Future AI Generation (Tab)

- A dedicated tab to input "Topics."
    
- **Workflow:** Topic → LLM (Text) → Image Generator (Visual) → Review → Move to Inventory.
    

---

## 4. 4-Person Development Plan

|**Role**|**Primary Responsibility**|**Key Deliverables**|
|---|---|---|
|**Person 1: Frontend Lead**|Workspace & UI/UX|Kanban board using `@hello-pangea/dnd`, Image-top/Body-bottom card components, and the Credential UI.|
|**Person 2: Backend/API Lead**|LinkedIn & Inbound API|LinkedIn OAuth flow, the Inbound REST API, and the "Emoji Enforcement" text-processing utility.|
|**Person 3: Systems/DB Lead**|Infrastructure & ORM|Drizzle ORM schema, PostgreSQL setup, AWS Ubuntu server configuration (PM2/Nginx), and `node-cron` logic.|
|**Person 4: AI/Workflow Lead**|AI Generation Pipeline|Integration with OpenAI for text/image generation and the "Staging Area" for AI-produced content.|