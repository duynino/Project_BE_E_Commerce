import jwt from 'jsonwebtoken'
import { User } from '~/modules/user/user.model'
import { AppDataSource } from '~/config/db-config'
import { ioredisClient } from '~/config/redis-config'
import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { JwtRequest } from '~/interface/common'

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]
    if (!token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ status: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' })
    }
    let decodedUser: JwtRequest
    try {
      decodedUser = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtRequest

    } catch {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Invalid or expired access token'
      })
    }
    const userId = decodedUser.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: 'Invalid or expired access token'
      })
    }

    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: userId }
    })

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ status: StatusCodes.UNAUTHORIZED, message: 'Invalid or expired access token' })
    }

    const userForRequest: Partial<User> & { userId: string } = {
      ...user,
      userId: user.id
    }
    delete userForRequest.password

    req.user = userForRequest
    next()
  } catch (error) {
    next(error)
  }
}

const checkPermissions = (requiredPermissions: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user
      if (!user) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ status: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' })
      }
      const userId = user.userId ?? user.id
      if (!userId) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ status: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' })
      }

      const cachedPermissions = await ioredisClient.get(`permissions:${userId}`)
      let permissions: string[] = []
      if (cachedPermissions) {
        permissions = JSON.parse(cachedPermissions)
      } else {
        const user = await AppDataSource.getRepository(User)
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.userRoles', 'userRole')
          .leftJoinAndSelect('userRole.role', 'role')
          .leftJoinAndSelect('role.rolePermissions', 'rolePermission')
          .leftJoinAndSelect('rolePermission.permission', 'permission')
          .where('user.id = :id', { id: userId })
          .getOne()

        if (!user || !user.userRoles || user.userRoles.length === 0) {
          return res
            .status(StatusCodes.FORBIDDEN)
            .json({ status: StatusCodes.FORBIDDEN, message: 'Forbidden' })
        }
        permissions = user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name)
        )
        await ioredisClient.set(
          `permissions:${userId}`,
          JSON.stringify(permissions),
          'EX',
          3600
        )
      }
      const hasPermission = permissions.includes(requiredPermissions)
      if (!hasPermission) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ status: StatusCodes.FORBIDDEN, message: 'Forbidden' })
      }

      user.permissions = permissions

      next()
    } catch (error) {
      next(error)
    }
  }
}
export { authenticate, checkPermissions }
