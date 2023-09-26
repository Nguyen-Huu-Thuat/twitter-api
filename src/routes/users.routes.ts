import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'

const userRouter = Router()

userRouter.post('/login', loginValidator, loginController)
/**
 * Description: Register new user
 * Method: POST
 * Path: /users/register
 * Body: { email: string, password: string, confirmPassword: string, name: string, dateOfBirth: ISO8601 }
 */
userRouter.post('/register', registerValidator, registerController)

export default userRouter
