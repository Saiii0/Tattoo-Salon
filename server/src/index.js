import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import pool from './db.js'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import multer from 'multer'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10)
const uploadsDir = path.resolve('uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
})

const jwtConfig = (() => {
  const secret = process.env.JWT_SECRET
  const issuer = process.env.JWT_ISSUER
  const audience = process.env.JWT_AUDIENCE
  const expiresInSec = Number(process.env.JWT_EXPIRES_IN || 3600)

  if (!secret || !issuer || !audience) {
    throw new Error('JWT config missing: JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE are required')
  }

  return { secret, issuer, audience, expiresInSec }
})()

const base64urlEncode = (value) =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')

const base64urlDecode = (value) =>
  JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))

const signJwt = (claims) => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    ...claims,
    iss: jwtConfig.issuer,
    aud: jwtConfig.audience,
    iat: now,
    exp: now + jwtConfig.expiresInSec,
  }

  const encodedHeader = base64urlEncode(header)
  const encodedPayload = base64urlEncode(payload)
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = crypto
    .createHmac('sha256', jwtConfig.secret)
    .update(data)
    .digest('base64url')

  return `${data}.${signature}`
}

const verifyJwt = (token) => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('invalid token')
  }

  const [encodedHeader, encodedPayload, signature] = parts
  const header = base64urlDecode(encodedHeader)
  if (header.alg !== 'HS256') {
    throw new Error('invalid token')
  }

  const data = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = crypto
    .createHmac('sha256', jwtConfig.secret)
    .update(data)
    .digest('base64url')

  const sigBuffer = Buffer.from(signature, 'base64url')
  const expectedBuffer = Buffer.from(expectedSignature, 'base64url')
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new Error('invalid token')
  }

  const payload = base64urlDecode(encodedPayload)
  if (payload.iss !== jwtConfig.issuer) {
    throw new Error('invalid token')
  }

  const aud = payload.aud
  const audOk = Array.isArray(aud) ? aud.includes(jwtConfig.audience) : aud === jwtConfig.audience
  if (!audOk) {
    throw new Error('invalid token')
  }

  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp === 'number' && now >= payload.exp) {
    throw new Error('token expired')
  }

  if (!payload.sub || !payload.role) {
    throw new Error('invalid token')
  }

  return payload
}

const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'missing bearer token' })
  }

  try {
    const payload = verifyJwt(token)
    req.user = { id: Number(payload.sub), role: payload.role }
    return next()
  } catch (err) {
    return res.status(401).json({ message: 'invalid token' })
  }
}

const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'unauthorized' })
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'forbidden' })
  }
  return next()
}

const mapUserRow = (row) => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
  role: row.role,
  avatar: row.avatar || '',
  rating: row.rating ? Number(row.rating) : 0,
  servicesCount: row.services_count ?? 0,
  createdAt: row.created_at ? String(row.created_at).split('T')[0] : null,
})

const mapServiceRow = (row) => ({
  id: String(row.id),
  name: row.name,
  description: row.description,
  price: row.price,
  duration: row.duration,
  imageUrl: row.image_url,
  rating: row.rating ? Number(row.rating) : 0,
  reviewsCount: row.reviews_count ?? 0,
})

const recalcServiceRating = async (serviceId) => {
  const result = await pool.query(
    `select count(*)::int as count, coalesce(avg(rating), 0) as avg_rating
     from reviews where service_id = $1 and deleted = false`,
    [serviceId]
  )
  const { count, avg_rating } = result.rows[0]
  await pool.query(
    'update services set rating = $1, reviews_count = $2 where id = $3',
    [Number(avg_rating), count, serviceId]
  )
}

