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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost')) {
      return callback(null, true)
    }
    callback(null, false)
  },
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// ── PASSPORT GOOGLE STRATEGY ──────────────────────────────────────────────
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

// ── AUTH MIDDLEWARE ───────────────────────────────────────────────────────
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

async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token
  if (!token) return next()
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (user) (req as any).user = user
    next()
  } catch {
    next()
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user
  if (!user || user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden: Admins only' })
  }
  next()
}

// ── FIREBASE AUTH ROUTE ───────────────────────────────────────────────────
app.post('/api/auth/firebase', async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' })

    // Decode the Firebase JWT to get user info (no admin SDK needed for basic decode)
    const parts = idToken.split('.')
    if (parts.length !== 3) return res.status(400).json({ error: 'Invalid token' })
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())

    const email: string = payload.email || ''
    const name: string = payload.name || ''
    const picture: string = payload.picture || ''
    const firebaseUid: string = payload.user_id || payload.sub || ''

    if (!email) return res.status(400).json({ error: 'No email in token' })

    // Upsert user in DB
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, picture, googleId: firebaseUid, cardType: 'Standard' }
      })
    } else {
      user = await prisma.user.update({
        where: { email },
        data: { name, picture, googleId: firebaseUid }
      })
    }

    // Issue our own JWT cookie so existing routes work unchanged
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({ ...user, firebaseUid, isAdmin: user.email === ADMIN_EMAIL })
  } catch (err) {
    console.error('Firebase auth error:', err)
    res.status(500).json({ error: 'Auth failed' })
  }
})

// ── LEGACY GOOGLE OAUTH (kept for reference) ──────────────────────────────
app.get('/api/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
    return res.status(500).send('Google Auth not configured. Add GOOGLE_CLIENT_ID to server/.env')
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next)
})

app.get('/api/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const user: any = req.user
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
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

// ── PRODUCT ROUTES ────────────────────────────────────────────────────────

// GET all products (public)
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } })
    res.json(products)
  } catch {
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// POST create product (admin only)
app.post('/api/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, image, badge, inStock } = req.body
    const product = await prisma.product.create({
      data: { name, description, price: parseFloat(price), image, badge, inStock: inStock ?? true }
    })
    res.status(201).json(product)
  } catch {
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// PATCH update product (admin only)
app.patch('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, image, badge, inStock } = req.body
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(image !== undefined && { image }),
        ...(badge !== undefined && { badge }),
        ...(inStock !== undefined && { inStock })
      }
    })
    res.json(product)
  } catch {
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// DELETE product (admin only)
app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

// ── USER ROUTES (admin only) ──────────────────────────────────────────────
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

// ── ORDER ROUTES ──────────────────────────────────────────────────────────

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

// GET admin stats
app.get('/api/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [totalOrders, users, orders] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.findMany({ select: { totalPrice: true, status: true, createdAt: true } })
    ])

    const totalRevenue = orders.reduce((sum, o) => {
      const num = parseFloat(o.totalPrice.replace(/[^0-9.]/g, ''))
      return sum + (isNaN(num) ? 0 : num)
    }, 0)

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Orders in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentOrders = orders.filter(o => new Date(o.createdAt) > thirtyDaysAgo).length

    res.json({ totalOrders, totalUsers: users, totalRevenue, statusCounts, recentOrders })
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' })
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
    const user: any = (req as any).user
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { user: true } })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.userId !== user.id && user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    res.json(order)
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// POST create order (optional auth)
app.post('/api/orders', optionalAuth, async (req, res) => {
  try {
    const user: any = (req as any).user
    const { customerName, customerEmail, customerPhone, productType, totalPrice, shippingAddress, cartItems } = req.body
    const orderNumber = '#BE-' + Math.floor(10000 + Math.random() * 90000)

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user?.id || null,
        customerName,
        customerEmail,
        customerPhone,
        productType,
        totalPrice,
        shippingAddress,
        status: 'Order Placed',
        cartItems: cartItems ? JSON.stringify(cartItems) : null
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
    const { status } = req.body
    const updatedOrder = await prisma.order.update({ where: { id: req.params.id }, data: { status } })
    res.json(updatedOrder)
  } catch {
    res.status(500).json({ error: 'Failed to update order status' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`   Admin email: ${ADMIN_EMAIL || '(not set)'}`)
})
