import express from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'
import {
  getStations,
  getStationById,
  addStation,
  updateStation,
  removeStation,
  likeStation,
  addSong,
  removeSong,
} from './station.controller.js'

const router = express.Router()

router.get('/', log, getStations)
router.get('/:id', log, getStationById)
router.post('/', requireAuth, addStation)
router.put('/:id', requireAuth, updateStation)
router.delete('/:id', requireAuth, removeStation)
router.post('/:id/like', requireAuth, likeStation)
router.post('/:id/song', requireAuth, addSong)
router.delete('/:id/song/:songId', requireAuth, removeSong)

export const stationRoutes = router
