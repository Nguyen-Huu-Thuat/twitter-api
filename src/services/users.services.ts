import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenTypes, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
import { USER_MESSAGE } from '~/constants/message'
config()

class UsersService {
  private signAccessToken(userId: string) {
    return signToken({
      payload: {
        userId,
        tokenType: TokenTypes.AccessToken
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }

  private signEmailVerifyToken(userId: string) {
    return signToken({
      payload: {
        userId,
        tokenType: TokenTypes.VerifyEmailToken
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }
  private SignForgotPasswordToken(userId: string) {
    return signToken({
      payload: {
        userId,
        tokenType: TokenTypes.ForgotPasswordToken
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshToken(userId: string) {
    return signToken({
      payload: {
        userId,
        tokenType: TokenTypes.RefreshToken
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private SignAccessAndRefreshToken(userId: string) {
    return Promise.all([this.signAccessToken(userId), this.signRefreshToken(userId)])
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token: email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    // const user_id = result.insertedId.toString()
    // console.log('email_verify_token', email_verify_token)
    const [accessToken, refreshToken] = await this.SignAccessAndRefreshToken(user_id.toString())
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refreshToken
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

  async login(user_id: string) {
    const [accessToken, refreshToken] = await this.SignAccessAndRefreshToken(user_id)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refreshToken
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
      this.SignAccessAndRefreshToken(userId),
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
    return {
      accessToken,
      refreshToken,
      message: USER_MESSAGE.EMAIL_VERIFY_SUCCESSFULLY
    }
  }
  async resendEmailVerify(userId: string) {
    // Xem như là đã đăng nhập
    const email_verify_token = await this.signEmailVerifyToken(userId)
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
  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.SignForgotPasswordToken(user_id)
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
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
}
const usersService = new UsersService()
export default usersService
