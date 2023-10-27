import { Request } from 'express'
import { getNamefromFullname, handleUploadImage, handleUploadVideo } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import path, { resolve } from 'path'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Orther'
config()

// const generatePromist = (delay: number) => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(delay)
//     }, delay)
//   })
// }

// async function main() {
//   console.time('await từng cái')
//   await generatePromist(3000)
//   await generatePromist(3000)
//   await generatePromist(3000)
//   console.timeEnd('await từng cái')
// }

// main()

// async function main2() {
//   console.time('await all')
//   await Promise.all([
//     generatePromist(3000),
//     generatePromist(3000),
//     generatePromist(3000)
//   ])
//   console.timeEnd('await all')
// }

// main2()

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNamefromFullname(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const { newFilename } = files[0]
    return {
      url: isProduction
        ? `${process.env.HOST}/static/video/${newFilename}`
        : `http://localhost:${process.env.PORT}/static/video-stream/${newFilename}`,
      type: MediaType.Video
    }
  }
}

const mediasService = new MediasService()

export default mediasService
