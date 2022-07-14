const express = require('express')
const exphbs = require('express-handlebars')

const indexRouter = require('./routes/index')

const app = express()
const PORT = 3000

app.engine('handlebars', exphbs.engine({defaultLayout: 'main', helpers: require('./config/handlebars-helpers')}))
app.set('view engine', 'handlebars')

app.use('/', indexRouter)

app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`)
})

module.exports = app
