//Router
const router = require('express').Router()

//HashPassword
const hashPassword = require('../../utils/hashPassword')

//JWT
const jwt = require('jsonwebtoken')

//Schema
const tgSchema = require('../../schema/travelGroup')
const tgUpdateSchema = require('../../schema/travelGroupUpdate')

//Validator
const Validator = require('jsonschema').Validator
const validator = new Validator()

//ROUTES
//POST /tg/create
//POST /tg/login
//GET /tg
//GET /tg/get/:id
//GET /tg/verifyEmail/:email
//PUT /tg
//DELETE /tg/:id


module.exports = (db) => {
  const TravelGroup = require('../../db/travelGroup')(db)
  const auth = require('../../middleware/auth')

  //POST /tg/create
  router.post('/create', async(req, res) => {
    const newGroup = req.body
    try {
      const error = new Error()
      if(!validator.validate(newGroup, tgSchema).valid) {
        error.message = 'Invalid Request'
        error.code = 'ValidationException'
        throw error
      }

      const result = await TravelGroup.create(newGroup)
      res.status(200).json({message: 'New Travel Group Created'})
    } catch(err) {
      res.status(500).json({ message: err.message })
    }
  })

  //POST /tg/login
  router.post('/login', async(req, res) => {
    try {
      const {email, password} = req.body
      const result = await TravelGroup.getByEmail(email)

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
        let tg = result
        tg.token = token
        delete tg.password
        res.status(200).json(tg)
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

  //GET /tg
  router.get('/', async(req, res) => {
    try {
      const result = await TravelGroup.getAll().toArray()
      let finalResult = result.map((tg) => {
        delete tg.password
        return tg
      })
      res.status(200).json(finalResult)
    } catch (err) {
      res.status(500).json({message: err.message})
    }
  })

  //GET /tg/get/:id
  router.get('/get/:id', auth, async(req, res) => {
    try {
      const travelGroup = await TravelGroup.get(req.params.id)
      if(travelGroup !== null){
        delete travelGroup.password
        res.status(200).json(travelGroup)
      }
      else
        res.status(404).json({message: 'Travel Group Not Found'})
    } catch (error) {
      res.status(500).json({message: error.message})
    }
  })

  //GET /tg/verifyEmail/:email
  router.get('/verifyEmail/:email', async(req, res) => {
    try {
      const travelGroup = await TravelGroup.getByEmail(req.params.email)
      if(travelGroup === null)
        res.status(200).json({ message: "Email ID is unique" })
      else
        res.status(200).json({ message: "Email ID already exists"})

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })

  //PUT /tg
  router.put('/', auth, async(req, res) => {
    try {
      const error = new Error();
      if (!validator.validate(req.body, tgUpdateSchema).valid) {
        error.message = 'Invalid input';
        error.code = 'ValidationException';
        throw error;
      }
      const updatedTg = req.body;
      const result = await TravelGroup.update(updatedTg);
      const insertedTg = result.message.documents[0];
      if (result.result.n === 0) {
        error.message = 'Travel Group with the specified ID doesn\'t exist.';
        error.code = 'TGNotFound';
        throw error;
      }
      res.status(200).json({message: 'Travel Group updated'});
    } catch (e) {
      if (e.code === 'ValidationException') {
        res.status(405).json({message: e.message});
      } else if (e.code === 'TGNotFound') {
        res.status(404).json({message: e.message});
      } else {
        res.status(500).json({message: e.message});
      }
    }
  })

  //DELETE /tg/:id
  router.delete('/:id', auth, async(req, res) => {
    try {
      const deleted = await TravelGroup.delete_one(req.params.id)
      if (deleted.CommandResult.message.Response.parsed === true) {
        res.status(200).json({message: 'Travel Group deleted'})
      } else {
        res.status(404).json({message: 'Travel Group not found'});
      }
    } catch (error) {
      res.status(200).json({message: 'Travel Group deleted'})
    }
  })

  //GET /tg/tgName/:tg
  router.get('/tgName/:tg', async(req, res) => {
    try {
      const result = await TravelGroup.getByName(req.params.tg.toLowerCase())
      if(result === null)
        res.status(200).json({message: "TG Name is Unique"})
      else
        res.status(200).json({message: "TG Name already exists"})
    } catch (err) {
      res.status(500).json({message: err.message})
    }
  })

  return router
}