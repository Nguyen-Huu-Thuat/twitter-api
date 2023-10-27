import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import mime from 'mime'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/message'
import mediasService from '~/services/medias.services'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.uploadImage(req)

  return res.json({
    message: USER_MESSAGE.UPLOAD_SUCCESSFULLY,
    result
  })
}

export const serveImageController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      return res.status(404).json({
        message: 'Image not found'
      })
    }
  })
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.uploadVideo(req)

  return res.json({
    message: USER_MESSAGE.UPLOAD_SUCCESSFULLY,
    result
  })
}

export const serveVideoStreamController = async (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header')
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
  // Dung lượng của video (bytes)
  const videoSize = fs.statSync(videoPath).size
  // Dung lượng video cho mỗi phân đoạn stream
  const CHUNK_SIZE = 10 ** 6 // 1MB
  // Lấy giá trị byte bắt đầu từ header Range ví dụ: bytes=32324- => 32324
  const start = Number(range.replace(/\D/g, ''))
  // Lấy giá trị byte kết thúc, nếu không có thì lấy giá trị cuối cùng của video
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1)

  // Dung lượng thực tế cho mỗi đoạn video stream thường sẽ là CHUNK_SIZE, ngoại trừ đoạn cuối cùng
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  // HTTP Status 206 for Partial Content
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStreams = fs.createReadStream(videoPath, { start, end })
  videoStreams.pipe(res)
}