const recalcMasterStats = async (masterId) => {
  if (!masterId) return
  const completedResult = await pool.query(
    `select count(*)::int as count from orders where master_id = $1 and status = 'completed'`,
    [masterId]
  )
  const ratingResult = await pool.query(
    `select coalesce(avg(r.rating), 0) as avg_rating
     from reviews r
     join orders o on o.user_id = r.user_id and o.service_id = r.service_id
     where o.master_id = $1 and o.status = 'completed' and r.deleted = false`,
    [masterId]
  )
  const completedCount = completedResult.rows[0]?.count ?? 0
  const avgRating = ratingResult.rows[0]?.avg_rating ?? 0
  await pool.query(
    'update users set services_count = $1, rating = $2 where id = $3',
    [completedCount, Number(avgRating), masterId]
  )
}

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tattoo Salon API',
      version: '0.0.1',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    servers: [{ url: 'http://localhost:3001' }],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          responses: {
            200: { description: 'OK' },
            500: { description: 'DB connection failed' },
          },
        },
      },
    },
  },
  apis: [],
})

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.get('/', (_req, res) => {
  res.json({ status: 'ok', docs: '/api/docs' })
})

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('select 1 as ok')
    res.json({ status: 'ok' })
  } catch (err) {
    console.error('DB health check failed:', err.message)
    res.status(500).json({ status: 'error', message: 'db connection failed' })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const result = await pool.query(
      `insert into users (name, email, password_hash, role, avatar)
       values ($1, $2, $3, 'user', $4)
       returning id, name, email, role, avatar, rating, services_count, created_at`,
      [name, email, passwordHash, null]
    )

    const user = mapUserRow(result.rows[0])
    const access_token = signJwt({ sub: String(user.id), role: user.role })
    return res.status(201).json({ access_token, user })
  } catch (err) {
    console.error('Register failed:', err.message)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'email already exists' })
    }
    return res.status(500).json({ message: 'server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' })
  }

  try {
    const result = await pool.query(
      'select id, name, email, role, avatar, rating, services_count, created_at, password_hash from users where email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'invalid credentials' })
    }

    const userRow = result.rows[0]
    let ok = await bcrypt.compare(password, userRow.password_hash)
    if (!ok && userRow.password_hash === password) {
      ok = true
      const newHash = await bcrypt.hash(password, SALT_ROUNDS)
      await pool.query('update users set password_hash = $1 where id = $2', [
        newHash,
        userRow.id,
      ])
    }
    if (!ok) {
      return res.status(401).json({ message: 'invalid credentials' })
    }

    const user = mapUserRow(userRow)
    const access_token = signJwt({ sub: String(user.id), role: user.role })
    return res.json({ access_token, user })
  } catch (err) {
    console.error('Login failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.get('/api/auth/me', authenticateJwt, async (req, res) => {
  try {
    const result = await pool.query(
      'select id, name, email, role, avatar, rating, services_count, created_at from users where id = $1',
      [req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'user not found' })
    }
    return res.json(mapUserRow(result.rows[0]))
  } catch (err) {
    console.error('Me failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.get('/api/users', authenticateJwt, requireRole(['admin']), async (_req, res) => {
  try {
    const result = await pool.query(
      'select id, name, email, role, avatar, rating, services_count, created_at from users order by created_at desc'
    )
    return res.json(result.rows.map(mapUserRow))
  } catch (err) {
    console.error('Users fetch failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.post('/api/users', authenticateJwt, requireRole(['admin']), async (req, res) => {
  const { name, email, password, role, avatar } = req.body || {}
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'name, email, password, role are required' })
  }
  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const result = await pool.query(
      `insert into users (name, email, password_hash, role, avatar)
       values ($1, $2, $3, $4, $5)
       returning id, name, email, role, avatar, rating, services_count, created_at`,
      [name, email, passwordHash, role, avatar || null]
    )
    return res.status(201).json(mapUserRow(result.rows[0]))
  } catch (err) {
    console.error('User create failed:', err.message)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'email already exists' })
    }
    return res.status(500).json({ message: 'server error' })
  }
})

