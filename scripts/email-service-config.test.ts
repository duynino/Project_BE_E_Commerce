import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmailTransportConfig } from '../src/modules/email/email.service'

const withEnv = <T>(env: NodeJS.ProcessEnv, run: () => T) => {
  const previous = { ...process.env }
  Object.assign(process.env, env)

  try {
    return run()
  } finally {
    process.env = previous
  }
}

test('email transport uses STARTTLS for smtp port 587', () => {
  withEnv(
    {
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '587',
      EMAIL_USER: 'sender@example.com',
      EMAIL_PASSWORD: 'app-password'
    },
    () => {
      const config = createEmailTransportConfig()

      assert.equal(config.host, 'smtp.gmail.com')
      assert.equal(config.port, 587)
      assert.equal(config.secure, false)
      assert.equal(config.auth.user, 'sender@example.com')
      assert.equal(config.auth.pass, 'app-password')
    }
  )
})

test('email transport uses implicit TLS for smtp port 465', () => {
  withEnv(
    {
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '465',
      EMAIL_USER: 'sender@example.com',
      EMAIL_PASSWORD: 'app-password'
    },
    () => {
      const config = createEmailTransportConfig()

      assert.equal(config.port, 465)
      assert.equal(config.secure, true)
    }
  )
})
