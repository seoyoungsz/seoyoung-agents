import { readdir, readFile, copyFile, mkdir, rm } from "fs/promises"
import { join, basename } from "path"
import { existsSync } from "fs"
import { homedir } from "os"

const SRC = import.meta.dirname!
const HOME = homedir()

const TARGETS = {
  claude: {
    agents: join(HOME, ".claude", "agents"),
    skills: join(HOME, ".claude", "skills", "seoyoung"),
    commands: join(HOME, ".claude", "commands"),
  },
} as const

type Target = keyof typeof TARGETS

interface SyncResult {
  copied: string[]
  skipped: string[]
  removed: string[]
}

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const targetFilter = args.find((a) => a.startsWith("--target="))?.split("=")[1] as
  | Target
  | undefined
const targetFlag = args.includes("--target")
  ? (args[args.indexOf("--target") + 1] as Target)
  : targetFilter

async function listMdFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir)
  return entries.filter((f) => f.endsWith(".md"))
}

async function syncDir(
  srcDir: string,
  destDir: string,
  label: string
): Promise<SyncResult> {
  const result: SyncResult = { copied: [], skipped: [], removed: [] }

  const srcFiles = await listMdFiles(srcDir)
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

  const destFiles = await listMdFiles(destDir)
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

async function syncTarget(target: Target) {
  const paths = TARGETS[target]
  console.log(`\n▸ Syncing to ${target}`)

  const personasResult = await syncDir(
    join(SRC, "personas"),
    paths.agents,
    "personas → agents"
  )
  printResult("personas → agents", personasResult)

  const guidesResult = await syncDir(
    join(SRC, "guides"),
    paths.skills,
    "guides → skills"
  )
  printResult("guides → skills", guidesResult)

  const commandsResult = await syncDir(
    join(SRC, "commands"),
    paths.commands,
    "commands → commands"
  )
  printResult("commands → commands", commandsResult)
}

async function main() {
  console.log(`seoyoung-agents sync${dryRun ? " (dry-run)" : ""}`)
  console.log(`source: ${SRC}`)

  const targets: Target[] = targetFlag ? [targetFlag] : (Object.keys(TARGETS) as Target[])

  for (const target of targets) {
    if (!(target in TARGETS)) {
      console.error(`unknown target: ${target}`)
      process.exit(1)
    }
    await syncTarget(target)
  }

  console.log("\ndone.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
