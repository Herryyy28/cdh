const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pixelmind-super-secret-key-12345';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets from the current directory
app.use(express.static(path.join(__dirname)));

// Mock User Database (Normally you'd use a real database with password hashing)
const USERS = [
  { username: 'admin', password: 'password123' }
];

// Authentication Endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = USERS.find(u => u.username === username.toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Issue a JWT token valid for 24h
  const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  return res.json({ token, username: user.username });
});

// Middleware to verify JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  });
}

// Secure Proxy Endpoint for Free Pollinations.ai Image Generation
app.post('/api/generate', authenticateToken, async (req, res) => {
  const { prompt, size } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    // Parse dimensions (defaulting to 1024x1024)
    const dimensions = size ? size.split('x') : ['1024', '1024'];
    const width = parseInt(dimensions[0]) || 1024;
    const height = parseInt(dimensions[1]) || 1024;
    
    // Generate a random seed so successive identical prompt requests return new images
    const seed = Math.floor(Math.random() * 9999999);
    
    // Construct Pollinations.ai URL (nologo removes watermark)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    return res.json({
      data: [{ url: imageUrl }]
    });
  } catch (error) {
    console.error('Generation Error:', error);
    return res.status(500).json({ error: 'Server error occurred while preparing the image.' });
  }
});

// Catch-all route to serve index.html for single page app experience
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PixelMind AI server is running on http://localhost:${PORT}`);
});
