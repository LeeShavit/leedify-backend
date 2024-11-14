import express from 'express'

import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'

import { getUser, getUsers, deleteUser, updateUser, addLikedSong, removeLikedSong, addLikedStation, removeLikedStation} from './user.controller.js'

const router = express.Router()

router.get('/', getUsers)
router.get('/:id', getUser)
router.put('/:id', requireAuth, updateUser)
router.delete('/:id', requireAuth, requireAdmin, deleteUser)

//new endpoint for likes

router.post('/song', requireAuth, addLikedSong)
router.delete('/song/:songId', requireAuth, removeLikedSong)
router.post('/station', requireAuth, addLikedStation)
router.delete('/station/:stationId', requireAuth, removeLikedStation)

export const userRoutes = router
