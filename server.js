const express = require('express')
const app = express()
const port = 8080

const bcrypt = require('bcrypt')
var session = require('express-session')

const Mood = require('./models/mood.js')
const User = require('./models/user.js')

const { Pool } = require('pg')
const pool = new Pool({
  database: 'moodtracker'
})

app.use(express.json())

app.use(session({ 
  secret: 'keyboard cat', 
  cookie: { maxAge: 60000 }
}))

app.get('/api/logged-in', (req, res) => {

  if (req.session.userId !== undefined) {
    res.json({isLoggedIn: true})
  } else {
    res.json({isLoggedIn: false})
  }
})

app.post('/login', (req, res) => {

  let email = req.body.userEmail
  let password = req.body.userPassword
  let userId = ''
  let userName = ''

  User.findByEmail(email)
    .then(dbRes => {
      console.log(dbRes.rows[0])
      userName = dbRes.rows[0].name
      userId = dbRes.rows[0].id
      let hashedPassword = dbRes.rows[0].password

      return bcrypt.compare(password, hashedPassword)
    })
    .then(result => {
      if (result) {
        req.session.userId = userId

        res.json({isLoggedIn: true, userName, userId})

      } else {
        res.json({isLoggedIn: false})
      }
    })
    .catch(err => {
      console.log(err)
      res.json(err.message)
    })

  console.log(email)
  console.log(password)

})

app.post('/sign-up', (req, res) => {
  console.log(req.body)

  const name = req.body.userName
  const email = req.body.userEmail
  const password = req.body.userPassword
  const saltRounds = 10

  bcrypt.hash(password, saltRounds)
  .then(hashedPassword => {
    
    return User.create(name, email, hashedPassword)
  })
  .then(res => {
    console.log('new user added')
  })
  .catch(err => {
    console.log(err)
  })

  //salt password
  // const hashedPassword = User.encryptPassword(req.body.password)

  // User.create(req.body.name, req.body.email, hashedPassword)
  //   .then(dbRes => {
  //     res.status(201).json({ message: 'new user added', item: dbRes.rows[0] })
  //     })
  //     .catch(err => {
  //     res.status(500).json({ message: 'something went wrong. try again' })
  //     })

})

app.get('/api/moods/:id', (req, res) => {
  
  Mood.all(req.params.id)
    .then(dbRes => {
      res.json(dbRes.rows)
    })
    .catch(err => {
      res.json(err)
    })

})

app.get('/api/moods/:id/:date', (req, res) => {

  Mood.single(req.params.date, req.params.id)
    .then(dbRes => {
      res.json(dbRes.rows[0])
    })
    .catch(err => {
      res.json(err)
    })

})

app.post('/api/moods', (req, res) => {

  console.log(req.body)
  Mood.create(req.body.userId, req.body.mood, req.body.habits, req.body.note, req.body.date)
        .then(dbRes => {
        res.status(201).json({ message: 'new mood added', item: dbRes.rows[0] })
        })
        .catch(err => {
        res.status(500).json({ message: 'something went wrong. try again' })
    })

})


app.listen(port, () => {
  console.log(`server listening on port ${port}.`)
})
