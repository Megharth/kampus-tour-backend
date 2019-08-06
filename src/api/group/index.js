//Router
const router = require('express').Router()

//HashPassword
const hashPassword = require('../../utils/hashPassword')

//JWT
const jwt = require('jsonwebtoken')

//Schema
const groupSchema = require('../../schema/group')

//Validator
const Validator = require('jsonschema').Validator
const validator = new Validator()

module.exports = (db) => {
  const Group = require('../../db/group')(db)
  const auth = require('../../middleware/auth')

  //POST /group/create
  router.post('/create', async(req, res) => {
    const newGroup = req.body
    try {
      const error = new Error()
      if(!validator.validate(newGroup, groupSchema).valid) {
        error.message = 'Invalid Request'
        error.code = 'ValidationException'
        throw error
      }
      const result = await Group.create(newGroup)
      res.status(200).json({message: 'Group Created'})
    } catch(err) {
      res.status(500).json({message: err.message})
    }
  })

  //POST /group/add-hotel
  router.post('/add-hotel', auth, async(req, res) => {
    try {
      const newHotel = req.body.hotel
      const _id = req.body.id

      const group = await Group.get(_id)
      let addHotel = true
      group.hotels.forEach((hotel) => {
        if(hotel.name === newHotel.name && hotel.city === newHotel.city) {
          addHotel = false
          return
        }
      })

      if(addHotel) {
        group.hotels.push(newHotel)
        const result = await Group.update(group)
        res.status(200).json('New Hotel added to the group')
      }
      else
        res.status(200).json('Hotel Already exists in the group')

    } catch (error) {
      res.status(500).json({message: error.message})
    }
  })
  //POST /group/login
  router.post('/login', async(req, res) => {
    try {
      const {email, password} = req.body
      const result = await Group.getByEmail(email)

      const error = new Error()

      if (!(email && password)) {
        error.message = 'Invalid request'
        error.code = 'MissingCredentials'
        throw error
      }

      if (result === null) {
        error.message = 'Invalid username or password'
        error.code = 'GroupDoesntExist'
        throw error
      }

      if (result.password.hash === hashPassword(password, result.password.salt, result.password.iterations)) {
        const payload = {
          email
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRATION_TIME})
        let group = result
        group.token = token
        res.status(200).json(group)
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
      else if (error.code in ['GroupDoesntExist', 'InvalidCredentials']) {
        res.status(401)
      }
      else {
        res.status(500)
      }
      res.json({message: error.message})
    }
  })

  //POST /group/verifyEmail
  router.post('/group/verifyEmail', async(req, res) => {
    try {
      const group = await Group.getByEmail(req.body.email)
      if(group === null)
        res.status(200).json({ message: "Email ID is unique" })
      else
        res.status(200).json({ message: "Email ID already exists"})

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })

  //PUT /group
  router.put('/', auth, async(req, res) => {
    try {
      const error = new Error();
      if (!validator.validate(req.body, groupSchema).valid) {
        error.message = 'Invalid input';
        error.code = 'ValidationException';
        throw error;
      }
      const updatedGroup = req.body;
      const result = await Group.update(updatedGroup);
      const insertedGroup = result.message.documents[0];
      if (result.result.n === 0) {
        error.message = 'The Group with the specified ID doesn\'t exist.';
        error.code = 'GroupNotFound';
        throw error;
      }
      res.status(200).json({message: 'Group updated'});
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

  //DELETE /group/:id
  router.delete('/:id', auth, async(req, res) => {
    try {
      const deleted = await Group.delete_one(req.params.id)
      if (deleted.CommandResult.message.Response.parsed === true) {
        res.status(200).json({message: 'Group deleted'})
      } else {
        res.status(404).json({message: 'Group not found'});
      }
    } catch (error) {
      res.status(200).json({message: 'Group deleted'})
    }
  })

  //GET /group
  router.get('/', async(req, res) => {
    try {
      const result = await Group.getAll().toArray()
      res.status(200).json(result)
    } catch (err) {
      res.status(500).json({message: err.message})
    }
  })

  //GET /group/:id
  router.get('/:id', auth, async(req, res) => {
    try {
      const group = await Group.get(req.params.id)
      if(group !== null)
        res.status(200).json(group)
      else
        res.status(404).json({message: 'Group Not Found'})
    } catch (error) {
      res.status(500).json({message: error.message})
    }
  })

  return router
}
