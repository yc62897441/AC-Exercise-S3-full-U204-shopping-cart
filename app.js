const express = require('express')
const exphbs = require('express-handlebars')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const indexRouter = require('./routes/index')

const app = express()
const PORT = 3000

app.engine('handlebars', exphbs.engine({ defaultLayout: 'main', helpers: require('./config/handlebars-helpers') }))
app.set('view engine', 'handlebars')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cookieParser())
app.use(session({
  secret: 'ac',
  resave: false,
  saveUninitialized: true,
  name: 'ac',
  cookie: { maxAge: 80000 }
}))

app.use('/', indexRouter)

app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`)
})

module.exports = app
