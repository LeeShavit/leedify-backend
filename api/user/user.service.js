import { asyncLocalStorage } from '../../services/als.service.js'
import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'
import { stationService } from '../station/station.service.js'
import { likeStation } from '../station/station.controller.js'

export const userService = {
  add,
  getById,
  update,
  remove,
  query,
  getByUsername,
  addLikedSong,
  removeLikedSong,
  addLikedStation,
  getUsersStations,
  updateLikedStation,
  removeLikedStation,
}

async function query(filterBy = {}) {
  try {
    const criteria = _buildCriteria(filterBy)
    const collection = await dbService.getCollection('user')
    const users = await collection.find(criteria).toArray()

    return users.map((user) => {
      delete user.password
      return user
    })
  } catch (err) {
    logger.error('cannot find users', err)
    throw err
  }
}

async function getById(userId) {
  try {
    const collection = await dbService.getCollection('user')
    const user = await collection.findOne({ _id: ObjectId.createFromHexString(userId) })
    delete user.password
    return user
  } catch (err) {
    logger.error(`while finding user by id: ${userId}`, err)
    throw err
  }
}

async function getByUsername(username) {
  try {
    const collection = await dbService.getCollection('user')
    const user = await collection.findOne({ username })

    return user
  } catch (err) {
    logger.error(`while finding user by username: ${username}`, err)
    throw err
  }
}

async function remove(userId) {
  try {
    const collection = await dbService.getCollection('user')
    await collection.deleteOne({ _id: ObjectId.createFromHexString(userId) })
  } catch (err) {
    logger.error(`cannot remove user ${userId}`, err)
    throw err
  }
}

async function update(user) {
  console.log(user)

  try {
    const userToSave = {
      name: user.name,
      username: user.username,
      likedSongs: user.likedSongs,
      likedStations: user.likedStations,
    }
    console.log(userToSave)
    const collection = await dbService.getCollection('user')
    await collection.updateOne({ _id: ObjectId.createFromHexString(user._id) }, { $set: userToSave })
    return userToSave
  } catch (err) {
    logger.error(`cannot update user ${user._id}`, err)
    throw err
  }
}

async function add(user) {
  try {
    const userToAdd = {
      name: user.name,
      username: user.username,
      password: user.password,
      likedSongs: [],
      likedStations: [],
    }

    const collection = await dbService.getCollection('user')
    const res = await collection.insertOne(userToAdd)
    const userId = res.insertedId.toString()

    userToAdd._id = userId
    userToAdd.likedSongs = _getDemoSongs()
    userToAdd.likedStations = await _getDemoStationsForNewUser(userId, userToAdd.name, userToAdd.imgUrl)
    return await update(userToAdd)
  } catch (err) {
    logger.error('cannot add user', err)
    throw err
  }
}

async function addLikedSong(song) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  try {
    const collection = await dbService.getCollection('user')
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

    await collection.updateOne({ _id: ObjectId.createFromHexString(loggedinUser._id) }, { $push: { likedSongs: songToAdd } })
    return getById(loggedinUser._id)
  } catch (err) {
    logger.error(`cannot add liked song to user ${userId}`, err)
    throw err
  }
}
async function removeLikedSong(songId) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  try {
    const collection = await dbService.getCollection('user')
    const res= await collection.updateOne(
      { _id: ObjectId.createFromHexString(loggedinUser._id) },
      { $pull: { likedSongs: { _id: songId } } }
    )
    return getById(loggedinUser._id)
  } catch (err) {
    logger.error(`cannot remove liked song from user ${loggedinUser._id}`, err)
    throw err
  }
}


async function getUsersStations(sortBy) {
  const { loggedinUser } = asyncLocalStorage.getStore()
  const sort = (!sortBy) ? { addedAt: -1 } : _buildSort(sortBy)

  try {
    const collection = await dbService.getCollection('user')
    const res = await collection.aggregate([
      { $match: { _id: ObjectId.createFromHexString(loggedinUser._id) } },
      { $unwind: "$likedStations" },
      { $sort: sort },
      {
        $group: {
          _id: "$_id",
          likedStations: { $push: "$likedStations" }
        }
      }
    ]).toArray()

    return res[0].likedStations
  } catch (err) {
    logger.error(`cannot get liked station of user ${loggedinUser._id}`, err)
    throw err
  }
}

