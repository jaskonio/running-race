# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | ~/.config/opencode/skills/branch-pr/SKILL.md |
| When writing Go tests, using teatest, or adding test coverage | go-testing | ~/.config/opencode/skills/go-testing/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | ~/.config/opencode/skills/issue-creation/SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | judgment-day | ~/.config/opencode/skills/judgment-day/SKILL.md |
| Use this skill whenever the user wants to do anything with PDF files | pdf | ~/.agents/skills/pdf/SKILL.md |
| When the orchestrator launches you to implement one or more tasks from a change | sdd-apply | ~/.config/opencode/skills/sdd-apply/SKILL.md |
| When the orchestrator launches you to archive a change after implementation and verification | sdd-archive | ~/.config/opencode/skills/sdd-archive/SKILL.md |
| When the orchestrator launches you to write or update the technical design for a change | sdd-design | ~/.config/opencode/skills/sdd-design/SKILL.md |
| When the orchestrator launches you to think through a feature, investigate the codebase, or clarify requirements | sdd-explore | ~/.config/opencode/skills/sdd-explore/SKILL.md |
| When user wants to initialize SDD in a project, or says "sdd init", "iniciar sdd", "openspec init" | sdd-init | ~/.config/opencode/skills/sdd-init/SKILL.md |
| When the orchestrator launches you to onboard a user through the full SDD cycle | sdd-onboard | ~/.config/opencode/skills/sdd-onboard/SKILL.md |
| When the orchestrator launches you to create or update a proposal for a change | sdd-propose | ~/.config/opencode/skills/sdd-propose/SKILL.md |
| When the orchestrator launches you to write or update specs for a change | sdd-spec | ~/.config/opencode/skills/sdd-spec/SKILL.md |
| When the orchestrator launches you to create or update the task breakdown for a change | sdd-tasks | ~/.config/opencode/skills/sdd-tasks/SKILL.md |
| When the orchestrator launches you to verify a completed (or partially completed) change | sdd-verify | ~/.config/opencode/skills/sdd-verify/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | ~/.config/opencode/skills/skill-creator/SKILL.md |
| When user says "update skills", "skill registry", "actualizar skills", "update registry", or after installing/removing skills | skill-registry | ~/.config/opencode/skills/skill-registry/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Create PR only after all changes are committed and verified
- Use standard PR title format: "type(scope): description" (fix, feat, refactor, docs, chore)
- Reference issue in PR description when fixing a bug
- Include rollback plan in description for risky changes
- Describe what changed, why, and how to verify
- Use conventional commits only - no AI attribution

### go-testing
- Use table-driven tests for multiple input/output combinations
- Mock external dependencies with httptest when testing HTTP handlers
- Test TUI rendering with Bubbletea assertions
- Use golden file testing for snapshot tests
- Run tests with `go test -race -cover` for detection and coverage
- Test both success and error paths

### issue-creation
- Follow issue-first enforcement: file issue before starting work
- Use issue title: "type(scope): description" (bug, feat, refactor)
- Include reproduction steps for bugs
- Reference related issues/pull requests when applicable
- Tag with appropriate labels: bug, enhancement, documentation, etc.

### judgment-day
- Launch two independent blind judge sub-agents simultaneously on same target
- Wait for both judges to complete independently before synthesizing findings
- Apply fixes based on consensus or worst judgment
- Re-judge until both judges pass or escalate after 2 iterations
- Do not modify code until both judges complete
- Treat "judgment day" as irreversible escalation

### pdf
- Use pypdf for basic PDF operations (read/write/merge/split)
- Extract text/tables with PyPDF2 or camelot
- Use PyMuPDF for OCR on scanned PDFs
- Create new PDFs from scratch or combine existing files
- Add watermarks using PyPDF2 watermark methods
- Handle form filling with form-objects if needed

### sdd-apply
- Implement tasks following existing code patterns and conventions
- Load relevant coding skills for the stack (e.g., go-testing for Go)
- Write testable code from the start
- Follow SOLID principles and clean architecture
- Update tests alongside implementation
- Document non-obvious decisions inline

### sdd-archive
- Sync delta specs into main specs (source of truth)
- Move completed change folder to archive
- Generate summary report for engram mode
- Verify all specs are satisfied before archiving
- Update topic keys for upserts
- Do NOT modify archived changes

### sdd-design
- Create design.md capturing HOW to implement, not just WHAT
- Include architecture decisions with rationale
- Document data flow and sequence diagrams
- List all affected files and dependencies
- Explain edge cases and error handling
- Consider performance, security, and maintainability

### sdd-explore
- Investigate codebase and compare approaches before committing
- Research best practices for the stack
- Return structured analysis, not code
- Suggest pros/cons of each approach
- Ask clarifying questions when requirements are ambiguous
- Keep exploration isolated - only create exploration.md when tied to a named change

### sdd-init
- Detect real tech stack from existing files, don't guess
- Always detect testing capabilities — this is mandatory
- Always persist testing capabilities as separate observation
- If no test runner exists, set strict_tdd: false and explain why
- Persist project context with topic_key for upserts

### sdd-onboard
- Guide user through full SDD cycle using their real codebase
- Treat onboard as real change with real artifacts
- Explain each phase before executing it
- Use project conventions and patterns from codebase
- Teach by doing — user leads, AI executes
- Complete exploration → proposal → specs → design → tasks → verify → archive

### sdd-propose
- Create proposal.md with intent, scope, and approach
- Include rollback plan for risky changes
- Identify affected modules/packages upfront
- Set clear boundaries (in-scope vs out-of-scope)
- Use RFC 2119 keywords (MUST, SHALL, SHOULD, MAY)
- Reference exploration analysis when applicable

### sdd-spec
- Write delta specs for ADD/MODIFY/REMOVE changes only
- Use Given/When/Then format for scenarios
- Specify acceptance criteria explicitly
- Use RFC 2119 keywords for requirements
- Include error cases and edge conditions
- Format as structured markdown with sections

### sdd-tasks
- Break down change into concrete implementation steps
- Group tasks by phase (infrastructure, implementation, testing)
- Use hierarchical numbering (1.1, 1.2, etc.)
- Make tasks small enough to complete in one session
- Specify deliverables for each task
- Include verification criteria for each phase

### sdd-verify
- Execute tests if test infrastructure exists
- Compare implementation against every spec scenario
- Check that design matches implementation
- Verify all tasks are complete
- Use real execution evidence, not just static analysis
- Fail the change if anything is missing or incorrect

### skill-creator
- Follow Agent Skills spec for skill structure
- Include frontmatter with name, description, trigger, license
- Define when to use clearly in When to Use section
- Add metadata (author, version)
- Include both common patterns and advanced techniques
- Provide concrete examples with code

### skill-registry
- Scan ALL known skill directories, not just first match
- Skip sdd-* and _shared directories
- Deduplicate skills (project-level wins)
- Generate 5-15 line compact rules per skill
- Always write .atl/skill-registry.md regardless of mode
- Always save to engram if available

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| No conventions detected | — | Project is new, only documentation files exist |
