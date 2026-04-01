import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import dotenv from 'dotenv'
import pool from './db.js'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

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
    req.user = { id: payload.sub, role: payload.role }
    return next()
  } catch (err) {
    return res.status(401).json({ message: 'invalid token' })
  }
}

app.use(cors())
app.use(express.json())

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
      '/api/auth/register': {
        post: {
          summary: 'Register user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password_hash'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password_hash: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Created' },
            400: { description: 'Validation error' },
            409: { description: 'Email exists' },
            500: { description: 'Server error' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'OK' },
            400: { description: 'Validation error' },
            401: { description: 'Invalid credentials' },
            500: { description: 'Server error' },
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
  const { email, password_hash } = req.body || {}

  if (!email || !password_hash) {
    return res.status(400).json({ message: 'email and password_hash are required' })
  }

  try {
    const result = await pool.query(
      'insert into users (email, password_hash) values ($1, $2) returning id, email, created_at',
      [email, password_hash]
    )

    return res.status(201).json(result.rows[0])
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
      'select id, email, role, created_at, password_hash from users where email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'invalid credentials' })
    }

    const user = result.rows[0]
    if (user.password_hash !== password) {
      return res.status(401).json({ message: 'invalid credentials' })
    }

    const access_token = signJwt({ sub: String(user.id), role: user.role })
    return res.json({
      access_token,
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    })
  } catch (err) {
    console.error('Login failed:', err.message)
    return res.status(500).json({ message: 'server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
