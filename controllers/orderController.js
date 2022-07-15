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
            OrderItem: { ...item.OrderItem.dataValues}
           }))
        }))
        return res.render('orders', { orders })
      })
  }
}

module.exports = orderController
