//Router
const router = require('express').Router()

//HashPassword
const hashPassword = require('../../utils/hashPassword')

//JWT
const jwt = require('jsonwebtoken')

//Schema
const hotelSchema = require('../../schema/hotel')

//Validator
const Validator = require('jsonschema').Validator
const validator = new Validator()

module.exports = (db) => {
  const Hotel = require('../../db/hotel')(db)
  const auth = require('../../middleware/auth')
  //POST /hotel/create
  router.post('/create', async(req, res) => {
    const newHotel = req.body
    try {
      const error = new Error()
      if(!validator.validate(newHotel, hotelSchema).valid) {
        error.message = 'Invalid Request'
        error.code = 'ValidationException'
        throw error
      }
      const result = await Hotel.create(newHotel)
      res.status(200).json({message: 'Hotel Created'})
    } catch(err) {
      res.status(500).json({message: err.message})
    }
  })

  //POST /hotel/login
  router.post('/login', async(req, res) => {
    try {
      const {email, password} = req.body
      const result = await Hotel.getByEmail(email)

      const error = new Error()

      if (!(email && password)) {
        error.message = 'Invalid request'
        error.code = 'MissingCredentials'
        throw error
      }

      if (result === null) {
        error.message = 'Invalid username or password'
        error.code = 'UserDoesntExist'
        throw error
      }

      if (result.password.hash === hashPassword(password, result.password.salt, result.password.iterations)) {
        const payload = {
          email
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRATION_TIME})
        let hotel = result
        hotel.token = token
        res.status(200).json(hotel)
      }
      else {
        error.message = 'Invalid username or password'
        error.code = 'InvalidCredentials'
        throw error
      }
    } catch (error) {
      if (error.code === 'MissingCredentials') {
        res.status(400)
      }
      else if (error.code in ['UserDoesntExist', 'InvalidCredentials']) {
        res.status(401)
      }
      else {
        res.status(500)
      }
      res.json({message: error.message})
    }
  })

  //PUT /hotel
  router.put('/', auth, async(req, res) => {
    try {
      const error = new Error();
      if (!validator.validate(req.body, hotelSchema).valid) {
        error.message = 'Invalid input';
        error.code = 'ValidationException';
        throw error;
      }
      const updatedHotel = req.body;
      const result = await Hotel.update(updatedHotel);
      const insertedHotel = result.message.documents[0];
      if (result.result.n === 0) {
        error.message = 'The Hotel with the specified ID doesn\'t exist.';
        error.code = 'HotelNotFound';
        throw error;
      }
      res.status(200).json({message: 'Hotel updated'});
    } catch (e) {
      if (e.code === 'ValidationException') {
        res.status(405).json({message: e.message});
      } else if (e.code === 'HotelNotFound') {
        res.status(404).json({message: e.message});
      } else {
        res.status(500).json({message: e.message});
      }
    }
  })

  //DELETE /hotel/:id
  router.delete('/:id', auth, async(req, res) => {
    try {
      const deleted = await Hotel.delete_one(req.params.id)
      if (deleted.CommandResult.message.Response.parsed === true) {
        res.status(200).json({message: 'Hotel deleted'})
      } else {
        res.status(404).json({message: 'Hotel not found'});
      }
    } catch (error) {
      res.status(200).json({message: 'Hotel deleted'})
    }
  })

  //GET /hotel
  router.get('/', async(req, res) => {
    try {
      const result = await Hotel.getAll().toArray()
      res.status(200).json(result)
    } catch (err) {
      res.status(500).json({message: err.message})
    }
  })

  //GET /hotel/:id
  router.get('/:id', auth, async(req, res) => {
    try {
      const hotel = await Hotel.get(req.params.id)
      if(hotel !== null)
        res.status(200).json(hotel)
      else
        res.status(404).json({message: 'Hotel Not Found'})
    } catch (error) {
      res.status(500).json({message: error.message})
    }
  })

  //GET /hotel/:email
  router.get('/:email', async(req, res) => {
    try {
      const result = Hotel.getByEmail(req.params.email)
      if(result === null)
        res.status(200).json({message: "Email ID is unique"})
      else
        res.status(200).json({message: "Email ID already exists"})
    } catch (err) {
      res.status(500).json({message: err.message})
    }
  })

  return router
}
