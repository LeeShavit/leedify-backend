import express from 'express'

import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'

import { getUser, getUsers, deleteUser, updateUser, addLikedSong, removeLikedSong } from './user.controller.js'

const router = express.Router()

router.get('/', getUsers)
router.get('/:id', getUser)
router.put('/:id', requireAuth, updateUser)
router.delete('/:id', requireAuth, requireAdmin, deleteUser)

//new wndpoint for likes

router.post('/:id/song', requireAuth, addLikedSong)
router.delete('/:id/song/:songId', requireAuth, removeLikedSong)

export const userRoutes = router
