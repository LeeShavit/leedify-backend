import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'
import { userService } from '../user/user.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
import { socketService } from '../../services/socket.service.js'

export const stationService = {
  query,
  getById,
  add,
  update,
  remove,
  addStationLike,
  addSong,
  removeSong,
}

async function query(filterBy = {}) {

  try {
    const criteria = _buildCriteria(filterBy)
    const collection = await dbService.getCollection('station')
    var stations = await collection.find(criteria).toArray()
    return stations
  } catch (err) {
    logger.error('cannot find stations', err)
    throw err
  }
}

async function getById(stationId) {

  try {
    if (stationId === 'liked-songs') return await _getLikedSongsStation()
    const collection = await dbService.getCollection('station')
    if (stationId.length === 22) {
      const station = await collection.findOne({ _id: stationId })
      return station
    } else {
      const station = await collection.findOne({ _id: ObjectId.createFromHexString(stationId) })
      return station
    }
  } catch (err) {
    logger.error(`while finding station ${stationId}`, err)
    throw err
  }
}

async function add(station) {

  const { loggedinUser } = asyncLocalStorage.getStore()
  if (!station.createdBy) {
    station.createdBy = {
      _id: loggedinUser._id,
      name: loggedinUser.name,
      imgUrl: loggedinUser.imgUrl,
    }
  }

  try {
    const collection = await dbService.getCollection('station')
    await collection.insertOne(station)
    return station
  } catch (err) {
    logger.error('cannot insert station', err)
    throw err
  }
}

async function update(station) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  try {
    const stationToSave = {
      name: station.name,
      description: station.description,
      imgUrl: station.imgUrl,
      genres: station.genres,
      songs: station.songs,
    }
    const collection = await dbService.getCollection('station')
    await collection.updateOne({
      _id: ObjectId.createFromHexString(station._id),
      'createdBy._id': loggedinUser._id
    }, { $set: stationToSave })

    socketService.emitTo({type: 'station-edit', data: station})
    return station
  } catch (err) {
    logger.error(`cannot update station ${station._id}`, err)
    throw err
  }
}

async function remove(stationId) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  try {
    const collection = await dbService.getCollection('station')

    await collection.deleteOne({
      _id: ObjectId.createFromHexString(stationId),
      'createdBy._id': loggedinUser._id
    })
  } catch (err) {
    logger.error(`cannot remove station ${stationId}`, err)
    throw err
  }
}

async function addStationLike(stationId) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  try {
    const collection = await dbService.getCollection('station')
    const criteria = {
      _id: ObjectId.createFromHexString(stationId),
      $addToSet: {
        likedByUsers:
          { _id: loggedinUser._id, name: loggedinUser.name }
      }
    }
    await collection.updateOne(criteria)
  } catch (err) {
    logger.error(`cannot add station like ${stationId}`, err)
    throw err
  }
}

async function addSong(stationId, song) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  try {
    const collection = await dbService.getCollection('station')
    const songToAdd = {
      _id: song._id,
      name: song.name,
      artists: song.artists.map((artist) => ({
        name: artist.name,
        _id: artist._id,
      })),
      album: {
        name: song.album.name,
        _id: song.album._id,
      },
      duration: song.duration,
      imgUrl: song.imgUrl,
      addedAt: Date.now(),
      youtubeId: song.youtubeId || '',
    }

    await collection.updateOne({
      _id: ObjectId.createFromHexString(stationId),
      'createdBy._id': loggedinUser._id
    }, { $push: { songs: songToAdd } })

    return getById(stationId)
  } catch (err) {
    logger.error(`cannot add song to station ${stationId}`, err)
    throw err
  }
}

async function removeSong(stationId, songId) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  try {
    const collection = await dbService.getCollection('station')
    await collection.updateOne({
      _id: ObjectId.createFromHexString(stationId),
      'createdBy._id': loggedinUser._id
    }, { $pull: { songs: { _id: songId } } })
    return getById(stationId)
  } catch (err) {
    logger.error(`cannot remove song from station ${stationId}`, err)
    throw err
  }
}

function _buildCriteria(filterBy) {
  const criteria = {}

  if (filterBy.txt) {
    const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
    criteria.$or = [{ name: txtCriteria }, { description: txtCriteria }]
  }

  if (filterBy.createdById) {
    criteria['createdBy._id'] = filterBy.createdById
  }

  return criteria
}

async function _getLikedSongsStation() {
  try {
    const { loggedinUser } = asyncLocalStorage.getStore()
    const user = await userService.getById(loggedinUser._id)
    return {
      _id: 'liked-songs',
      name: 'Liked Songs',
      description: '',
      imgUrl: 'https://misc.scdn.co/liked-songs/liked-songs-300.png',
      createdBy: { name: user.name, _id: user._id, imgUrl: user.imgUrl },
      songs: [...user.likedSongs].sort((a, b) => a.AddedAt - b.AddedAt),
    }
  } catch (err) {
    console.log('station service- failed to get liked songs')
  }
}