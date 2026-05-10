---
description: Run a parallel team of specialized agents on the given goal
argument-hint: <goal description>
---

# /team — Parallel Agent Team

Launch a team of specialized sub-agents in parallel for the goal: **$ARGUMENTS**

## Instructions

Read the goal in $ARGUMENTS, then spawn the following agents **in a single message** with multiple `Agent` tool calls so they run concurrently:

1. **Explore agent** (`subagent_type: Explore`) — survey the codebase for files relevant to the goal. Report file paths + 1-line summaries. Cap response at 200 words.

2. **Plan agent** (`subagent_type: Plan`) — design an implementation plan: ordered steps, files to touch, verification per step, risks. Cap at 300 words.

3. **General research agent** (`subagent_type: general-purpose`) — research conventions/dependencies/upstream APIs needed for the goal (read package.json, related libs, recent commits). Cap at 200 words.

After all three return, synthesize their outputs into a single brief for the user:

- **Files involved**: from Explore
- **Plan**: from Plan
- **Context/gotchas**: from research
- **Recommended next action**: your synthesis

Do NOT implement changes in this command — only produce the brief. The user will decide whether to proceed.

If `$ARGUMENTS` is empty, ask the user what goal the team should investigate before spawning agents.
