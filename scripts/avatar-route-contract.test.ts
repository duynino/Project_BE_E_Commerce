import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()

const readProjectFile = (...segments: string[]) =>
  readFileSync(path.join(rootDir, ...segments), 'utf8')

test('user router exposes POST /profile/avatar for avatar uploads', () => {
  const router = readProjectFile('src', 'modules', 'user', 'user.router.ts')
  const avatarRoute = router.slice(
    router.indexOf("'/profile/avatar'") - 80,
    router.indexOf('// Admin')
  )

  assert.match(avatarRoute, /router\.post\(/)
  assert.match(avatarRoute, /handleUpdateImageUpload\('avatar', 'avatars'\)/)
  assert.match(avatarRoute, /applyUploadedFileToBody/)
  assert.match(avatarRoute, /updateAvatarUser/)
})

test('swagger documents POST /users/profile/avatar', () => {
  const swagger = readProjectFile('swagger.yaml')
  const avatarPath = swagger.slice(
    swagger.indexOf('/users/profile/avatar:'),
    swagger.indexOf('  /categories:', swagger.indexOf('/users/profile/avatar:'))
  )

  assert.match(avatarPath, /post:/)
  assert.doesNotMatch(avatarPath, /put:/)
  assert.match(avatarPath, /multipart\/form-data/)
  assert.match(avatarPath, /avatar:/)
})
