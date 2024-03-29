//DEPENDENCIES

const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient
const logger = require('morgan')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const cors = require('cors')

//APIs
const agents = require('./api/agent')
const hotels = require('./api/hotel')
const groups = require('./api/group')
const travelGroup = require('./api/travelGroup')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cors())
dotenv.config()

app.listen(process.env.PORT || 3000, async()=> {
  try {
    console.log('server started')
    const uri = process.env.DB
    const dbName = 'kampus-tour'
    const client = await MongoClient.connect(uri, { useNewUrlParser: true })
    console.log('connnected to db')
    const db = client.db(dbName)

    app.use('/agent', agents(db))
    app.use('/hotel', hotels(db))
    app.use('/group', groups(db))
    app.use('/tg', travelGroup(db))
  } catch (error) {
    console.log("index: " + error.message)
  }
})

module.exports = app


