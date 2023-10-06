import { error } from 'console'
import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const userRouter = Router()

/**
 * Description: Login user
 * Method: POST
 * Path: /users/login
 * Body: { email: string, password: string }
 */
userRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * Description: Register new user
 * Method: POST
 * Path: /users/register
 * Body: { email: string, password: string, confirmPassword: string, name: string, dateOfBirth: ISO8601 }
 */
userRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 * Description: Logout user
 * Method: POST
 * Path: /users/logout
 * Header: { Authorization: Bearer {accessToken}
 * Body: { refreshToken: string }
 */
// userRouter.post('/logout', accessTokenValidator, wrapRequestHandler(logoutController))
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

export default userRouter
