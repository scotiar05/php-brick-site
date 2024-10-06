const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB (replace with your actual connection string)
mongoose.connect('mongodb://localhost/brick-site', { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// User model (simple version)
const User = mongoose.model('User', {
  username: String,
  password: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.redirect('/login');
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.redirect('/profile');
  } else {
    res.redirect('/login');
  }
});

// Profile
app.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  const user = await User.findById(req.session.userId).populate('friends');
  res.render('profile', { user });
});

// Add friend (simplified)
app.post('/add-friend', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  const { friendUsername } = req.body;
  const user = await User.findById(req.session.userId);
  const friend = await User.findOne({ username: friendUsername });
  if (friend) {
    user.friends.push(friend._id);
    await user.save();
  }
  res.redirect('/profile');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
