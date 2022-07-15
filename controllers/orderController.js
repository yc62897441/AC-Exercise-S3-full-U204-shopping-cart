const db = require('../models')
const Order = db.Order
const OrderItem = db.OrderItem
const Cart = db.Cart

const orderController = {
  getOrders: (req, res) => {
    Order.findAll({ include: 'items' })
      .then(orders => {
        orders = orders.map(order => ({
          ...order.dataValues,
          items: order.items.map(item => ({
            ...item.dataValues,
            OrderItem: { ...item.OrderItem.dataValues }
          }))
        }))

        // 另一種方式處理 include 產生的問題，不用 map，1.陣列存到物件內；2.物件轉成JSON；3.JSON轉回物件；4.物件取出存成陣列
        // orders = { orders: orders }
        // orders = JSON.stringify(orders)
        // orders = JSON.parse(orders)
        // orders = orders.orders.map(order => order)

        return res.render('orders', { orders })
      })
  },
  postOrder: (req, res) => {
    Cart.findByPk(req.session.cartId, { include: 'items' })
      .then(cart => {
        if (cart.items.length > 0) {
          cart = cart.toJSON()
        }

        Order.create({
          name: req.body.name,
          address: req.body.address,
          phone: req.body.phone,
          shipping_status: req.body.shipping_status,
          payment_status: req.body.payment_status,
          amount: req.body.amount,
        })
          .then(order => {
            let results = []
            for (let i = 0; i < cart.items.length; i++) {
              results.push(
                OrderItem.create({
                  OrderId: order.id,
                  ProductId: cart.items[i].id,
                  price: cart.items[i].price,
                  quantity: cart.items[i].CartItem.quantity,
                })
              )
            }
            return Promise.all(results)
              .then(() => {
                res.redirect('/orders')
              })
          })
      })
  },
  cancelOrder: (req, res) => {
    Order.findByPk(req.params.id)
      .then(order => {
        order.update({
          ...req.body,
          shipping_status: '-1',
          payment_status: '-1',
        })
          .then(order => {
            return res.redirect('back')
          })
      })
  }
}

module.exports = orderController
