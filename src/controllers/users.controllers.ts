import { config } from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { pick } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Errors'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UnFollowReqParams,
  UpdateMeProfileReqBody,
  VerifyForgotPasswordReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
config()

export const loginController = async (req: Request<ParamsDictionary, LoginReqBody, any>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify })
  res.status(200).json({
    message: USER_MESSAGE.LOGIN_SUCCESSFULLY,
    result
  })
}

export const oauthController = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.query
  const result = await usersService.oauth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${result.accessToken}
  &refresh_token=${result.refreshToken}&new_user=${result.newUser}&verify=${result.verify}`
  console.log(urlRedirect)
  return res.redirect(urlRedirect)
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await usersService.register(req.body)
    return res.status(200).json({
      message: USER_MESSAGE.REGISTER_SUCCESSFULLY,
      result
    })
  } catch (error) {
    next(error)
  }
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  return res.status(200).json({
    message: result.message
  })
}

export const emailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.decode_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(userId)
  })
  //  nếu ko tìm thấy user
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGE.USER_NOT_FOUND
    })
  }
  // đã verify rồi thì trả về status OK với message là đã verify rồi
  if (user.email_verify_token === '') {
    return res.status(HTTP_STATUS.OK).json({
      message: USER_MESSAGE.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  const rs = await usersService.verifyEmail(userId)
  return res.json({
    message: USER_MESSAGE.EMAIL_VERIFY_SUCCESSFULLY,
    result: rs
  })
}

export const resendemailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(userId)
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USER_MESSAGE.USER_NOT_FOUND
    })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.OK).json({
      message: USER_MESSAGE.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  const result = await usersService.resendEmailVerify(userId)
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id, verify } = req.user as User
  const result = await usersService.forgotPassword({ userId: (_id as ObjectId).toString(), verify })
  return res.json(result)
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  return res.json({
    message: USER_MESSAGE.VERIFY_FORGOT_PASSWORD_SUCCESSFULLY
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decode_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await usersService.resetPassword(userId, password)
  return res.json(result)
}

export const getMeController = async (req: Request<ParamsDictionary, any, any>, res: Response, next: NextFunction) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const result = await usersService.getMe(userId)
  return res.json({
    message: USER_MESSAGE.GET_ME_SUCCESSFULLY,
    result
  })
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeProfileReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const { body } = req
  // Chỉ lấy ra các trường được phép update bằng pick() của lodash
  // const body = pick(req.body, ['name', 'date_of_birth', 'bio', 'location', 'website', 'username', 'avatar', 'conver_photo'])
  const user = await usersService.updateMe(userId, body)
  return res.json({
    message: USER_MESSAGE.UPDATE_ME_SUCCESSFULLY,
    user
  })
}

export const getProfileController = async (req: Request, res: Response, next: NextFunction) => {
  const { username } = req.params
  const user = await usersService.getProfile(username)
  return res.json({
    message: USER_MESSAGE.GET_PROFILE_SUCCESSFULLY,
    reuslt: user
  })
}

export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const { followed_user_id } = req.body
  const result = await usersService.follow(userId, followed_user_id)
  return res.json(result)
}

export const unfollowController = async (
  req: Request<ParamsDictionary, UnFollowReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const { user_id: followed_user_id } = req.params
  const result = await usersService.unFollow(userId, followed_user_id)
  return res.json(result)
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const { password } = req.body
  const result = await usersService.changePassword(userId, password)
  return res.json(result)
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { userId: user_id, verify, exp } = req.decode_refresh_token as TokenPayload
  console.log(req.decode_refresh_token)
  const { refresh_token } = req.body
  if (!user_id) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: USER_MESSAGE.USER_NOT_FOUND
    })
  }
  const result = await usersService.refreshToken({ user_id, verify, refresh_token, exp })
  return res.json({
    message: USER_MESSAGE.REFRESH_TOKEN_SUCCESSFULLY,
    result
  })
}
