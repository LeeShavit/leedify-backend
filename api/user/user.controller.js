import { userService } from './user.service.js'
import { logger } from '../../services/logger.service.js'
import { socketService } from '../../services/socket.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

export async function getUser(req, res) {
  try {
    const user = await userService.getById(req.params.id)
    res.send(user)
  } catch (err) {
    logger.error('Failed to get user', err)
    res.status(400).send({ err: 'Failed to get user' })
  }
}

export async function getUsers(req, res) {
  try {
    const filterBy = {
      txt: req.query?.txt || '',
      minBalance: +req.query?.minBalance || 0,
    }
    const users = await userService.query(filterBy)
  } catch (err) {
    logger.error('Failed to get users', err)
    res.status(400).send({ err: 'Failed to get users' })
  }
}

export async function deleteUser(req, res) {
  try {
    await userService.remove(req.params.id)
    res.send({ msg: 'Deleted successfully' })
  } catch (err) {
    logger.error('Failed to delete user', err)
    res.status(400).send({ err: 'Failed to delete user' })
  }
}

export async function updateUser(req, res) {
  try {
    const user = req.body
    const savedUser = await userService.update(user)
    res.send(savedUser)
  } catch (err) {
    logger.error('Failed to update user', err)
    res.status(400).send({ err: 'Failed to update user' })
  }
}

export async function addLikedSong(req, res) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  if (!loggedinUser) {
    return res.status(403).send({ err: 'Not authorized' })
  }

  try {
    const song = req.body
    console.log(song)
    const updatedUser = await userService.addLikedSong(song)
    res.json(updatedUser)
  } catch (err) {
    logger.error('Failed to add liked song', err)
    res.status(400).send({ err: 'Failed to add liked song' })
  }
}

export async function removeLikedSong(req, res) {

  const { loggedinUser } = asyncLocalStorage.getStore()
  if (!loggedinUser) {
    return res.status(403).send({ err: 'Not authorized' })
  }
  const songId = req.params.songId
  try {
    const updatedUser = await userService.removeLikedSong(songId)
    res.json(updatedUser)
  } catch (err) {
    logger.error('Failed to remove liked song', err)
    res.status(400).send({ err: 'Failed to remove liked song' })
  }
}



export async function getUsersStations(req, res) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  if (!loggedinUser) {
    return res.status(403).send({ err: 'Not authorized' })
  }
  try {
    const stations = await userService.getUsersStations()
    res.json(stations)

  } catch (err) {
    logger.error('Failed to add liked song', err)
    res.status(400).send({ err: 'Failed to add liked song' })
  }
}

export async function addLikedStation(req, res) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  if (!loggedinUser) {
    return res.status(403).send({ err: 'Not authorized' })
  }
  try {
    const station = req.body
    const updatedUser = await userService.addLikedStation(station)
    res.json(updatedUser)
  } catch (err) {
    logger.error('Failed to add liked song', err)
    res.status(400).send({ err: 'Failed to add liked song' })
  }
}

export async function updateLikedStation(req, res) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  if (!loggedinUser) {
    return res.status(403).send({ err: 'Not authorized' })
  }

  const station = req.body

  try {
    const updatedUser = await userService.updateLikedStation(station)
    res.json(updatedUser)
  } catch (err) {
    logger.error('Failed to add liked song', err)
    res.status(400).send({ err: 'Failed to add liked song' })
  }
}

export async function removeLikedStation(req, res) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  if (!loggedinUser) {
    return res.status(403).send({ err: 'Not authorized' })
  }

  const stationId = req.params.stationId
  try {
    const updatedUser = await userService.removeLikedStation(stationId)
    res.json(updatedUser)
  } catch (err) {
    logger.error('Failed to add liked song', err)
    res.status(400).send({ err: 'Failed to add liked song' })
  }
}

