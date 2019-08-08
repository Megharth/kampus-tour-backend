const ObjectId = require('mongodb').ObjectId

//Crypto
const crypto = require('crypto')

//HashPassword
const hashPassword = require('../utils/hashPassword')



module.exports = (db) => ({
  create: (agent) => {
    let password = agent.password
    const salt = crypto.randomBytes(512).toString()
    const iterations = Math.floor((Math.random() * 500) + 500)
    const hashedPassword = hashPassword(password, salt, iterations)

    agent.password = {
      hash: hashedPassword,
      salt,
      iterations
    }

    return db.collection('agents').insertOne({...agent})
  },

  update: (agent) => {
    const {_id} = agent
    delete agent._id
    return db.collection('agents').update({_id: ObjectId(_id)}, {'$set': {...agent}}, {upsert: false})
  },

  getAll: (agent) => {
    return db.collection('agents').find()
  },

  get: (id) => {
    return db.collection('agents').findOne({_id: ObjectId(id)})
  },

  getByEmail: (email) => {
    return db.collection('agents').findOne({email})
  },

  getByName: (agencyName) => {
    return db.collection('agents').findOne({agencyName})
  },

  delete_one: (id) => {
    return db.collection('agents').deleteOne({_id: ObjectId(id)})
  }

})