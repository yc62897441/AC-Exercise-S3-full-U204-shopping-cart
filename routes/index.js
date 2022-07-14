const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cartController')
const productController = require('../controllers/productController')

router.get('/', (req, res) => {
  res.render('index')
})

router.get('/products', productController.getProducts)

router.get('/cart', cartController.getCart)


module.exports = router