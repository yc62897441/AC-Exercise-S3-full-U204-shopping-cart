const nodemailer = require('nodemailer')
const db = require('../models')
const Order = db.Order
const OrderItem = db.OrderItem
const Cart = db.Cart

// Gmail 自 2022/5/30 停用低安全性應用程式存取權
// 還未找出解方，以 nodemailer 使用 gmail
// For gmail, Less secure app access is no longer available
// https://stackoverflow.com/questions/59188483/error-invalid-login-535-5-7-8-username-and-password-not-accepted
// let transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'myaccount@gmail.com',
//     pass: 'mypassword'
//   }
// })

// 改用 Node.js-OAuth 2.0 & nodemailer & Gmail 實作
// https://israynotarray.com/nodejs/20191228/1009061739/
let transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  auth: {
    type: 'OAuth2',
    user: process.env.user,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    refreshToken: process.env.refreshToken,
    accessToken: process.env.accessToken,
  }
})


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

            let mailOptions = {
              from: process.env.user,
              to: process.env.receiver,
              subject: `${order.id} 訂單成立`,
              html: `The body of the email goes here in HTML`,
              // text: `${order.id} 訂單成立`
            }

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error)
              } else {
                console.log(`Email sent: ${info.response}`)
              }
            })

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
  },
  getPayment: (req, res) => {
    return Order.findByPk(req.params.id)
      .then(order => {
        order = order.toJSON()

        return res.render('payment', { order })
      })
  },
  spgatewayCallback: (req, res) => {
    console.log('===== spgatewayCallback =====')
    console.log('===== spgatewayCallback =====')
    console.log(req.body)
    console.log('==========')
    console.log('==========')
    return res.redirect('back')
  }
}

module.exports = orderController
