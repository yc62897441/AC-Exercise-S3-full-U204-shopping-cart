const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cartController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController.js')

router.get('/', (req, res) => {
  res.render('index')
})

router.get('/products', productController.getProducts)

router.get('/cart', cartController.getCart)
router.post('/cart', cartController.postCart)
router.post('/cartItem/:id/add', cartController.addCartItem)
router.post('/cartItem/:id/sub', cartController.subCartItem)
router.delete('/cartItem/:id', cartController.deleteCartItem)

router.get('/orders', orderController.getOrders)

module.exports = router