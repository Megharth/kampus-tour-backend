const ObjectId = require('mongodb').ObjectId

//Crypto
const crypto = require('crypto')

//HashPassword
const hashPassword = require('../utils/hashPassword')

module.exports = (db) => ({
  create: (group) => {
    let password = group.password
    const salt = crypto.randomBytes(512).toString()
    const iterations = Math.floor((Math.random() * 500) + 500)
    const hashedPassword = hashPassword(password, salt, iterations)

    group.password = {
      hash: hashedPassword,
      salt,
      iterations
    }

    return db.collection('groups').insertOne({...group})
  },

  update: (group) => {
    const {_id} = group
    delete group._id
    return db.collection('groups').update({_id: ObjectId(_id)}, {'$set': {...group}}, {upsert: false})
  },

  getAll: (group) => {
    return db.collection('groups').find()
  },

  get: (id) => {
    return db.collection('groups').findOne({_id: ObjectId(id)})
  },

  getByEmail: (email) => {
    return db.collection('groups').findOne({email})
  },

  delete_one: (id) => {
    return db.collection('groups').deleteOne({_id: ObjectId(id)})
  },

})