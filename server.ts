import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import Router from './src/index'
import { AppDataSource } from './src/config/db-config'
import { defaultErrorHandler } from './src/middlewares/error.middlewares'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import fs from 'fs'
import http from 'http'
import { emailQueue, emailWorker } from './src/utils/queue'
import './src/config/cloudinary-config'

// Read the OpenAPI specification from a YAML file
const swaggerDocument = YAML.parse(fs.readFileSync('./swagger.yaml', 'utf8'))

const app = express()
const PORT = process.env.PORT || 4000
const isProduction = process.env.NODE_ENV === 'production'

// ──────────────────────────────────────────────
// Middlewares
// ──────────────────────────────────────────────
app.use(helmet())
app.use(morgan(isProduction ? 'combined' : 'dev'))
app.use(express.json())

app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────
app.use('/', Router)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Health check — cần cho load balancer / container orchestration
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
})

app.use(defaultErrorHandler)

// ──────────────────────────────────────────────
// Bootstrap
// ──────────────────────────────────────────────
let server: http.Server

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully')
    server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`)
      console.log(`📄 API documentation available at http://localhost:${PORT}/api-docs`)
    })
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error)
    process.exit(1) // Thoát ngay nếu không kết nối được DB
  })

// ──────────────────────────────────────────────
// Graceful Shutdown
// ──────────────────────────────────────────────
let isShuttingDown = false

const shutdown = async (signal: string) => {
  // Tránh double-shutdown khi nhiều signal cùng lúc (vd: SIGTERM + unhandledRejection)
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`)

  // Force-kill sau 10s nếu vẫn chưa xong
  const forceExit = setTimeout(() => {
    console.error('❌ Graceful shutdown timed out. Force exiting.')
    process.exit(1)
  }, 10_000)

  // Ngừng nhận request mới, đợi request hiện tại xử lý xong
  server.close(async (err) => {
    if (err) {
      console.error('Error closing HTTP server:', err)
      process.exit(1)
    }

    console.log('🔌 HTTP server closed')

    // Đóng BullMQ worker trước (dừng nhận job mới), sau đó đóng queue
    try {
      await emailWorker.close()
      console.log('📭 Email worker closed')
      await emailQueue.close()
      console.log('📬 Email queue closed')
    } catch (err) {
      console.error('Error closing BullMQ:', err)
    }

    // Đóng database connection
    try {
      await AppDataSource.destroy()
      console.log('🗄️  Database connection closed')
    } catch (err) {
      console.error('Error closing database connection:', err)
    }

    clearTimeout(forceExit) // Huỷ force-kill nếu đã shutdown thành công
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (reason) => {
  console.error('🚨 Unhandled Promise Rejection:', reason)
  shutdown('unhandledRejection') // Trigger shutdown thay vì chỉ log
})

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error)
  shutdown('uncaughtException') // Shutdown có kiểm soát thay vì process.exit thẳng
})
