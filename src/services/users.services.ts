import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody, UpdateMeProfileReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenTypes, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
import { USER_MESSAGE } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { result } from 'lodash'
import axios from 'axios'
config()

class UsersService {
  private signAccessToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        userId,
        tokenType: TokenTypes.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }

  private signEmailVerifyToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        userId,
        tokenType: TokenTypes.VerifyEmailToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }
  private SignForgotPasswordToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        userId,
        tokenType: TokenTypes.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshToken({ userId, verify, exp }: { userId: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          userId,
          tokenType: TokenTypes.RefreshToken,
          verify,
          exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    }
    return signToken({
      payload: {
        userId,
        tokenType: TokenTypes.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private SignAccessAndRefreshToken({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ userId, verify }), this.signRefreshToken({ userId, verify })])
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      userId: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    // tạo username random
    const username = `username_${user_id.toString().substring(0, 8)}`
    console.log(username)
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token: email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        username: username
      })
    )
    // const user_id = result.insertedId.toString()
    // console.log('email_verify_token', email_verify_token)
    const [accessToken, refreshToken] = await this.SignAccessAndRefreshToken({
      userId: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const { iat, exp } = await this.decodeRefreshToken(refreshToken)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refreshToken,
        iat,
        exp
      })
    )
    return {
      accessToken,
      refreshToken
    }
  }

  async checkEmailExists(email: string) {
    const result = await databaseService.users.findOne({ email })
    return Boolean(result)
    // if( result ) return true
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [accessToken, refreshToken] = await this.SignAccessAndRefreshToken({ userId: user_id.toString(), verify })
    const { iat, exp } = await this.decodeRefreshToken(refreshToken)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refreshToken,
        iat,
        exp
      })
    )
    return {
      accessToken,
      refreshToken
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USER_MESSAGE.LOGOUT_SUCCESSFULLY
    }
  }
  async verifyEmail(userId: string) {
    const [token] = await Promise.all([
      this.SignAccessAndRefreshToken({ userId: userId.toString(), verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne({ _id: new ObjectId(userId) }, [
        {
          $set: {
            verify: UserVerifyStatus.Verified,
            email_verify_token: '',
            updated_at: '$$NOW'
          }
        }
      ])
    ])
    const [accessToken, refreshToken] = token
    const { iat, exp } = await this.decodeRefreshToken(refreshToken)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(userId),
        token: refreshToken,
        iat,
        exp
      })
    )
    return {
      accessToken,
      refreshToken,
      message: USER_MESSAGE.EMAIL_VERIFY_SUCCESSFULLY
    }
  }
  async resendEmailVerify(userId: string) {
    // Xem như là đã đăng nhập
    const email_verify_token = await this.signEmailVerifyToken({
      userId: userId.toString(),
      verify: UserVerifyStatus.Unverified
    })
    console.log('Resend email verify:', email_verify_token)
    await databaseService.users.updateOne({ _id: new ObjectId(userId) }, [
      {
        $set: {
          email_verify_token,
          updated_at: '$$NOW'
        }
      }
    ])
    return {
      message: USER_MESSAGE.RESEND_EMAIL_VERIFY_SUCCESSFULLY
    }
  }
  async forgotPassword({ userId, verify }: { userId: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.SignForgotPasswordToken({ userId, verify })
    await databaseService.users.updateOne({ _id: new ObjectId(userId) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }
    ])
    // Gửi email kèm đường link đến email người dùng: https://localhost:3000/forgot-password?token={forgot_password_token}
    console.log('forgot_password_token', forgot_password_token)
    return {
      message: USER_MESSAGE.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    return {
      message: USER_MESSAGE.RESET_PASSWORD_SUCCESSFULLY
    }
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0 // 0 là ko lấy, 1 là lấy
        }
      }
    )
    if (!user) {
      return {
        message: USER_MESSAGE.USER_NOT_FOUND
      }
    }
    return user
  }

  async updateMe(userId: string, payload: UpdateMeProfileReqBody) {
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(userId)
      },
      [
        {
          $set: {
            ...payload,
            updated_at: '$$NOW'
          }
        }
      ],
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0 // 0 là ko lấy, 1 là lấy
        }
      }
    )
    return user
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0 // 0 là ko lấy, 1 là lấy
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (follower === null) {
      await databaseService.followers.insertOne({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
      return {
        message: USER_MESSAGE.FOLLOW_SUCCESSFULLY
      }
    }
    return {
      message: USER_MESSAGE.FOLLOWED
    }
  }

  async unFollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    // Không tìm thấy follower
    if (follower === null) {
      return {
        message: USER_MESSAGE.ALREADY_UNFOLLOWED
      }
    }
    // Tìm thấy follower thì tiến hành xoá document
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USER_MESSAGE.UNFOLLOW_SUCCESSFULLY
    }
  }

  async changePassword(userId: string, new_password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(userId)
      },
      [
        {
          $set: {
            password: hashPassword(new_password),
            updated_at: '$$NOW'
          }
        }
      ]
    )
    return {
      message: USER_MESSAGE.CHANGE_PASSWORD_SUCCESSFULLY
    }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const data = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data
  }

  private async getOauthGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data
  }

  async oauth(code: string) {
    const { data } = await this.getOauthGoogleToken(code)
    const { access_token, id_token } = data
    const userInfo = await this.getOauthGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USER_MESSAGE.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Kiểm tra email đã được đki hay chưa
    const user = await databaseService.users.findOne({ email: userInfo.email })
    console.log('user', user)
    // Nếu đã tồn tại thì tiến hành đăng nhập
    if (user) {
      const [accessToken, refreshToken] = await this.SignAccessAndRefreshToken({
        userId: user._id.toString(),
        verify: user.verify
      })
      const { iat, exp } = await this.decodeRefreshToken(refreshToken)
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({
          user_id: user._id,
          token: refreshToken,
          iat,
          exp
        })
      )
      return {
        accessToken,
        refreshToken,
        newUser: 0,
        verify: user.verify
      }
    } else {
      // random string password
      const password = 'Thuat@123456'
      // Không thì tạo mới
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      })
      return { ...data, newUser: 1, verify: UserVerifyStatus.Unverified }
    }
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ userId: user_id, verify }),
      this.signRefreshToken({ userId: user_id, verify, exp }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])
    const decode_refresh_token = await this.decodeRefreshToken(new_refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        iat: decode_refresh_token.iat,
        exp: decode_refresh_token.exp
      })
    )
    return {
      accessToken: new_access_token,
      refreshToken: new_refresh_token
    }
  }
}
const usersService = new UsersService()
export default usersService
