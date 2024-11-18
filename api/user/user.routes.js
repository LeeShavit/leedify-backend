import express from 'express'

import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'

import { getUser, getUsers, deleteUser, updateUser, addLikedSong, removeLikedSong, addLikedStation, getUsersStations, removeLikedStation, updateLikedStation} from './user.controller.js'

const router = express.Router()

router.post('/station', requireAuth, addLikedStation)
router.put('/station', requireAuth, updateLikedStation)
router.delete('/station/:stationId', requireAuth, removeLikedStation)

router.post('/song', requireAuth, addLikedSong)
router.delete('/song/:songId', requireAuth, removeLikedSong)

router.get('/', getUsers)
router.get('/:id', getUser)
router.put('/:id', requireAuth, updateUser)
router.delete('/:id', requireAuth, requireAdmin, deleteUser) 
router.get('/:id/station', requireAuth, getUsersStations)


export const userRoutes = router
