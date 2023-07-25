const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../database/userdata');

const secretKey = process.env.SECRET_KEY; 

class userController {

// Function to register a new user
static register = (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    // Checking if the username already exists
    const checkQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkQuery, [username], (err, [rows, fields]) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (rows && rows.length > 0) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      // Hashed the password before storing it in the database
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Failed to hash password' });
        }

        // Insert the new user into the database
        const insertQuery = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        db.query(insertQuery, [username, hashedPassword, role], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to register user' });
          }

          
            res.json({ message: 'User registered successfully'});

        });
      });
    });
  }


   // Function to login and generate JWT token
    static login = (req, res) => {
        const { username, password } = req.body;
    
        // Fetch the user from the database
        const selectQuery = 'SELECT * FROM users WHERE username = ?';
        db.query(selectQuery, [username], (err, rows) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
          }
    
          if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
          }
    
          const user = rows[0];
    
          // Comparing password with hashed password in database
          bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Failed to compare passwords' });
            }
    
            if (!result) {
              return res.status(401).json({ message: 'Invalid credentials' });
            }
    
            // Generating a JWT token for the authenticated user
            const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: '1h' });
    
            res.json({ token });
          });
        });
      }
}

module.exports = userController;
