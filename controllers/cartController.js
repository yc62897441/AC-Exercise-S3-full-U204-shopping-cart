const db = require('../models')
const Cart = db.Cart
const CartItem = db.CartItem
const PAGE_LIMIT = 10
const PAGE_OFFSET = 0

const cartController = {
  getCart: (req, res) => {
    return Cart.findByPk(req.session.cartId, { include: 'items' })
      .then(cart => {
        cart = cart || { items: [] }
        let totalPrice = cart.items.length > 0 ? cart.items.map(d => d.price * d.CartItem.quantity).reduce((a, b) => a + b) : 0
        if (cart.items.length > 0) {
          cart = cart.toJSON()
        }
        return res.render('cart', { cart: cart, totalPrice })
      })
  },
  postCart: (req, res) => {
    return Cart.findOrCreate({ where: { id: req.session.cartId || 0 } })
      .then(function ([cart, created]) {
        return CartItem.findOrCreate({ where: { CartId: cart.id, ProductId: req.body.productId }, default: { CartId: cart.id, ProductId: req.body.productId } })
          .then(function ([cartItem, created]) {
            return cartItem.update({ quantity: (cartItem.quantity || 0) + 1 })
              .then((cartItem) => {
                req.session.cartId = cart.id
                return req.session.save(() => {
                  return res.redirect('back')
                })
              })
          })
      })
  },
  addCartItem: (req, res) => {
    return CartItem.findByPk(req.params.id)
      .then(cartItem => {
        cartItem.update({
          quantity: cartItem.quantity + 1
        })
          .then(cartItem => {
            return res.redirect('back')
          })
      })
  },
  subCartItem: (req, res) => {
    return CartItem.findByPk(req.params.id)
      .then(cartItem => {
        cartItem.update({
          quantity: cartItem.quantity - 1 >= 1 ? cartItem.quantity - 1 : 1
        })
          .then(cartItem => {
            return res.redirect('back')
          })
      })
  },
  deleteCartItem: (req, res) => {
    CartItem.findByPk(req.params.id)
      .then(cartItem => {
        cartItem.desdroy()
          .then(cartItem => {
            return res.redirect('back')
          })
      })
  }
}

module.exports = cartController
