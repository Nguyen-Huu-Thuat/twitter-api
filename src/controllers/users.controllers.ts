import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'thuatnguyen09112002@gmail.com' && password === '123456') {
    return res.status(200).json({
      message: 'Login successfull'
    })
  }
  return res.status(400).json({
    message: 'Email or password is incorrect '
  })
}

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    const result = await usersService.register({ email, password })
    return res.status(200).json({
      message: 'Dang ky thanh cong ',
      result
    })
  } catch (error) {
    console.log(error)
    return res.status(400).json({
      message: 'register fail '
    })
  }
}
