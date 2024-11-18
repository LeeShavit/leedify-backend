import { config } from '../config/index.js'
import { logger } from '../services/logger.service.js'
import { asyncLocalStorage } from '../services/als.service.js'

export function requireAuth(req, res, next) {
	console.log('requireAuth middleware called')
    console.log('Request path:', req.path)
    console.log('Request method:', req.method)

	const { loggedinUser } = asyncLocalStorage.getStore()
	req.loggedinUser = loggedinUser

	if (config.isGuestMode && !loggedinUser) {
		req.loggedinUser = { _id: '673747e44f46d732f3578f0a', name: 'Guest User' }
		return next()
	}
	if (!loggedinUser) return res.status(401).send('Not Authenticated')
	next()
}

export function requireAdmin(req, res, next) {
	const { loggedinUser } = asyncLocalStorage.getStore()
    
	if (!loggedinUser) return res.status(401).send('Not Authenticated')
	if (!loggedinUser.isAdmin) {
		logger.warn(loggedinUser.name + 'attempted to perform admin action')
		res.status(403).end('Not Authorized')
		return
	}
	next()
}
