import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

const app = express()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'brandeazy_super_secret_key_123'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

// Allow multiple origins: localhost for dev, Vercel URL for prod
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// ── PASSPORT GOOGLE STRATEGY ───────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${BACKEND_URL}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0].value || ''
      const name = profile.displayName || ''
      const googleId = profile.id
      const picture = profile.photos?.[0].value || ''

      let user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        user = await prisma.user.create({ data: { email, name, googleId, picture, cardType: 'Standard' } })
      } else {
        user = await prisma.user.update({ where: { email }, data: { googleId, picture, name } })
      }
      return done(null, user)
    } catch (err: any) {
      return done(err)
    }
  }))
}

// ── AUTH MIDDLEWARE ────────────────────────────────────────────────────────
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) return res.status(401).json({ error: 'User not found' });
    (req as any).user = user
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user
  if (!user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden: Admins only' })
  }
  next()
}

// ── AUTH ROUTES ────────────────────────────────────────────────────────────
app.get('/api/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
    return res.status(500).send('Google Auth not configured. Add GOOGLE_CLIENT_ID to server/.env')
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next)
})

app.get('/api/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const user: any = req.user
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })
  res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })
  // Admin goes to /admin, regular users go to /dashboard
  if (user.email === ADMIN_EMAIL) {
    res.redirect(`${FRONTEND_URL}/admin`)
  } else {
    res.redirect(`${FRONTEND_URL}/dashboard`)
  }
})

app.get('/api/auth/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ success: true })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user: any = (req as any).user
  res.json({ ...user, isAdmin: user.email === ADMIN_EMAIL })
})

// ── USER ROUTES (admin only) ───────────────────────────────────────────────
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { orders: true }
    })
    res.json(users)
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// ── ORDER ROUTES ───────────────────────────────────────────────────────────

// GET all orders (admin only)
app.get('/api/orders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
    res.json(orders)
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// GET current user's orders
app.get('/api/orders/my', requireAuth, async (req, res) => {
  try {
    const user: any = (req as any).user
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json(orders)
  } catch {
    res.status(500).json({ error: 'Failed to fetch your orders' })
  }
})

// GET single order by ID
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string
    const user: any = (req as any).user
    const order = await prisma.order.findUnique({ where: { id }, include: { user: true } })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    // Only owner or admin can fetch
    if (order.userId !== user.id && user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    res.json(order)
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// POST create order (requires auth)
app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const user: any = (req as any).user
    const { customerName, customerEmail, customerPhone, productType, totalPrice, shippingAddress } = req.body
    const orderNumber = '#BE-' + Math.floor(10000 + Math.random() * 90000)

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        customerName,
        customerEmail,
        customerPhone,
        productType,
        totalPrice,
        shippingAddress,
        status: 'Order Placed'
      }
    })
    res.status(201).json(order)
  } catch {
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// PATCH update order status (admin only)
app.patch('/api/orders/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string
    const { status } = req.body
    const updatedOrder = await prisma.order.update({ where: { id }, data: { status } })
    res.json(updatedOrder)
  } catch {
    res.status(500).json({ error: 'Failed to update order status' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`   Admin email: ${ADMIN_EMAIL || '(not set — update ADMIN_EMAIL in .env)'}`)
})
