import express from 'express'
import userRoutes from './routes/users.routes'
import databaseService from './services/database.services'

// import { databaseService } from './services/database.services'
const app = express()
const port = 3000

app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/user', userRoutes)
databaseService.connect()

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
