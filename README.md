CodeSage
🚀 CodeSage
AI-Powered Code Review Assistant for Modern Engineering Teams

Smarter Reviews. Better Code.

</div>
📌 Overview

CodeSage is an AI-powered code review platform that integrates directly with GitHub and GitLab to automate pull request reviews, detect security vulnerabilities, analyze code quality, generate intelligent review comments, and assist developers with conversational AI debugging.

Built for modern engineering teams, CodeSage transforms traditional code reviews into a fast, collaborative, and intelligent workflow.

❗ Problem Statement

Modern software teams spend hours manually reviewing pull requests, yet critical bugs, security vulnerabilities, and performance issues still reach production.

Traditional review workflows are:

Slow
Repetitive
Difficult to scale
Inconsistent across teams

Developers frequently miss:

Security vulnerabilities
Performance bottlenecks
Risky implementation patterns
Edge-case bugs
Poor architectural decisions

Engineering teams need:

Faster review cycles
Better security analysis
Intelligent automation
Actionable insights
Real-time collaboration
💡 Solution

CodeSage acts as an AI engineering reviewer that automatically analyzes pull requests in real time and provides contextual feedback directly inside GitHub/GitLab workflows.

The platform combines:

AI-powered reasoning
Security scanning
Risk assessment
Automated review comments
Conversational debugging
Real-time synchronization

into one unified developer experience.

✨ Core Features
🤖 AI-Powered Pull Request Reviews

CodeSage automatically analyzes:

Pull request diffs
Changed files
Repository context
Code quality
Logic flow
Risky implementation patterns

The AI generates:

Inline review comments
Executive summaries
Risk explanations
Improvement suggestions
🛡 OWASP Top 10 Security Scanner

CodeSage performs intelligent security-focused analysis and detects vulnerabilities such as:

SQL Injection
Cross-Site Scripting (XSS)
Hardcoded Secrets
Broken Authentication
Access Control Issues
Unsafe API Usage
Insecure Dependencies

Each issue includes:

Severity level
Confidence score
File location
Suggested remediation
📊 PR Risk Score Engine

Every pull request receives:

AI-generated risk score (0–100)
Severity classification
Executive summary
Impact analysis
Example

“This PR modifies authentication middleware without validation — HIGH RISK.”

💬 Conversational AI Reviewer

Developers can interact directly with the AI reviewer.

Example Queries
“Why is this implementation risky?”
“Generate a safer alternative.”
“Optimize this query.”
“Explain this vulnerability.”

This transforms CodeSage from a static scanner into a true AI engineering assistant.

⚡ AI Fix Suggestions

CodeSage can:

Generate secure fixes
Refactor vulnerable code
Suggest optimized implementations
Create GitHub suggestion comments
Help developers resolve issues faster
📈 Team Intelligence Dashboard

Track engineering insights across repositories:

Recurring issue patterns
Security trends
Developer insights
Risk analytics
Pull request metrics
Review performance
🔄 Real-Time Collaboration

Powered by Supabase Realtime:

Live PR updates
Instant review synchronization
Real-time notifications
Collaborative review workflows
🧠 Technical Architecture
Developer Opens Pull Request
            ↓
GitHub/GitLab Webhook Triggered
            ↓
Backend API Receives Event
            ↓
Fetch Changed Files & Diffs
            ↓
Prompt Engine Formats Context
            ↓
OpenRouter API Called
            ↓
AI Model Analyzes Code
            ↓
OWASP Security Scan Runs
            ↓
Risk Score Generated
            ↓
Inline Review Comments Created
            ↓
AI Fix Suggestions Generated
            ↓
Results Stored in Supabase
            ↓
Realtime Updates Pushed
            ↓
Comments Posted Back to GitHub/GitLab
            ↓
Developer Interacts with AI Reviewer
⚙️ System Workflow
1️⃣ Pull Request Event

GitHub or GitLab webhook triggers whenever a pull request is opened or updated.

2️⃣ Backend Processing

The backend:

Validates webhook signatures
Fetches PR metadata
Extracts changed files and diffs
Queues AI analysis jobs
3️⃣ AI Analysis Engine

The AI engine:

Understands repository context
Detects vulnerabilities
Identifies risky patterns
Generates review summaries
Calculates PR risk score
4️⃣ Result Generation

CodeSage creates:

Inline review comments
Security alerts
Suggested fixes
Executive summaries
5️⃣ Real-Time Synchronization

Results are stored in Supabase and synchronized instantly across connected clients.

6️⃣ Conversational Review

Developers can ask follow-up questions directly to the AI reviewer.

🏗 Technology Stack
🎨 Frontend
Next.js
React
Tailwind CSS
TypeScript
⚡ Backend
Node.js
Express.js
🤖 AI Infrastructure
OpenRouter API
AI Prompt Engineering
Context-Aware PR Analysis
🗄 Database & Realtime
Supabase
PostgreSQL
Authentication
Realtime
Storage
🔄 Queue & Background Processing
Redis
BullMQ
🔗 Integrations
GitHub API
GitLab API
Webhooks
🚀 DevOps & Deployment
Docker
Vercel
GitHub Actions
📡 Monitoring
Sentry
Logs & Analytics
📂 Project Structure
CodeSage/
│
├── frontend/               # Next.js frontend
├── backend/                # Express.js backend
├── ai-engine/              # AI analysis engine
├── integrations/           # GitHub/GitLab integrations
├── webhooks/               # Webhook handlers
├── queue/                  # BullMQ workers
├── database/               # Supabase schema/config
├── prompts/                # AI prompts
├── utils/                  # Shared utilities
└── docs/                   # Documentation
🔐 Security Features
Webhook Signature Verification
JWT Authentication
Role-Based Access Control (RBAC)
Rate Limiting
Secure Environment Variables
Input Validation
OWASP Top 10 Detection
Secure API Handling
🚀 Getting Started
1. Clone Repository
git clone https://github.com/adarshmaurya7999-ai/CodeSage.git
cd CodeSage
2. Install Dependencies
npm install
3. Configure Environment Variables

Create a .env.local file:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

GITHUB_WEBHOOK_SECRET=
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=

OPENROUTER_API_KEY=

REDIS_URL=
4. Start Development Server
npm run dev
🧪 Example AI Review Response
{
  "severity": "HIGH",
  "file": "auth/login.ts",
  "line": 42,
  "issue": "SQL Injection Vulnerability",
  "comment": "User input is directly concatenated into SQL query.",
  "fix_suggestion": "Use parameterized queries instead."
}
🎯 Hackathon Demo Flow
Open a GitHub Pull Request
Trigger webhook event
AI analyzes changed code
Security vulnerabilities detected
Risk score generated
Inline comments posted automatically
Developer asks follow-up questions
AI generates fix suggestions live
📈 Future Roadmap
Multi-LLM Support
VS Code Extension
CI/CD Blocking Mode
AI Test Case Generation
AI Refactoring Assistant
Jira Integration
Enterprise Analytics
Multi-Agent Review System
👨‍💻 Team
Team Lead
Adarsh Maurya
Team Member
Pranav Chavan
🌐 Repository

CodeSage GitHub Repository

📜 License

MIT License

<div align="center">
💜 CodeSage
Smarter Reviews. Better Code.

