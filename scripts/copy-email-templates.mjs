import { cpSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const sourceDir = path.join(rootDir, 'src', 'email-templates')
const targetDir = path.join(rootDir, 'dist', 'email-templates')

if (!existsSync(sourceDir)) {
  throw new Error(`Email templates source directory not found: ${sourceDir}`)
}

mkdirSync(path.dirname(targetDir), { recursive: true })
cpSync(sourceDir, targetDir, { recursive: true })
