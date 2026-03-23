import { Router } from 'express'

const userRouter = Router()

// Example route handlers
userRouter.get('/', (req, res) => {
  res.send('Get all users')
})

export default userRouter;