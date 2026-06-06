import { readdir, readFile, writeFile, copyFile, mkdir } from "fs/promises"
import { join, dirname } from "path"
import { existsSync } from "fs"
import { homedir } from "os"
import { fileURLToPath } from "url"

const SRC = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))
const HOME = homedir()

// --- Target definitions ---

interface TargetDirs {
  agents: string
  skills?: string
  commands?: string
  adapters?: string
  scripts?: string
}

interface TargetConfig {
  dirs: TargetDirs
  backupDir: string
  format: "md" | "toml"
}

const TARGETS: Record<string, TargetConfig> = {
  claude: {
    dirs: {
      agents: join(HOME, ".claude", "agents"),
      skills: join(HOME, ".claude", "skills", "seoyoung"),
      commands: join(HOME, ".claude", "commands"),
      adapters: join(HOME, ".claude", "skills", "seoyoung", "adapters"),
      scripts: join(HOME, ".claude", "scripts"),
    },
    backupDir: join(HOME, ".claude", "backup"),
    format: "md",
  },
  codex: {
    dirs: {
      agents: join(HOME, ".codex", "agents"),
    },
    backupDir: join(HOME, ".codex", "backup"),
    format: "toml",
  },
}

type Target = keyof typeof TARGETS

// --- CLI args ---

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const doBackup = args.includes("--backup")
const validTargets = Object.keys(TARGETS)

function parseTarget(): Target | undefined {
  const eqForm = args.find((a: string) => a.startsWith("--target="))?.split("=")[1]
  const spaceForm = args.includes("--target")
    ? args[args.indexOf("--target") + 1]
    : undefined

  const raw = eqForm ?? spaceForm

  if (args.includes("--target") && !eqForm && !spaceForm) {
    console.error("error: --target requires a value (e.g., --target claude)")
    process.exit(1)
  }

  if (raw && !validTargets.includes(raw)) {
    console.error(`error: unknown target '${raw}'. valid targets: ${validTargets.join(", ")}`)
    process.exit(1)
  }

  return raw as Target | undefined
}

const targetFlag = parseTarget()

// --- Utilities ---

function getDateStamp(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const h = String(now.getHours()).padStart(2, "0")
  const min = String(now.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${d}_${h}${min}`
}

async function listFiles(dir: string, ext: string): Promise<string[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir)
  return entries.filter((f: string) => f.endsWith(ext))
}

// --- Frontmatter parsing ---

interface Frontmatter {
  name: string
  description: string
  model: string
  codexEffort: string
  spawnable: boolean
  body: string
}

function parseFrontmatter(content: string): Frontmatter {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!fmMatch) {
    return { name: "", description: "", model: "", codexEffort: "", spawnable: true, body: content }
  }

  const fmBlock = fmMatch[1]
  const body = fmMatch[2]

  const getField = (s: string, field: string) =>
    s.match(new RegExp(`^${field}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? ""

  const spawnableRaw = getField(fmBlock, "spawnable")

  return {
    name: getField(fmBlock, "name"),
    description: getField(fmBlock, "description"),
    model: getField(fmBlock, "model"),
    codexEffort: getField(fmBlock, "codex_effort"),
    spawnable: spawnableRaw !== "false",
    body: body.trim(),
  }
}

// --- MD → TOML conversion ---

interface ModelMapping {
  model: string
  effort: string
}

function mapModel(claudeModel: string): ModelMapping {
  switch (claudeModel) {
    case "opus":
      return { model: "gpt-5.5", effort: "xhigh" }
    case "sonnet":
      return { model: "gpt-5.5", effort: "medium" }
    default:
      return { model: "gpt-5.5", effort: "medium" }
  }
}

function escapeTomlString(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/\r/g, "")
}

