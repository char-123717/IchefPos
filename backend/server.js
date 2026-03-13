require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const connectDB = require('./config/database');
const Menu = require('./models/Menu');
const Order = require('./models/Order');

// Multer — store in memory for Base64 conversion
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ========================
// REST API ROUTES
// ========================

// --- Menu ---
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await Menu.find({ available: true }).sort('category name');
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/menu/:category', async (req, res) => {
  try {
    const menu = await Menu.find({
      category: req.params.category,
      available: true
    }).sort('name');
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create menu item (owner — with optional image upload)
app.post('/api/menu', upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, description, image } = req.body;

    const menuData = {
      name,
      category,
      price: parseFloat(price),
      description: description || '',
      image: image || '🍽️'
    };

    // If image file uploaded, convert to Base64
    if (req.file) {
      menuData.imageData = req.file.buffer.toString('base64');
      menuData.imageType = req.file.mimetype;
    }

    // If imageData sent directly as Base64 string (from app)
    if (req.body.imageData) {
      menuData.imageData = req.body.imageData;
      menuData.imageType = req.body.imageType || 'image/jpeg';
    }

    const menuItem = new Menu(menuData);
    await menuItem.save();

    res.status(201).json(menuItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update menu item (owner)
app.put('/api/menu/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, description, image, available } = req.body;
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (name) menuItem.name = name;
    if (category) menuItem.category = category;
    if (price !== undefined) menuItem.price = parseFloat(price);
    if (description !== undefined) menuItem.description = description;
    if (image) menuItem.image = image;
    if (available !== undefined) menuItem.available = available === 'true' || available === true;

    // Image upload
    if (req.file) {
      menuItem.imageData = req.file.buffer.toString('base64');
      menuItem.imageType = req.file.mimetype;
    } else if (req.body.removeImage === 'true') {
      menuItem.imageData = '';
      menuItem.imageType = '';
    } else if (req.body.imageData) {
      menuItem.imageData = req.body.imageData;
      menuItem.imageType = req.body.imageType || 'image/jpeg';
    }

    await menuItem.save();
    res.json(menuItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete menu item (owner)
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const menuItem = await Menu.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve menu image
app.get('/api/menu/:id/image', async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem || !menuItem.imageData) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const imgBuffer = Buffer.from(menuItem.imageData, 'base64');
    res.set('Content-Type', menuItem.imageType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(imgBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all menu items (including unavailable — for owner)
app.get('/api/menu/all', async (req, res) => {
  try {
    const menu = await Menu.find().sort('category name');
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Orders ---

// Create new order (from customer, status = paid)
app.post('/api/orders', async (req, res) => {
  try {
    const { tableNumber, items, totalPrice, paymentMethod } = req.body;

    const order = new Order({
      tableNumber,
      items: items.map(item => ({
        ...item,
        itemStatus: 'pending'
      })),
      totalPrice,
      paymentMethod,
      status: 'paid'
    });

    await order.save();

    // Broadcast new order to kasir
    io.emit('new-order', order);

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active orders (not done)
app.get('/api/orders/active', async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['paid', 'confirmed'] }
    }).sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm order (kasir: paid → confirmed, all items become cooking)
app.patch('/api/orders/:id/confirm', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({
        error: `Cannot confirm order with status '${order.status}'`
      });
    }

    // Set all items to cooking
    order.items.forEach(item => {
      item.itemStatus = 'cooking';
    });
    order.status = 'confirmed';
    order.confirmedAt = new Date();
    await order.save();

    // Broadcast to all (kasir + kitchen)
    io.emit('order-updated', order);

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update individual item status (kitchen: cooking → ready)
app.patch('/api/orders/:id/items/:itemId', async (req, res) => {
  try {
    const { itemStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({
        error: `Cannot update items on order with status '${order.status}'`
      });
    }

    // Find the item
    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Valid transition: cooking → ready OR ready → served
    if (
      (item.itemStatus === 'cooking' && itemStatus === 'ready') ||
      (item.itemStatus === 'ready' && itemStatus === 'served')
    ) {
      item.itemStatus = itemStatus;
    } else {
      return res.status(400).json({
        error: `Cannot transition item from '${item.itemStatus}' to '${itemStatus}'`
      });
    }

    await order.save();

    // Broadcast update
    io.emit('order-updated', order);

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark order as done (kasir: confirmed → done, only when all items ready)
app.patch('/api/orders/:id/done', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({
        error: `Cannot mark order as done with status '${order.status}'`
      });
    }

    const allReadyOrServed = order.items.every(i => i.itemStatus === 'ready' || i.itemStatus === 'served');
    if (!allReadyOrServed) {
      return res.status(400).json({
        error: 'Cannot mark as done: not all items are ready or served'
      });
    }

    order.status = 'done';
    await order.save();

    io.emit('order-updated', order);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Legacy: Update order status (kept for backward compatibility)
app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    await order.save();

    io.emit('order-updated', order);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Stats ---
app.get('/api/stats/today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: startOfDay }
    });

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
      activeOrders: orders.filter(o => o.status !== 'done').length,
      byStatus: {
        paid: orders.filter(o => o.status === 'paid').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        done: orders.filter(o => o.status === 'done').length
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detailed income report (for owner)
app.get('/api/stats/income', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: startOfDay }
    });

    // Items breakdown
    const itemMap = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const key = item.name;
        if (!itemMap[key]) {
          itemMap[key] = { name: item.name, price: item.price, qty: 0, total: 0 };
        }
        itemMap[key].qty += item.quantity;
        itemMap[key].total += item.price * item.quantity;
      });
    });

    // Payment method breakdown
    const qrisOrders = orders.filter(o => o.paymentMethod === 'QRIS');
    const cashOrders = orders.filter(o => o.paymentMethod === 'Cash');

    const income = {
      date: startOfDay.toISOString(),
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
      items: Object.values(itemMap).sort((a, b) => b.total - a.total),
      payment: {
        qris: {
          count: qrisOrders.length,
          total: qrisOrders.reduce((sum, o) => sum + o.totalPrice, 0)
        },
        cash: {
          count: cashOrders.length,
          total: cashOrders.reduce((sum, o) => sum + o.totalPrice, 0)
        }
      },
      orders: orders.map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        tableNumber: o.tableNumber,
        items: o.items,
        totalPrice: o.totalPrice,
        paymentMethod: o.paymentMethod,
        status: o.status,
        createdAt: o.createdAt
      }))
    };

    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// SOCKET.IO
// ========================
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`\n🚀 iChef POS Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`📦 API: http://localhost:3000/api`);
  });
}

start();
