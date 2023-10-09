import { error } from 'console'
import { Router } from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendemailVerifyController,
  resetPasswordController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator
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
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

/**
 * Description: Verify email when register click link in email
 * Method: POST
 * Path: /users/verify-email
 * Body: { verify_email_token: string }
 */
userRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))

/**
 * Description: resend verify email
 * Method: POST
 * Path: /users/resend-verify-email
 * Header: { Authorization: Bearer {accessToken}
 * Body: {}
 */
userRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendemailVerifyController))

/**
 * Description: submit email to reset password, send email to user
 * Method: POST
 * Path: /users/forgot-password
 * Body: { email: string }
 */
userRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

/**
 * Description: Verify link in email to reset password
 * Method: POST
 * Path: /users/verify-forgot-password
 * Body: { forgot-password-token: string }
 */
userRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

/**
 * Description: Reset password
 * Method: POST
 * Path: /users/reset-password
 * Body: { forgot-password-token: string, password: string, confirm_password: string }
 */
userRouter.post(
  '/reset-password',
  resetPasswordValidator,
  wrapRequestHandler(resetPasswordController)
)
export default userRouter
