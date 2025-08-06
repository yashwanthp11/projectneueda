const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register new user
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ 
                message: 'All fields are required' 
            });
        }

        if (password.length < 8) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters long' 
            });
        }

        // Check if user already exists
        const checkUserSql = 'SELECT id FROM users WHERE email = ?';
        const [existingUsers] = await db.execute(checkUserSql, [email]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                message: 'User with this email already exists' 
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const insertUserSql = `
            INSERT INTO users (first_name, last_name, email, password, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        const [result] = await db.execute(insertUserSql, [
            firstName, 
            lastName, 
            email, 
            hashedPassword
        ]);

        const userId = result.insertId;

        // Initialize user's portfolio
        const initPortfolioSql = `
            INSERT INTO portfolios (user_id, cash_balance, created_at) 
            VALUES (?, 10000.00, NOW())
        `;
        await db.execute(initPortfolioSql, [userId]);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: userId,
                firstName,
                lastName,
                email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Server error during registration' 
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required' 
            });
        }

        // Find user
        const getUserSql = `
            SELECT id, first_name, last_name, email, password 
            FROM users 
            WHERE email = ?
        `;
        const [users] = await db.execute(getUserSql, [email]);

        if (users.length === 0) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        const user = users[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Update last login
        const updateLoginSql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
        await db.execute(updateLoginSql, [user.id]);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login' 
        });
    }
};

// Validate token
const validateToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if user still exists
        const getUserSql = 'SELECT id, first_name, last_name, email FROM users WHERE id = ?';
        const [users] = await db.execute(getUserSql, [decoded.userId]);

        if (users.length === 0) {
            return res.status(401).json({ 
                message: 'User not found' 
            });
        }

        const user = users[0];

        res.json({
            valid: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            }
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired' 
            });
        }
        
        console.error('Token validation error:', error);
        res.status(500).json({ 
            message: 'Server error during token validation' 
        });
    }
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const getUserSql = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.created_at, u.last_login,
                   p.cash_balance
            FROM users u
            LEFT JOIN portfolios p ON u.id = p.user_id
            WHERE u.id = ?
        `;
        
        const [users] = await db.execute(getUserSql, [userId]);

        if (users.length === 0) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        const user = users[0];

        res.json({
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                cashBalance: user.cash_balance || 0,
                memberSince: user.created_at,
                lastLogin: user.last_login
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            message: 'Server error getting profile' 
        });
    }
};

// Demo login (for testing purposes)
const demoLogin = async (req, res) => {
    try {
        // Check if demo user exists
        const getDemoUserSql = 'SELECT id, first_name, last_name, email FROM users WHERE email = ?';
        const [demoUsers] = await db.execute(getDemoUserSql, ['demo@stocktrader.com']);

        let demoUser;

        if (demoUsers.length === 0) {
            // Create demo user
            const hashedPassword = await bcrypt.hash('Demo123!', 12);
            const createDemoUserSql = `
                INSERT INTO users (first_name, last_name, email, password, created_at) 
                VALUES ('Demo', 'User', 'demo@stocktrader.com', ?, NOW())
            `;
            
            const [result] = await db.execute(createDemoUserSql, [hashedPassword]);
            const userId = result.insertId;

            // Initialize demo portfolio with some sample data
            const initPortfolioSql = `
                INSERT INTO portfolios (user_id, cash_balance, created_at) 
                VALUES (?, 25000.00, NOW())
            `;
            await db.execute(initPortfolioSql, [userId]);

            demoUser = {
                id: userId,
                first_name: 'Demo',
                last_name: 'User',
                email: 'demo@stocktrader.com'
            };
        } else {
            demoUser = demoUsers[0];
        }

        // Generate token for demo user
        const token = jwt.sign(
            { userId: demoUser.id, email: demoUser.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Demo login successful',
            token,
            user: {
                id: demoUser.id,
                firstName: demoUser.first_name,
                lastName: demoUser.last_name,
                email: demoUser.email
            }
        });

    } catch (error) {
        console.error('Demo login error:', error);
        res.status(500).json({ 
            message: 'Server error during demo login' 
        });
    }
};

module.exports = {
    register,
    login,
    validateToken,
    getProfile,
    demoLogin
};