app.patch('/api/users/:id', authenticateJwt, async (req, res) => {
  const userId = Number(req.params.id)
  const isAdmin = req.user.role === 'admin'
  if (!isAdmin && req.user.id !== userId) {
    return res.status(403).json({ message: 'forbidden' })
  }

  const { name, email, role, avatar, rating, servicesCount } = req.body || {}
  if (role && !isAdmin) {
    return res.status(403).json({ message: 'forbidden' })
  }

  try {
    const result = await pool.query(
      `update users set
        name = coalesce($1, name),
        email = coalesce($2, email),
        role = coalesce($3, role),
        avatar = coalesce($4, avatar),
        rating = coalesce($5, rating),
        services_count = coalesce($6, services_count)
      where id = $7
      returning id, name, email, role, avatar, rating, services_count, created_at`,
      [name, email, isAdmin ? role : null, avatar, rating, servicesCount, userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'user not found' })
    }
    return res.json(mapUserRow(result.rows[0]))
  } catch (err) {
    console.error('User update failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.post(
  '/api/users/:id/avatar',
  authenticateJwt,
  upload.single('avatar'),
  async (req, res) => {
    const userId = Number(req.params.id)
    const isAdmin = req.user.role === 'admin'
    if (!isAdmin && req.user.id !== userId) {
      return res.status(403).json({ message: 'forbidden' })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'avatar file is required' })
    }
    const avatarPath = `/uploads/${req.file.filename}`
    try {
      const result = await pool.query(
        `update users set avatar = $1 where id = $2
         returning id, name, email, role, avatar, rating, services_count, created_at`,
        [avatarPath, userId]
      )
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'user not found' })
      }
      return res.json(mapUserRow(result.rows[0]))
    } catch (err) {
      console.error('Avatar update failed:', err.message)
      return res.status(500).json({ message: 'server error' })
    }
  }
)

