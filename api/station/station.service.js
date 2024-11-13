import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'

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
    const collection = await dbService.getCollection('station')
    const station = await collection.findOne({ _id: ObjectId.createFromHexString(stationId) })
    return station
  } catch (err) {
    logger.error(`while finding station ${stationId}`, err)
    throw err
  }
}

async function add(station) {
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
  try {
    const stationToSave = {
      name: station.name,
      description: station.description,
      imgUrl: station.imgUrl,
      genres: station.genres,
      songs: station.songs,
    }
    const collection = await dbService.getCollection('station')
    await collection.updateOne({ _id: ObjectId.createFromHexString(station._id) }, { $set: stationToSave })
    return station
  } catch (err) {
    logger.error(`cannot update station ${station._id}`, err)
    throw err
  }
}

async function remove(stationId) {
  try {
    const collection = await dbService.getCollection('station')
    await collection.deleteOne({ _id: ObjectId.createFromHexString(stationId) })
  } catch (err) {
    logger.error(`cannot remove station ${stationId}`, err)
    throw err
  }
}

async function addStationLike(stationId, user) {
  try {
    const collection = await dbService.getCollection('station')
    await collection.updateOne(
      { _id: ObjectId.createFromHexString(stationId) },
      { $addToSet: { likedByUsers: { _id: user._id, name: user.name } } }
    )
  } catch (err) {
    logger.error(`cannot add station like ${stationId}`, err)
    throw err
  }
}

async function addSong(stationId, song) {
  try {
    const collection = await dbService.getCollection('station')
    await collection.updateOne({ _id: ObjectId.createFromHexString(stationId) }, { $push: { songs: song } })
    return getById(stationId)
  } catch (err) {
    logger.error(`cannot add song to station ${stationId}`, err)
    throw err
  }
}

async function removeSong(stationId, songId) {
  try {
    const collection = await dbService.getCollection('station')
    await collection.updateOne({ _id: ObjectId.createFromHexString(stationId) }, { $pull: { songs: { id: songId } } })
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

  if (filterBy.genre) {
    criteria.genres = { $in: [filterBy.genre] }
  }

  return criteria
}
