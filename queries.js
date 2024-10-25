  const Pool = require('pg').Pool
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'API',
    password: '12345678',
    port: 5432,
  })

  // Fetch all users
  const getUsers = (request, response) => {
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

  // Fetch a user by ID
  const getUserById = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
    })
  }

  const updateUser = (request, response) => {
    const id = parseInt(request.params.id)
    const {
      name,
      email,
      phone,
      password
    } = request.body

    pool.query(
      'UPDATE users SET name = $1, email = $2, phone = $3, password = $4 WHERE id = $5',
      [name, email, phone, password, id],
      (error, results) => {
        if (error) {
          throw error
        }
        response.status(200).send(`User modified with ID: ${id}`)
      }
    )
  }


  const deleteUser = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`User deleted with ID: ${id}`)
    })
  }



  const bcrypt = require('bcrypt');

  const createUser = async (request, response) => {
    const {
      name,
      email,
      phone,
      password
    } = request.body;
    console.log("Request body:", request.body); // Add this

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Hashed password:", hashedPassword); // Add this

      pool.query(
        'INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, phone, hashedPassword],
        (error, results) => {
          if (error) {
            console.error("Database insert error:", error); // Add this
            return response.status(500).json({
              error: 'Error creating user'
            });
          }
          response.status(201).json({
            id: results.rows[0].id
          });
        }
      );
    } catch (error) {
      console.error("Hashing error:", error); // Add this
      response.status(500).json({
        error: 'Internal server error'
      });
    }
  };

  const loginUser = async (request, response) => {
    const {
      email,
      password
    } = request.body;

    pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
      async (error, results) => {
        if (error) {
          return response.status(500).json({
            error: 'Database error'
          });
        }
        if (results.rows.length > 0) {
          const user = results.rows[0];
          const isMatch = await bcrypt.compare(password, user.password); // Compare hashed password
          if (isMatch) {
            response.status(200).json({
              message: 'Login successful',
              user: {
                id: user.id,
                name: user.name
              }
            });
          } else {
            response.status(401).json({
              message: 'Invalid credentials'
            });
          }
        } else {
          response.status(401).json({
            message: 'Invalid credentials'
          });
        }
      }
    );
  };

  // const cors = require('cors');
  // app.use(cors());


  module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    loginUser, // Add this export
  }