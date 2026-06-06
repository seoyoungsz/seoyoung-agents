#!/usr/bin/env python3
"""
Stop hook — 코드 변경이 있을 때 자동 검증.
sensor-cache.json이 있으면 감지된 명령을 사용하고, 없으면 자체 감지로 fallback.

종료 코드:
    0 — 통과 (또는 변경 없음 / 스킵)
    2 — 검증 실패 (에이전트 종료 차단, stderr 피드백)

환경변수:
    SEOYOUNG_NO_VERIFY — 검증 일시 스킵
    CLAUDE_PROJECT_DIR — 프로젝트 루트 (없으면 cwd)
"""

import contextlib
import json
import os
import shlex
import shutil
import subprocess
import sys
from pathlib import Path

with contextlib.suppress(Exception):
    sys.stderr.reconfigure(encoding="utf-8")

ALLOWED_COMMANDS = {"npm", "npx", "pnpm", "yarn", "bun", "pytest", "python", "python3", "node", "tsc"}


def _root() -> Path:
    return Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))


def _has_changes(root: Path) -> bool:
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=str(root), capture_output=True, text=True
        )
        if result.returncode != 0:
            print("  [verify] git status 실패 — 변경 있다고 가정", file=sys.stderr)
            return True
        return bool(result.stdout.strip())
    except FileNotFoundError:
        return True


def _run(cmd: list[str], cwd: Path) -> int:
    print(f"  [verify] $ {' '.join(cmd)}", file=sys.stderr)
    try:
        r = subprocess.run(cmd, cwd=str(cwd))
        return r.returncode
    except FileNotFoundError:
        print(f"  [verify] WARNING: '{cmd[0]}' 를 찾을 수 없습니다. 검증이 실행되지 않았습니다.", file=sys.stderr)
        return 0


def _from_sensor_cache(root: Path) -> int:
    cache_path = root / ".claude" / "sensor-cache.json"
    if not cache_path.exists():
        return -1

    try:
        cache = json.loads(cache_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return -1

    sensors = cache.get("sensors", {})
    if not sensors:
        return -1

    for name in ("lint", "typecheck", "check", "test"):
        sensor = sensors.get(name)
        if not sensor:
            continue
        command = sensor.get("command", "")
        if not command:
            continue
        try:
            parts = shlex.split(command)
        except ValueError:
            print(f"  [verify] 명령 파싱 실패: {command}", file=sys.stderr)
            continue
        if parts and parts[0] not in ALLOWED_COMMANDS:
            print(f"  [verify] 허용되지 않은 명령: {parts[0]}", file=sys.stderr)
            continue
        code = _run(parts, root)
        if code != 0:
            return code
    return 0


def _fallback_npm(root: Path) -> int:
    try:
        pkg = json.loads((root / "package.json").read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return 0
    scripts = pkg.get("scripts", {})
    npm = shutil.which("npm") or "npm"
    for name in ("lint", "build", "test"):
        if name in scripts:
            code = _run([npm, "run", name], root)
            if code != 0:
                return code
    return 0


def _fallback_python(root: Path) -> int:
    return _run([sys.executable, "-m", "pytest", "-q"], root)


def main() -> int:
    if os.environ.get("SEOYOUNG_NO_VERIFY"):
        return 0

    root = _root()

    if not _has_changes(root):
        return 0

    cache_result = _from_sensor_cache(root)
    if cache_result >= 0:
        return cache_result

    if (root / "package.json").exists():
        return _fallback_npm(root)

    py_markers = ("pyproject.toml", "requirements.txt", "pytest.ini", "setup.cfg")
    if any((root / m).exists() for m in py_markers):
        return _fallback_python(root)

    return 0


if __name__ == "__main__":
    code = main()
    if code != 0:
        print(f"\n  [verify] 검증 실패 (exit {code}). 위 에러를 고치세요.", file=sys.stderr)
        sys.exit(2)
    sys.exit(0)
