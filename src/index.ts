import express, { Request, Response, NextFunction } from 'express'
import userRoutes from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediaRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import argv from 'minimist'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'
import staticRouter from './routes/static.routes'
config()

// import { databaseService } from './services/database.services'
const app = express()
const port = process.env.PORT || 4000

initFolder()

app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello World!')
})
databaseService.connect()

app.use('/users', userRoutes)
app.use('/medias', mediaRouter)
app.use('/static', staticRouter)
app.use('/static', express.static(UPLOAD_IMAGE_DIR))
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
