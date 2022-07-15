const db = require('../models')
const Product = db.Product
const Cart = db.Cart
const PAGE_LIMIT = 3;
const PAGE_OFFSET = 0;

const productController = {
  getProducts: (req, res) => {
    return Product.findAndCountAll({ offset: PAGE_OFFSET, limit: PAGE_LIMIT, raw: true, nest: true })
      .then(products => {
        Cart.findByPk(req.session.cartId, { include: 'items' })
          .then(cart => {
            cart = cart || { items: [] }
            let totalPrice = 0
            if (cart.items.length > 0) {
              cart = cart.toJSON()
              totalPrice = cart.items.map(d => d.price * d.CartItem.quantity).reduce((a, b) => a + b)
            }
            return res.render('products', { products, cart, totalPrice })
          })
      })
  }
}

module.exports = productController