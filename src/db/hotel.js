const ObjectId = require('mongodb').ObjectId

//Crypto
const crypto = require('crypto')

//HashPassword
const hashPassword = require('../utils/hashPassword')


module.exports = (db) => ({
  create: (hotel) => {
    let password = hotel.password
    const salt = crypto.randomBytes(512).toString()
    const iterations = Math.floor((Math.random() * 500) + 500)
    const hashedPassword = hashPassword(password, salt, iterations)

    hotel.password = {
      hash: hashedPassword,
      salt,
      iterations
    }

    return db.collection('hotels').insertOne({...hotel})
  },

  update: (hotel) => {
    const {_id} = hotel
    delete hotel._id
    return db.collection('hotels').update({_id: ObjectId(_id)}, {'$set': {...hotel}}, {upsert: false})
  },

  getAll: (hotel) => {
    return db.collection('hotels').find()
  },

  get: (id) => {
    return db.collection('hotels').findOne({_id: ObjectId(id)})
  },

  getByEmail: (email) => {
    return db.collection('hotels').findOne({email})
  },

  delete_one: (id) => {
    return db.collection('hotels').deleteOne({_id: ObjectId(id)})
  }

})