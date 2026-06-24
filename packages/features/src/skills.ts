/** Skills are written to the cross-tool `.agents/` standard, read by Codex/Gemini/Cursor/Copilot. */
export const SKILLS_DIR = ".agents/skills";

// Claude Code reads only `.claude/skills`; `shared-agents` mirrors SKILLS_DIR here (symlink, copy fallback).
export const CLAUDE_SKILLS_DIR = ".claude/skills";
