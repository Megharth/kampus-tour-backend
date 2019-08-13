//Router
const router = require('express').Router()

//HashPassword
const hashPassword = require('../../utils/hashPassword')

//JWT
const jwt = require('jsonwebtoken')

//Schema
const agentSchema = require('../../schema/agent')

//Validator
const Validator = require('jsonschema').Validator
const validator = new Validator()


//ROUTES

//POST /agent/create
//POST /agent/login
//GET /agent
//GET /agent/get/:id
//GET /agent/verifyEmail/:email
//PUT /agent
//DELETE /agent/:id
//GET /agent/agencyName/:agency



module.exports = (db) => {
  const Agent = require('../../db/agent')(db)
  const auth = require('../../middleware/auth')

  //POST /agent/create
  router.post('/create', async(req, res) => {
    const newAgent = req.body
    try {
      const error = new Error()
      if(!validator.validate(newAgent, agentSchema).valid) {
        error.message = 'Invalid Request'
        error.code = 'ValidationException'
        throw error
      }

      const result = await Agent.create(newAgent)
      res.status(200).json({message: 'Agent Created'})
    } catch(err) {
      res.status(500).json({ message: err.message })
    }
  })

  //POST /agent/login
  router.post('/login', async(req, res) => {
    try {
      const {email, password} = req.body
      const result = await Agent.getByEmail(email)

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
        let agent = result
        agent.token = token
        res.status(200).json(agent)
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


  //GET /agent
  router.get('/', auth, async(req, res) => {
    try {
      const result = await Agent.getAll().toArray()
      let finalResult = result.map((doc) => {
        return {
          _id: doc._id,
          agencyName: doc.agencyName,
          ownerFirstName: doc.ownerInfo.firstName,
          ownerLastName: doc.ownerInfo.lastName,
          city: doc.city
        }
      })
      res.status(200).json(finalResult)
    } catch (err) {
      res.status(500).json({message: err.message})
    }
  })


  //GET /agent/get/:id
  router.get('/get/:id', auth, async(req, res) => {
    try {
      const agent = await Agent.get(req.params.id)
      if(agent !== null)
        res.status(200).json(agent)
      else
        res.status(404).json({message: 'Agent Not Found'})
    } catch (error) {
      res.status(500).json({message: error.message})
    }
  })

  //GET /agent/verifyEmail/:email
  router.get('/verifyEmail/:email', async(req, res) => {
    try {
      const agent = await Agent.getByEmail(req.params.email)
      if(agent === null)
        res.status(200).json({ message: "Email ID is unique" })
      else
        res.status(200).json({ message: "Email ID already exists"})

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })


  //PUT /agent
  router.put('/', auth, async(req, res) => {
    try {
      const error = new Error();
      if (!validator.validate(req.body, agentSchema).valid) {
        error.message = 'Invalid input';
        error.code = 'ValidationException';
        throw error;
      }
      const updatedAgent = req.body;
      const result = await Agent.update(updatedAgent);
      const insertedAgent = result.message.documents[0];
      if (result.result.n === 0) {
        error.message = 'The Agent with the specified ID doesn\'t exist.';
        error.code = 'AgentNotFound';
        throw error;
      }
      res.status(200).json({message: 'Agent updated'});
    } catch (e) {
      if (e.code === 'ValidationException') {
        res.status(405).json({message: e.message});
      } else if (e.code === 'AgentNotFound') {
        res.status(404).json({message: e.message});
      } else {
        res.status(500).json({message: e.message});
      }
    }
  })

  //DELETE /agent/:id
  router.delete('/:id', auth, async(req, res) => {
    try {
      const deleted = await Agent.delete_one(req.params.id)
      if (deleted.CommandResult.message.Response.parsed === true) {
        res.status(200).json({message: 'agent deleted'})
      } else {
        res.status(404).json({message: 'agent not found'});
      }
    } catch (error) {
      res.status(200).json({message: 'agent deleted'})
    }
  })

  //GET /agent/agencyName/:agency
  router.get('/agencyName/:agencyName', async(req, res) => {
    try {
      const result = await Agent.getByName(req.params.agencyName.toLowerCase())
      if(result === null)
        res.status(200).json({message: "Agency Name is Unique"})
      else
        res.status(200).json({message: "Agency Name already exists"})
    } catch (err) {
      res.status(500).json({message: err.message})
    }
  })

  return router
}