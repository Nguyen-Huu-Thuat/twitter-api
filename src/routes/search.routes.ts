import { Router } from 'express'
import { searchController } from '~/controllers/search.controllers'

const searchRoutes = Router()

searchRoutes.get('/', searchController)

export default searchRoutes
