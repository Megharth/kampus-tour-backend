const ObjectId = require('mongodb').ObjectId

//Crypto
const crypto = require('crypto')

//HashPassword
const hashPassword = require('../utils/hashPassword')

module.exports = (db) => ({
  create: (tg) => {
    let password = tg.password
    const salt = crypto.randomBytes(512).toString()
    const iterations = Math.floor((Math.random() * 500) + 500)
    const hashedPassword = hashPassword(password, salt, iterations)

    tg.password = {
      hash: hashedPassword,
      salt,
      iterations
    }

    return db.collection('travelGroups').insertOne({...tg})
  },

  update: (tg) => {
    const {_id} = tg
    delete tg._id
    return db.collection('travelGroups').update({_id: ObjectId(_id)}, {'$set': {...tg}}, {upsert: false})
  },

  getAll: (tg) => {
    return db.collection('travelGroups').find()
  },

  get: (id) => {
    return db.collection('travelGroups').findOne({_id: ObjectId(id)})
  },

  getByEmail: (email) => {
    return db.collection('travelGroups').findOne({email})
  },

  getByName: (groupName) => {
    return db.collection('travelGroups').findOne({Name: groupName})
  },

  delete_one: (id) => {
    return db.collection('travelGroups').deleteOne({_id: ObjectId(id)})
  }
})