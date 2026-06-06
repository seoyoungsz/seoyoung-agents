#!/usr/bin/env python3
"""
PreToolUse hook — 위험 명령어 차단.
Bash/PowerShell 도구 실행 전에 위험 패턴을 감지하고 차단한다.

종료 코드:
    0 — 허용
    2 — 차단 (stderr를 모델에 피드백)
"""

import contextlib
import json
import re
import sys

with contextlib.suppress(Exception):
    sys.stderr.reconfigure(encoding="utf-8")

DANGEROUS = [
    (r"\brm\s+-[a-z]*[rf][a-z]*\b", "rm -rf 류 재귀/강제 삭제"),
    (r"\brm\s+.*-[a-z]*[rf]", "rm (flags after path)"),
    (r"\bgit\s+push\s+.*--force\b", "git push --force"),
    (r"\bgit\s+push\s+.*-f\b", "git push -f"),
    (r"\bgit\s+reset\s+--hard\b", "git reset --hard"),
    (r"\bgit\s+clean\s+-[a-z]*f", "git clean -f"),
    (r"\bDROP\s+TABLE\b", "DROP TABLE"),
    (r"\bDROP\s+DATABASE\b", "DROP DATABASE"),
    (r"\bTRUNCATE\s+TABLE\b", "TRUNCATE TABLE"),
    (r"\bmkfs\b", "mkfs (파일시스템 포맷)"),
    (r":\(\)\s*\{\s*:\|:&\s*\};:", "fork bomb"),
    (r"\bRemove-Item\b.*-Recurse\b.*-Force\b", "Remove-Item -Recurse -Force"),
    (r"\bRemove-Item\b.*-Force\b.*-Recurse\b", "Remove-Item -Force -Recurse"),
    (r"\bFormat-Volume\b", "Format-Volume"),
    (r"\bgit\s+checkout\s+\.(?:\s*$|\s*[;&|])", "git checkout . (unstaged 변경 삭제)"),
    (r"\bgit\s+restore\s+\.(?:\s*$|\s*[;&|])", "git restore . (unstaged 변경 삭제)"),
]


def _extract_command(payload: dict) -> str:
    ti = payload.get("tool_input") or {}
    if not isinstance(ti, dict):
        return ""
    parts = []
    for key in ("command", "script"):
        val = ti.get(key)
        if isinstance(val, str):
            parts.append(val)
    return "\n".join(parts)


def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        return 0
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return 0

    command = _extract_command(payload)
    if not command:
        return 0

    for pattern, label in DANGEROUS:
        if re.search(pattern, command, re.IGNORECASE):
            print(f"BLOCKED: 위험한 명령어 감지 — {label}", file=sys.stderr)
            print(f"  명령: {command[:200]}", file=sys.stderr)
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