app.delete('/api/users/:id', authenticateJwt, requireRole(['admin']), async (req, res) => {
  const userId = Number(req.params.id)
  if (req.user.id === userId) {
    return res.status(400).json({ message: 'cannot delete own account' })
  }
  try {
    const result = await pool.query('delete from users where id = $1 returning id', [userId])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'user not found' })
    }
    return res.json({ ok: true })
  } catch (err) {
    console.error('User delete failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.get('/api/services', async (_req, res) => {
  try {
    const result = await pool.query('select * from services order by id desc')
    return res.json(result.rows.map(mapServiceRow))
  } catch (err) {
    console.error('Services fetch failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.post('/api/services', authenticateJwt, requireRole(['admin']), async (req, res) => {
  const { name, description, price, duration, imageUrl } = req.body || {}
  if (!name || !description || !price || !duration || !imageUrl) {
    return res.status(400).json({ message: 'missing fields' })
  }
  try {
    const result = await pool.query(
      `insert into services (name, description, price, duration, image_url)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [name, description, price, duration, imageUrl]
    )
    return res.status(201).json(mapServiceRow(result.rows[0]))
  } catch (err) {
    console.error('Service create failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.patch('/api/services/:id', authenticateJwt, requireRole(['admin']), async (req, res) => {
  const serviceId = Number(req.params.id)
  const { name, description, price, duration, imageUrl } = req.body || {}
  try {
    const result = await pool.query(
      `update services set
        name = coalesce($1, name),
        description = coalesce($2, description),
        price = coalesce($3, price),
        duration = coalesce($4, duration),
        image_url = coalesce($5, image_url)
      where id = $6
      returning *`,
      [name, description, price, duration, imageUrl, serviceId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'service not found' })
    }
    return res.json(mapServiceRow(result.rows[0]))
  } catch (err) {
    console.error('Service update failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.delete('/api/services/:id', authenticateJwt, requireRole(['admin']), async (req, res) => {
  const serviceId = Number(req.params.id)
  try {
    const result = await pool.query('delete from services where id = $1 returning id', [serviceId])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'service not found' })
    }
    return res.json({ ok: true })
  } catch (err) {
    console.error('Service delete failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.get('/api/services/:id/reviews', async (req, res) => {
  const serviceId = Number(req.params.id)
  try {
    const result = await pool.query(
      `select r.*, u.name as user_name, u.avatar as user_avatar
       from reviews r join users u on u.id = r.user_id
       where r.service_id = $1
       order by r.created_at desc`,
      [serviceId]
    )
    const reviews = result.rows.map((row) => ({
      id: String(row.id),
      serviceId: String(row.service_id),
      userId: String(row.user_id),
      userName: row.user_name,
      userAvatar: row.user_avatar,
      rating: row.rating,
      comment: row.comment,
      likes: row.likes,
      dislikes: row.dislikes,
      date: row.created_at,
      deleted: row.deleted,
    }))
    return res.json(reviews)
  } catch (err) {
    console.error('Reviews fetch failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.get('/api/reviews', async (_req, res) => {
  try {
    const result = await pool.query(
      `select r.*, u.name as user_name, u.avatar as user_avatar
       from reviews r join users u on u.id = r.user_id
       order by r.created_at desc`
    )
    const reviews = result.rows.map((row) => ({
      id: String(row.id),
      serviceId: String(row.service_id),
      userId: String(row.user_id),
      userName: row.user_name,
      userAvatar: row.user_avatar,
      rating: row.rating,
      comment: row.comment,
      likes: row.likes,
      dislikes: row.dislikes,
      date: row.created_at,
      deleted: row.deleted,
    }))
    return res.json(reviews)
  } catch (err) {
    console.error('Reviews list failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.post('/api/reviews', authenticateJwt, requireRole(['user']), async (req, res) => {
  const { serviceId, rating, comment } = req.body || {}
  if (!serviceId || !rating || !comment) {
    return res.status(400).json({ message: 'missing fields' })
  }

  try {
    const orderResult = await pool.query(
      `select id from orders
       where user_id = $1 and service_id = $2 and status = 'completed' and has_review = false
       order by created_at asc
       limit 1`,
      [req.user.id, serviceId]
    )

    if (orderResult.rows.length === 0) {
      return res.status(400).json({ message: 'no completed order without review' })
    }

    const reviewResult = await pool.query(
      `insert into reviews (service_id, user_id, rating, comment)
       values ($1, $2, $3, $4)
       returning *`,
      [serviceId, req.user.id, rating, comment]
    )

    await pool.query('update orders set has_review = true where id = $1', [orderResult.rows[0].id])
    await pool.query(
      `insert into client_history (user_id, service_id, date, rating)
       values ($1, $2, current_date, $3)`,
      [req.user.id, serviceId, rating]
    )
    await recalcServiceRating(serviceId)

    const masterResult = await pool.query(
      `select master_id from orders
       where user_id = $1 and service_id = $2 and status = 'completed'
       order by created_at desc
       limit 1`,
      [req.user.id, serviceId]
    )
    if (masterResult.rows[0]?.master_id) {
      await recalcMasterStats(masterResult.rows[0].master_id)
    }

    const reviewRow = reviewResult.rows[0]
    return res.status(201).json({
      id: String(reviewRow.id),
      serviceId: String(reviewRow.service_id),
      userId: String(reviewRow.user_id),
      rating: reviewRow.rating,
      comment: reviewRow.comment,
      likes: reviewRow.likes,
      dislikes: reviewRow.dislikes,
      date: reviewRow.created_at,
      deleted: reviewRow.deleted,
    })
  } catch (err) {
    console.error('Review create failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.patch('/api/reviews/:id/like', authenticateJwt, async (req, res) => {
  const reviewId = Number(req.params.id)
  try {
    const result = await pool.query(
      'update reviews set likes = likes + 1 where id = $1 returning likes',
      [reviewId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'review not found' })
    }
    return res.json({ likes: result.rows[0].likes })
  } catch (err) {
    console.error('Review like failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.patch('/api/reviews/:id/dislike', authenticateJwt, async (req, res) => {
  const reviewId = Number(req.params.id)
  try {
    const result = await pool.query(
      'update reviews set dislikes = dislikes + 1 where id = $1 returning dislikes',
      [reviewId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'review not found' })
    }
    return res.json({ dislikes: result.rows[0].dislikes })
  } catch (err) {
    console.error('Review dislike failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.delete('/api/reviews/:id', authenticateJwt, requireRole(['admin']), async (req, res) => {
  const reviewId = Number(req.params.id)
  try {
    const result = await pool.query(
      `update reviews set deleted = true, comment = 'Отзыв удалён администратором'
       where id = $1 returning service_id`,
      [reviewId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'review not found' })
    }
    await recalcServiceRating(result.rows[0].service_id)
    return res.json({ ok: true })
  } catch (err) {
    console.error('Review delete failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.get('/api/services/:id/history', async (req, res) => {
  const serviceId = Number(req.params.id)
  try {
    const result = await pool.query(
      `select h.id, h.user_id, h.service_id, h.date, h.rating, u.name, u.avatar
       from client_history h join users u on u.id = h.user_id
       where h.service_id = $1
       order by h.date desc`,
      [serviceId]
    )
    const history = result.rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      userName: row.name,
      userAvatar: row.avatar,
      serviceId: String(row.service_id),
      date: row.date,
      rating: row.rating,
    }))
    return res.json(history)
  } catch (err) {
    console.error('History fetch failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.get('/api/orders', authenticateJwt, async (req, res) => {
  try {
    let result
    if (req.user.role === 'user') {
      result = await pool.query(
        `select o.*, s.name as service_name,
                u.name as user_name, u.avatar as user_avatar,
                m.name as master_name, m.avatar as master_avatar
         from orders o
         join services s on s.id = o.service_id
         join users u on u.id = o.user_id
         left join users m on m.id = o.master_id
         where o.user_id = $1
         order by o.date desc`,
        [req.user.id]
      )
    } else {
      result = await pool.query(
        `select o.*, s.name as service_name,
                u.name as user_name, u.avatar as user_avatar,
                m.name as master_name, m.avatar as master_avatar
         from orders o
         join services s on s.id = o.service_id
         join users u on u.id = o.user_id
         left join users m on m.id = o.master_id
         order by o.date desc`
      )
    }

    const orders = result.rows.map((row) => ({
      id: String(row.id),
      serviceId: String(row.service_id),
      serviceName: row.service_name,
      userId: String(row.user_id),
      userName: row.user_name,
      userAvatar: row.user_avatar,
      masterId: row.master_id ? String(row.master_id) : undefined,
      masterName: row.master_name || undefined,
      masterAvatar: row.master_avatar || undefined,
      status: row.status,
      date: row.date,
      timeSlot: row.time_slot,
      price: row.price,
      hasReview: row.has_review,
    }))
    return res.json(orders)
  } catch (err) {
    console.error('Orders fetch failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.post('/api/orders', authenticateJwt, requireRole(['user']), async (req, res) => {
  const { serviceId, date, timeSlot } = req.body || {}
  if (!serviceId || !date || !timeSlot) {
    return res.status(400).json({ message: 'missing fields' })
  }
  try {
    const serviceResult = await pool.query('select price from services where id = $1', [serviceId])
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ message: 'service not found' })
    }

    const price = serviceResult.rows[0].price
    const result = await pool.query(
      `insert into orders (service_id, user_id, status, date, time_slot, price)
       values ($1, $2, 'pending', $3, $4, $5)
       returning *`,
      [serviceId, req.user.id, date, timeSlot, price]
    )
    return res.status(201).json({ id: String(result.rows[0].id) })
  } catch (err) {
    console.error('Order create failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.patch('/api/orders/:id', authenticateJwt, requireRole(['user']), async (req, res) => {
  const orderId = Number(req.params.id)
  const { status } = req.body || {}
  if (status !== 'cancelled') {
    return res.status(400).json({ message: 'invalid status' })
  }
  try {
    const result = await pool.query(
      `update orders set status = 'cancelled'
       where id = $1 and user_id = $2 and status = 'pending'
       returning id`,
      [orderId, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'order not found' })
    }
    if (status === 'completed') {
      const masterIdToUpdate = masterId || (await pool.query('select master_id from orders where id = $1', [orderId])).rows[0]?.master_id
      await recalcMasterStats(masterIdToUpdate)
    }
    return res.json({ ok: true })
  } catch (err) {
    console.error('Order cancel failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.patch('/api/orders/:id/status', authenticateJwt, requireRole(['master', 'admin']), async (req, res) => {
  const orderId = Number(req.params.id)
  const { status } = req.body || {}
  if (!['approved', 'rejected', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'invalid status' })
  }
  try {
    const masterId = req.user.role === 'master' ? req.user.id : null
    const result = await pool.query(
      `update orders set status = $1,
        master_id = case when $1 = 'approved' or $1 = 'completed' then coalesce($2, master_id) else master_id end
       where id = $3
       returning id`,
      [status, masterId, orderId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'order not found' })
    }
    return res.json({ ok: true })
  } catch (err) {
    console.error('Order status update failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.get('/api/favorites', authenticateJwt, requireRole(['user']), async (req, res) => {
  try {
    const result = await pool.query(
      'select service_id from favorites where user_id = $1',
      [req.user.id]
    )
    return res.json(result.rows.map((row) => String(row.service_id)))
  } catch (err) {
    console.error('Favorites fetch failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.post('/api/favorites/:serviceId', authenticateJwt, requireRole(['user']), async (req, res) => {
  const serviceId = Number(req.params.serviceId)
  try {
    await pool.query(
      'insert into favorites (user_id, service_id) values ($1, $2) on conflict do nothing',
      [req.user.id, serviceId]
    )
    return res.json({ ok: true })
  } catch (err) {
    console.error('Favorite add failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.delete('/api/favorites/:serviceId', authenticateJwt, requireRole(['user']), async (req, res) => {
  const serviceId = Number(req.params.serviceId)
  try {
    await pool.query('delete from favorites where user_id = $1 and service_id = $2', [
      req.user.id,
      serviceId,
    ])
    return res.json({ ok: true })
  } catch (err) {
    console.error('Favorite delete failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.get('/api/schedule', async (req, res) => {
  const { date, serviceId } = req.query
  if (!date || !serviceId) {
    return res.status(400).json({ message: 'date and serviceId are required' })
  }
  try {
    const serviceResult = await pool.query('select duration from services where id = $1', [serviceId])
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ message: 'service not found' })
    }

    const duration = serviceResult.rows[0].duration
    const mastersResult = await pool.query("select id from users where role = 'master'")
    const masters = mastersResult.rows.map((row) => row.id)

    const ordersResult = await pool.query(
      `select o.*, s.duration as service_duration
       from orders o
       join services s on s.id = o.service_id
       where o.date = $1 and o.status not in ('rejected', 'cancelled')`,
      [date]
    )

    const workStart = 9
    const workEnd = 21
    const slots = []

    const masterSchedule = {}
    const masterBusyAtTime = {}

    ordersResult.rows.forEach((order) => {
      if (order.master_id) {
        masterSchedule[order.master_id] =
          (masterSchedule[order.master_id] || 0) + order.service_duration
        masterBusyAtTime[order.master_id] = masterBusyAtTime[order.master_id] || new Set()
        masterBusyAtTime[order.master_id].add(order.time_slot)
      }
    })

    for (let hour = workStart; hour < workEnd; hour++) {
      const time = `${String(hour).padStart(2, '0')}:00`
      const isOccupied = ordersResult.rows.some((order) => order.time_slot === time)

      const hasAvailableMaster = masters.some((masterId) => {
        const busyMinutes = masterSchedule[masterId] || 0
        const busyTimes = masterBusyAtTime[masterId] || new Set()
        return busyMinutes + duration <= 600 && !busyTimes.has(time)
      })

      slots.push({ time, available: !isOccupied && hasAvailableMaster })
    }

    return res.json(slots)
  } catch (err) {
    console.error('Schedule fetch failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