function escapeTomlMultiline(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"""/g, '""\\"')
}

const VALID_EFFORTS = ["low", "medium", "high", "xhigh"] as const

function convertMdToToml(mdContent: string): string | null {
  const fm = parseFrontmatter(mdContent)

  if (!fm.spawnable) return null

  const rawEffort = fm.codexEffort || mapModel(fm.model).effort
  const effort = VALID_EFFORTS.includes(rawEffort as typeof VALID_EFFORTS[number])
    ? rawEffort
    : "medium"
  const model = mapModel(fm.model).model
  const escapedBody = escapeTomlMultiline(fm.body)

  const lines: string[] = []
  if (fm.name) lines.push(`name = "${escapeTomlString(fm.name)}"`)
  if (fm.description) lines.push(`description = "${escapeTomlString(fm.description)}"`)
  lines.push(`model = "${model}"`)
  lines.push(`model_reasoning_effort = "${effort}"`)
  lines.push(`developer_instructions = """\n${escapedBody}\n"""`)

  return lines.join("\n") + "\n"
}

// --- Sync operations ---

interface SyncResult {
  copied: string[]
  skipped: string[]
  removed: string[]
}

async function syncDir(
  srcDir: string,
  destDir: string,
  label: string
): Promise<SyncResult> {
  const result: SyncResult = { copied: [], skipped: [], removed: [] }

  const srcFiles = await listFiles(srcDir, ".md")
  if (srcFiles.length === 0) {
    console.log(`  ${label}: no files to sync`)
    return result
  }

  if (!dryRun) {
    await mkdir(destDir, { recursive: true })
  }

  for (const file of srcFiles) {
    const src = join(srcDir, file)
    const dest = join(destDir, file)

    if (existsSync(dest)) {
      const srcContent = await readFile(src, "utf-8")
      const destContent = await readFile(dest, "utf-8")
      if (srcContent === destContent) {
        result.skipped.push(file)
        continue
      }
    }

    if (dryRun) {
      console.log(`  [dry-run] would copy: ${file} → ${destDir}/`)
    } else {
      await copyFile(src, dest)
    }
    result.copied.push(file)
  }

  const destFiles = await listFiles(destDir, ".md")
  const srcSet = new Set(srcFiles)
  for (const file of destFiles) {
    if (!srcSet.has(file)) {
      result.removed.push(file)
    }
  }

  return result
}

async function syncConvertedDir(
  srcDir: string,
  destDir: string,
  label: string
): Promise<SyncResult> {
  const result: SyncResult = { copied: [], skipped: [], removed: [] }

  const srcFiles = await listFiles(srcDir, ".md")
  if (srcFiles.length === 0) {
    console.log(`  ${label}: no files to sync`)
    return result
  }

  if (!dryRun) {
    await mkdir(destDir, { recursive: true })
  }

  const convertedFiles: string[] = []

  for (const file of srcFiles) {
    const src = join(srcDir, file)
    const destFile = file.replace(/\.md$/, ".toml")
    const dest = join(destDir, destFile)

    const mdContent = await readFile(src, "utf-8")
    const tomlContent = convertMdToToml(mdContent)

    if (tomlContent === null) {
      continue
    }

    convertedFiles.push(destFile)

    if (existsSync(dest)) {
      const destContent = await readFile(dest, "utf-8")
      if (tomlContent === destContent) {
        result.skipped.push(destFile)
        continue
      }
    }

    if (dryRun) {
      console.log(`  [dry-run] would convert: ${file} → ${destDir}/${destFile}`)
    } else {
      await writeFile(dest, tomlContent, "utf-8")
    }
    result.copied.push(destFile)
  }

  const destFiles = await listFiles(destDir, ".toml")
  const expectedSet = new Set(convertedFiles)
  for (const file of destFiles) {
    if (!expectedSet.has(file)) {
      result.removed.push(file)
    }
  }

  return result
}

async function syncPyDir(
  srcDir: string,
  destDir: string,
  label: string
): Promise<SyncResult> {
  const result: SyncResult = { copied: [], skipped: [], removed: [] }

  const srcFiles = await listFiles(srcDir, ".py")
  if (srcFiles.length === 0) {
    console.log(`  ${label}: no files to sync`)
    return result
  }

  if (!dryRun) {
    await mkdir(destDir, { recursive: true })
  }

  for (const file of srcFiles) {
    const src = join(srcDir, file)
    const dest = join(destDir, file)

    if (existsSync(dest)) {
      const srcContent = await readFile(src, "utf-8")
      const destContent = await readFile(dest, "utf-8")
      if (srcContent === destContent) {
        result.skipped.push(file)
        continue
      }
    }

    if (dryRun) {
      console.log(`  [dry-run] would copy: ${file} → ${destDir}/`)
    } else {
      await copyFile(src, dest)
    }
    result.copied.push(file)
  }

  const destFiles = await listFiles(destDir, ".py")
  const srcSet = new Set(srcFiles)
  for (const file of destFiles) {
    if (!srcSet.has(file)) {
      result.removed.push(file)
    }
  }

  return result
}

function printResult(label: string, result: SyncResult) {
  const { copied, skipped, removed } = result
  if (copied.length > 0) {
    console.log(`  ${label}: ${copied.length} synced (${copied.join(", ")})`)
  }
  if (skipped.length > 0) {
    console.log(`  ${label}: ${skipped.length} unchanged`)
  }
  if (removed.length > 0) {
    console.log(
      `  ${label}: ${removed.length} orphaned in dest (${removed.join(", ")}) — not auto-deleted`
    )
  }
}

// --- Backup ---

async function backupDir(destDir: string, backupRoot: string, ext: string): Promise<number> {
  const files = await listFiles(destDir, ext)
  if (files.length === 0) return 0

  if (!dryRun) {
    await mkdir(backupRoot, { recursive: true })
  }

  let count = 0
  for (const file of files) {
    const src = join(destDir, file)
    const dest = join(backupRoot, file)
    if (dryRun) {
      console.log(`  [dry-run] would backup: ${file} → ${backupRoot}/`)
    } else {
      await copyFile(src, dest)
    }
    count++
  }
  return count
}

async function backupTarget(target: Target, stamp: string) {
  const config = TARGETS[target]
  const backupBase = join(config.backupDir, stamp, target)
  const ext = config.format === "toml" ? ".toml" : ".md"
  console.log(`\n▸ Backing up ${target} → ${backupBase}`)

  const dirs: Array<{ dir: string; label: string }> = []
  dirs.push({ dir: config.dirs.agents, label: "agents" })
  if (config.dirs.skills) dirs.push({ dir: config.dirs.skills, label: "skills" })
  if (config.dirs.commands) dirs.push({ dir: config.dirs.commands, label: "commands" })
  if (config.dirs.adapters) dirs.push({ dir: config.dirs.adapters, label: "adapters" })
  if (config.dirs.scripts) dirs.push({ dir: config.dirs.scripts, label: "scripts" })

  for (const { dir, label } of dirs) {
    const fileExt = label === "scripts" ? ".py" : ext
    const count = await backupDir(dir, join(backupBase, label), fileExt)
    if (count > 0) {
      console.log(`  ${label}: ${count} files backed up`)
    }
  }
}

// --- Sync targets ---

async function syncTarget(target: Target) {
  const config = TARGETS[target]
  console.log(`\n▸ Syncing to ${target}`)

  if (config.format === "toml") {
    const result = await syncConvertedDir(
      join(SRC, "personas"),
      config.dirs.agents,
      "personas → agents (toml)"
    )
    printResult("personas → agents (toml)", result)
    return
  }

  const personasResult = await syncDir(
    join(SRC, "personas"),
    config.dirs.agents,
    "personas → agents"
  )
  printResult("personas → agents", personasResult)

  if (config.dirs.skills) {
    const guidesResult = await syncDir(
      join(SRC, "guides"),
      config.dirs.skills,
      "guides → skills"
    )
    printResult("guides → skills", guidesResult)
  }

  if (config.dirs.commands) {
    const commandsResult = await syncDir(
      join(SRC, "commands"),
      config.dirs.commands,
      "commands → commands"
    )
    printResult("commands → commands", commandsResult)
  }

  if (config.dirs.adapters) {
    const adaptersResult = await syncDir(
      join(SRC, "adapters"),
      config.dirs.adapters,
      "adapters → adapters"
    )
    printResult("adapters → adapters", adaptersResult)
  }

  if (config.dirs.scripts) {
    const scriptsResult = await syncPyDir(
      join(SRC, "scripts"),
      config.dirs.scripts,
      "scripts → scripts"
    )
    printResult("scripts → scripts", scriptsResult)
  }
}

// --- Main ---

async function main() {
  console.log(`seoyoung-agents sync${dryRun ? " (dry-run)" : ""}`)
  console.log(`source: ${SRC}`)

  const targets: Target[] = targetFlag ? [targetFlag] : (Object.keys(TARGETS) as Target[])

  for (const target of targets) {
    if (!(target in TARGETS)) {
      console.error(`unknown target: ${target}`)
      process.exit(1)
    }
  }

  if (doBackup) {
    const stamp = getDateStamp()
    for (const target of targets) {
      await backupTarget(target, stamp)
    }
  }

  for (const target of targets) {
    await syncTarget(target)
  }

  console.log("\ndone.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
