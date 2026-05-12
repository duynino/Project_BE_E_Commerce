import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()

const readProjectFile = (...segments) =>
  readFileSync(path.join(rootDir, ...segments), 'utf8')

test('production build copies email templates to the runtime dist path', () => {
  const packageJson = JSON.parse(readProjectFile('package.json'))
  const copyScriptPath = path.join(
    rootDir,
    'scripts',
    'copy-email-templates.mjs'
  )

  assert.match(
    packageJson.scripts.build,
    /node scripts\/copy-email-templates\.mjs/
  )
  assert.equal(existsSync(copyScriptPath), true)
})

test('email service resolves templates from dist/email-templates after build', () => {
  const emailService = readProjectFile(
    'src',
    'modules',
    'email',
    'email.service.ts'
  )

  assert.match(emailService, /\.\.\/\.\.\/email-templates/)
  assert.match(emailService, /forgotPasswordTemplate\.html/)
  assert.match(emailService, /verificationEmailTemplate\.html/)
})