async function addLikedStation(station) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  try {
    const collection = await dbService.getCollection('user')
    const stationToAdd = {
      _id: station._id,
      name: station.name,
      imgUrl: station.imgUrl,
      createdBy: station.createdBy,
      addedAt: Date.now(),
    }

    await collection.updateOne(
      { _id: ObjectId.createFromHexString(loggedinUser._id) },
      { $push: { likedStations: stationToAdd } }
    )
    return getById(loggedinUser._id)
  } catch (err) {
    logger.error(`cannot add liked station to user ${loggedinUser._id}`, err)
    throw err
  }
}

async function updateLikedStation(station) {
  const { loggedinUser } = asyncLocalStorage.getStore()

  try {
    const collection = await dbService.getCollection('user')

    const updateFields = {
      "likedStations.$.name": station.name,
      "likedStations.$.imgUrl": station.imgUrl
    }
    const res = await collection.updateOne(
      {
        _id: ObjectId.createFromHexString(loggedinUser._id),
        "likedStations._id": station._id // Find the station by _id
      },
      { $set: updateFields }
    )

    if (res.matchedCount === 0) {
      throw new Error('User or station not found')
    }
    console.log(res)

    const user = await getById(loggedinUser._id)
    console.log(user)
    return { user, station: user.likedStations.find(likedStation => likedStation._id === station._id) }
  } catch (err) {
    logger.error(`cannot update liked station for user ${loggedinUser._id}`, err)
    throw err
  }
}


async function removeLikedStation(stationId) {

  const { loggedinUser } = asyncLocalStorage.getStore()

  try {
    const collection = await dbService.getCollection('user')
    await collection.updateOne(
      { _id: ObjectId.createFromHexString(loggedinUser._id) },
      { $pull: { likedStations: { _id: stationId } } }
    )
    return getById(loggedinUser._id)
  } catch (err) {
    logger.error(`cannot remove liked station from user ${loggedinUser._id}`, err)
    throw err
  }
}

function _buildCriteria(filterBy) {
  const criteria = {}
  if (filterBy.txt) {
    const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
    criteria.$or = [{ username: txtCriteria }, { name: txtCriteria }]
  }
  return criteria
}

function _buildSort(sortBy) {
  const sort = {}
  if (sortBy === 'alphabetical') sort.name = -1
  if (sortBy === 'creator') sort['createdBy.name'] = -1
  if (sortBy === 'recently added') sort.addedAt = -1
  return sort
}

function _getDemoSongs() {
  return [
    {
      _id: "3Z2tPWiNiIpg8UMMoowHIk",
      name: "We Are The World",
      artists: [
        {
          name: "U.S.A. For Africa",
          _id: "7sF6m3PpW6G6m6J2gzzmzM"
        }
      ],
      album: {
        name: "We Are The World",
        _id: "2O6gXGWFJcNrLYAqDINrDa"
      },
      duration: 427333,
      imgUrl: [
        {
          height: 640,
          url: "https://i.scdn.co/image/ab67616d0000b273920f421260033ee54865d673",
          width: 640
        },
        {
          height: 300,
          url: "https://i.scdn.co/image/ab67616d00001e02920f421260033ee54865d673",
          width: 300
        },
        {
          height: 64,
          url: "https://i.scdn.co/image/ab67616d00004851920f421260033ee54865d673",
          width: 64
        }
      ],
      addedAt: 1731851718157,
      youtubeId: ""
    },
    {
      _id: "4PTG3Z6ehGkBFwjybzWkR8",
      name: "Never Gonna Give You Up",
      artists: [
        {
          name: "Rick Astley",
          _id: "0gxyHStUsqpMadRV0Di1Qt"
        }
      ],
      album: {
        name: "Whenever You Need Somebody",
        _id: "6eUW0wxWtzkFdaEFsTJto6"
      },
      duration: 213573,
      imgUrl: [
        {
          height: 640,
          url: "https://i.scdn.co/image/ab67616d0000b27315ebbedaacef61af244262a8",
          width: 640
        },
        {
          height: 300,
          url: "https://i.scdn.co/image/ab67616d00001e0215ebbedaacef61af244262a8",
          width: 300
        },
        {
          height: 64,
          url: "https://i.scdn.co/image/ab67616d0000485115ebbedaacef61af244262a8",
          width: 64
        }
      ],
      addedAt: 1731851930306,
      youtubeId: ""
    },
    {
      _id: "7JkZ2hQdDonRURJjlMuh8q",
      name: "What Is Love - 7\" Mix",
      artists: [
        {
          name: "Haddaway",
          _id: "0Suv0tRrNrUlRzAy8aXjma"
        }
      ],
      album: {
        name: "What Is Love",
        _id: "5IrMfIT621GidGPuOSRTB4"
      },
      duration: 270373,
      imgUrl: [
        {
          height: 640,
          url: "https://i.scdn.co/image/ab67616d0000b2739c783e96159db6857816809e",
          width: 640
        },
        {
          height: 300,
          url: "https://i.scdn.co/image/ab67616d00001e029c783e96159db6857816809e",
          width: 300
        },
        {
          height: 64,
          url: "https://i.scdn.co/image/ab67616d000048519c783e96159db6857816809e",
          width: 64
        }
      ],
      addedAt: 1731851942001,
      youtubeId: ""
    }
  ]
}

