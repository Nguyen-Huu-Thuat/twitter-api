import { Router } from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  loginController,
  logoutController,
  getMeController,
  registerController,
  resendemailVerifyController,
  resetPasswordController,
  verifyForgotPasswordController,
  updateMeController,
  getProfileController,
  followController,
  unfollowController,
  changePasswordController,
  oauthController,
  refreshTokenController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeProfileReqBody } from '~/models/requests/User.requests'
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
 * Description: refresh token
 * Method: POST
 * Path: /users/login
 * Body: { refreshToken: string }
 */
userRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

/**
 * Description: Login google
 * Method: POST
 * Path: /users/oauth/google
 * Body: { email: string, password: string }
 */
userRouter.get('/oauth/google', wrapRequestHandler(oauthController))

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
 * Header: { Authorization: Bearer {accessToken}}
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
userRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

/**
 * Description: get my profile
 * Method: GET
 * Path: /me
 * Header: { Authorization: Bearer {accessToken}}
 */
userRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

/**
 * Description: update my profile
 * Method: Patch
 * Path: /me
 * Header: { Authorization: Bearer {accessToken}}
 * Body: UserSchema
 */
userRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeProfileReqBody>([
    'name',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'conver_photo'
  ]),
  wrapRequestHandler(updateMeController)
)

/**
 * Description: get user profile
 * Method: GET
 * Path: /:username
 */
userRouter.get('/:username', wrapRequestHandler(getProfileController))

/**
 * Description: follow user
 * Method: POST
 * Path: /follow
 * Header: { Authorization: Bearer {accessToken}}
 * Body: { followed_user_id: string }
 */
userRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)

/**
 * Description: unfollow user
 * Method: Delete
 * Path: /follow/:user_id
 * Header: { Authorization: Bearer {accessToken}}
 */
userRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
)

/**
 * Description: Change password
 * Method: PUT
 * Path: /change-password
 * Header: { Authorization: Bearer {accessToken}}
 * Body: { o;password: string, new_password: string, confirm_new_password: string }
 */
userRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

export default userRouter
