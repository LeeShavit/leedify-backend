import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'

import { userService } from '../user/user.service.js'
import { logger } from '../../services/logger.service.js'

const cryptr = new Cryptr(process.env.SECRET || 'Secret-Puk-1234')

export const authService = {
  signup,
  login,
  loginWithGoogle,
  getLoginToken,
  validateToken,
}

// login({ username: 'guest', Password:'guest123' })

async function login(username, password) {
  try {
    logger.debug(`auth.service - login with username: ${username}`)
    const user = await userService.getByUsername(username)
    if (!user) return Promise.reject('Invalid username or password')

    const match = await bcrypt.compare(password, user.password)
    if (!match) return Promise.reject('Invalid username or password')

    delete user.password
    user._id = user._id.toString()
    return user
  } catch (err) {
    logger.error('Failed to Login in auth service' + err)
  }
}
async function loginWithGoogle(googleUser) {
  try {
    logger.debug(`auth.service - login with Google user: ${googleUser.name}`)

    let user = await userService.getByUsername(googleUser.name)

    if (!user) {
      user = await userService.add({
        username: googleUser.email,
        name: googleUser.name,
        imgUrl: googleUser.imgUrl,
        password: null,
        likedSongs: [],
        likedStations: [],
      })
    }

    delete user.password
    user._id = user._id.toString()
    return user
  } catch (err) {
    logger.error('Failed to login with Google ' + err)
    throw err
  }
}

async function signup({ username, password, name }) {
  const saltRounds = 10

  logger.debug(`auth.service - signup with username: ${username}, name: ${name}`)
  if (!username || !password || !name) return Promise.reject('Missing required signup information')

  const userExist = await userService.getByUsername(username)
  if (userExist) return Promise.reject('Username already taken')

  const hash = await bcrypt.hash(password, saltRounds)
  return userService.add({ username, password: hash, name })
}

function getLoginToken(user) {
  const userInfo = {
    _id: user._id,
    name: user.name,
    username: user.username,
  }
  return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken) {
  try {
    const json = cryptr.decrypt(loginToken)
    const loggedinUser = JSON.parse(json)
    return loggedinUser
  } catch (err) {
    console.log('Invalid login token')
  }
  return null
}