async function _getDemoStationsForNewUser(_id, name, imgUrl) {
  let station1 = {
    name: 'Happy songs',
    imgUrl: 'https://res.cloudinary.com/dsymwlagn/image/upload/v1731852449/uus7rijw5s7npwhjjehl.jpg',
    createdBy: { name, _id, imgUrl },
    tags: [],
    description: '',
    songCount: 3,
    likedByUsers: [],
    addedAt: 1696789200000,
    songs: [{
      _id: "0bRXwKfigvpKZUurwqAlEh",
      name: "Lovely Day",
      artists: [
        {
          name: "Bill Withers",
          _id: "1ThoqLcyIYvZn7iWbj8fsj"
        }
      ],
      album: {
        name: "Menagerie",
        _id: "3QjPTUI6UcPr5m9RujkO3c"
      },
      duration: 254560,
      imgUrl: [
        {
          url: "https://i.scdn.co/image/ab67616d0000b2735ade9b4d547203c9061fc340",
          width: 640,
          height: 640
        },
        {
          url: "https://i.scdn.co/image/ab67616d00001e025ade9b4d547203c9061fc340",
          width: 300,
          height: 300
        },
        {
          url: "https://i.scdn.co/image/ab67616d000048515ade9b4d547203c9061fc340",
          width: 64,
          height: 64
        }
      ],
      addedAt: 1731853016255,
      youtubeId: ""
    },
    {
      _id: "2hKdd3qO7cWr2Jo0Bcs0MA",
      name: "Drops of Jupiter (Tell Me)",
      artists: [
        {
          name: "Train",
          _id: "3FUY2gzHeIiaesXtOAdB7A"
        }
      ],
      album: {
        name: "Drops Of Jupiter",
        _id: "6j6Zgm7vzAZegr48UppFVT"
      },
      duration: 259933,
      imgUrl: [
        {
          url: "https://i.scdn.co/image/ab67616d0000b273a65df73c4011b6a9357c89f0",
          width: 640,
          height: 640
        },
        {
          url: "https://i.scdn.co/image/ab67616d00001e02a65df73c4011b6a9357c89f0",
          width: 300,
          height: 300
        },
        {
          url: "https://i.scdn.co/image/ab67616d00004851a65df73c4011b6a9357c89f0",
          width: 64,
          height: 64
        }
      ],
      addedAt: 1731853027080,
      youtubeId: ""
    },
    {
      _id: "2M9ro2krNb7nr7HSprkEgo",
      name: "Fast Car",
      artists: [
        {
          name: "Tracy Chapman",
          _id: "7oPgCQqMMXEXrNau5vxYZP"
        }
      ],
      album: {
        name: "Tracy Chapman",
        _id: "6hmmX5UP4rIvOpGSaPerV8"
      },
      duration: 296800,
      imgUrl: [
        {
          url: "https://i.scdn.co/image/ab67616d0000b27390b8a540137ee2a718a369f9",
          width: 640,
          height: 640
        },
        {
          url: "https://i.scdn.co/image/ab67616d00001e0290b8a540137ee2a718a369f9",
          width: 300,
          height: 300
        },
        {
          url: "https://i.scdn.co/image/ab67616d0000485190b8a540137ee2a718a369f9",
          width: 64,
          height: 64
        }
      ],
      addedAt: 1731853030328,
      youtubeId: ""
    }]
  }
  station1 = await stationService.add(station1)
  let station2 = {
    name: 'My Party Favs',
    imgUrl: 'https://res.cloudinary.com/dsymwlagn/image/upload/t_ddd/c5qjnleiu7oorke7zqfw.jpg',
    createdBy: { name, _id, imgUrl },
    tags: [],
    description: '',
    songCount: 7,
    addedAt: 1698624000000,
    songs: [{
      _id: "0HPD5WQqrq7wPWR7P7Dw1i",
      name: "TiK ToK",
      artists: [
        {
          name: "Kesha",
          _id: "6LqNN22kT3074XbTVUrhzX"
        }
      ],
      album: {
        name: "Animal",
        _id: "4Fts9DL8sj5UQ0TkN4SvMK"
      },
      duration: 199693,
      imgUrl: [
        {
          url: "https://i.scdn.co/image/ab67616d0000b27365836b344b9d983462d5f1a7",
          width: 640,
          height: 640
        },
        {
          url: "https://i.scdn.co/image/ab67616d00001e0265836b344b9d983462d5f1a7",
          width: 300,
          height: 300
        },
        {
          url: "https://i.scdn.co/image/ab67616d0000485165836b344b9d983462d5f1a7",
          width: 64,
          height: 64
        }
      ],
      addedAt: 1731853045580,
      youtubeId: ""
    },
    {
      _id: "2CEgGE6aESpnmtfiZwYlbV",
      name: "Dynamite",
      artists: [
        {
          name: "Taio Cruz",
          _id: "6MF9fzBmfXghAz953czmBC"
        }
      ],
      album: {
        name: "The Rokstarr Hits Collection",
        _id: "0eGvq1J5Ke7VlLLOYIlY4k"
      },
      duration: 202613,
      imgUrl: [
        {
          url: "https://i.scdn.co/image/ab67616d0000b27366c3eb32692a0ae487079cf1",
          width: 640,
          height: 640
        },
        {
          url: "https://i.scdn.co/image/ab67616d00001e0266c3eb32692a0ae487079cf1",
          width: 300,
          height: 300
        },
        {
          url: "https://i.scdn.co/image/ab67616d0000485166c3eb32692a0ae487079cf1",
          width: 64,
          height: 64
        }
      ],
      addedAt: 1731853047178,
      youtubeId: ""
    },
    {
      _id: "0nrRP2bk19rLc0orkWPQk2",
      name: "Wake Me Up",
      artists: [
        {
          name: "Avicii",
          _id: "1vCWHaC5f2uS3yhpwWbIA6"
        }
      ],
      album: {
        name: "True",
        _id: "2H6i2CrWgXE1HookLu8Au0"
      },
      duration: 247426,
      imgUrl: [
        {
          url: "https://i.scdn.co/image/ab67616d0000b273e14f11f796cef9f9a82691a7",
          width: 640,
          height: 640
        },
        {
          url: "https://i.scdn.co/image/ab67616d00001e02e14f11f796cef9f9a82691a7",
          width: 300,
          height: 300
        },
        {
          url: "https://i.scdn.co/image/ab67616d00004851e14f11f796cef9f9a82691a7",
          width: 64,
          height: 64
        }
      ],
      addedAt: 1731853052088,
      youtubeId: ""
    }]
  }
  station2 = await stationService.add(station2)
  return [
    {
      _id: station1._id,
      name: station1.name,
      imgUrl: station1.imgUrl,
      createdBy: station1.createdBy,
      songCount: station1.songCount,
      addedAt: station1.addedAt
    },
    {
      _id: station2._id,
      name: station2.name,
      imgUrl: station2.imgUrl,
      createdBy: station2.createdBy,
      songCount: station2.songCount,
      addedAt: station2.addedAt
    }
  ]
}

