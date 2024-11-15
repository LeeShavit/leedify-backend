import { logger } from '../../services/logger.service.js'
import { stationService } from './station.service.js'

export async function getStations(req, res) {
  try {
    const filterBy = {
      txt: req.query?.txt || '',
      genre: req.query?.genre || '',
      sortBy: req.query?.sortBy || 'name',
      createdById: req.query?.createdById || ''
    }
    const stations = await stationService.query(filterBy)
    res.json(stations)
  } catch (err) {
    logger.error('Failed to get stations', err)
    res.status(400).send({ err: 'Failed to get stations' })
  }
}

export async function getStationById(req, res) {
  try {
    const stationId = req.params.id
    const station = await stationService.getById(stationId)
    res.json(station)
  } catch (err) {
    logger.error('Failed to get station', err)
    res.status(400).send({ err: 'Failed to get station' })
  }
}

export async function addStation(req, res) {

  try {
    const station = req.body
    const addedStation = await stationService.add(station)
    res.json(addedStation)
  } catch (err) {
    logger.error('Failed to add station', err)
    res.status(400).send({ err: 'Failed to add station' })
  }
}

export async function updateStation(req, res) {
  try {
    const station = req.body
    const updatedStation = await stationService.update(station)
    res.json(updatedStation)
  } catch (err) {
    logger.error('Failed to update station', err)
    res.status(400).send({ err: 'Failed to update station' })
  }
}

export async function removeStation(req, res) {
  try {
    const stationId = req.params.id
    await stationService.remove(stationId)
    res.send({ msg: 'Deleted successfully' })
  } catch (err) {
    logger.error('Failed to remove station', err)
    res.status(400).send({ err: 'Failed to remove station' })
  }
}

export async function likeStation(req, res) {
  const stationId = req.params.id

  try {
    await stationService.addStationLike(stationId)
    res.send({ msg: 'Station liked successfully' })
  } catch (err) {
    logger.error('Failed to like station', err)
    res.status(400).send({ err: 'Failed to like station' })
  }
}

export async function addSong(req, res) {
  const stationId = req.params.id
  try {
    const song = req.body
    song.addedAt = Date.now()

    const updatedStation = await stationService.addSong(stationId, song)
    res.json(updatedStation)
  } catch (err) {
    logger.error('Failed to add song to station', err)
    res.status(400).send({ err: 'Failed to add song' })
  }
}

export async function removeSong(req, res) {
  const stationId = req.params.id
  const songId = req.params.songId

  try {
    const updatedStation = await stationService.removeSong(stationId, songId)
    res.json(updatedStation)
  } catch (err) {
    logger.error('Failed to remove song from station', err)
    res.status(400).send({ err: 'Failed to remove song' })
  }
}
