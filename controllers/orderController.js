const nodemailer = require('nodemailer')
const crypto = require('crypto')
const db = require('../models')
const Order = db.Order
const OrderItem = db.OrderItem
const Cart = db.Cart

const URL = process.env.URL
const MerchantID = process.env.MerchantID
const HashKey = process.env.HashKey
const HashIV = process.env.HashIV
const PayGateWay = "https://ccore.spgateway.com/MPG/mpg_gateway"
const ReturnURL = URL + "/spgateway/callback?from=ReturnURL"
const NotifyURL = URL + "/spgateway/callback?from=NotifyURL"
const ClientBackURL = URL + "/orders"

function getTradeInfo(Amt, Desc, email) {
  data = {
    'MerchantID': MerchantID, // 商店代號
    'RespondType': 'JSON', // 回傳格式
    'TimeStamp': Date.now(), // 時間戳記
    'Version': 2.0, // 串接程式版本
    'MerchantOrderNo': Date.now(), // 商店訂單編號(使用 timestamp時間戳)
    'LoginType': 0, // 智付通會員
    'OrderComment': 'OrderComment', // 商店備註
    'Amt': Amt, // 訂單金額
    'ItemDesc': Desc, // 產品名稱
    'Email': email, // 付款人電子信箱
    'ReturnURL': ReturnURL, // 支付完成返回商店網址
    'NotifyURL': NotifyURL, // 支付通知網址/每期授權結果通知
    'ClientBackURL': ClientBackURL, // 支付取消返回商店網址
  }

  const chainedData = getDataChain(data)
  const mpg_aes_encrypt = create_mpg_aes_encrypt(chainedData)
  const mpg_sha_encrypt = create_mpg_sha_encrypt(mpg_aes_encrypt)

  tradeInfo = {
    'MerchantID': MerchantID, // 商店代號
    'TradeInfo': mpg_aes_encrypt, // 加密後參數
    'TradeSha': mpg_sha_encrypt, // 加密參數再雜湊後
    'Version': 2.0, // 串接程式版本
    'PayGateWay': PayGateWay,
    'MerchantOrderNo': data.MerchantOrderNo,
  }
  return tradeInfo
}

function getDataChain(TradeInfo) {
  let results = []
  for (let [key, value] of Object.entries(TradeInfo)) {
    results.push(`${key}=${value}`)
  }
  const chainedData = results.join('&')
  return chainedData
}

function create_mpg_aes_encrypt(chainedData) {
  let encrypt = crypto.createCipheriv("aes256", HashKey, HashIV)
  let enc = encrypt.update(chainedData, "utf8", "hex")
  let mpg_aes_encrypt = enc + encrypt.final("hex")
  return mpg_aes_encrypt
}

function create_mpg_sha_encrypt(mpg_aes_encrypt) {
  let sha = crypto.createHash('sha256')
  let plainText = `HashKey=${HashKey}&${mpg_aes_encrypt}&HashIV=${HashIV}`
  const mpg_sha_encrypt = sha.update(plainText).digest('hex').toUpperCase()
  return mpg_sha_encrypt
}

function create_mpg_aes_decrypt(TradeInfo) {
  let decrypt = crypto.createDecipheriv("aes256", HashKey, HashIV);
  decrypt.setAutoPadding(false);
  let text = decrypt.update(TradeInfo, "hex", "utf8");
  let plainText = text + decrypt.final("utf8");
  let result = plainText.replace(/[\x00-\x20]+/g, "");
  return result;
}

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
        const Amt = order.amount
        const Desc = '測試：商品資訊'
        const email = 'abc@abc.com'
        const TradeInfo = getTradeInfo(Amt, Desc, email)

        // 原本資料表 sn欄位 的型態是INT、長度是10，用 workbench 改成 VARCHAR(1024)，增加儲存長度，就不需要再使用 shortMerchantOrderNo 了
        // const shortMerchantOrderNo = Number(TradeInfo.MerchantOrderNo.toString().slice(0, 10))
        const sn = TradeInfo.MerchantOrderNo
        order.update({
          sn: sn
          //sn: shortMerchantOrderNo
        })
          .then(order => {
            order = order.toJSON()
            return res.render('payment', { order, tradeInfo: TradeInfo })
          })
      })
  },
  spgatewayCallback: (req, res) => {
    const data = JSON.parse(create_mpg_aes_decrypt(req.body.TradeInfo))
    // 原本資料表 sn欄位 的型態是INT、長度是10，用 workbench 改成 VARCHAR(1024)，增加儲存長度，就不需要再使用 shortMerchantOrderNo 了
    //const shortMerchantOrderNo = Number(data['Result']['MerchantOrderNo'].toString().slice(0, 10))
    const sn = data['Result']['MerchantOrderNo']

    // return Order.findAll({ where: { sn: shortMerchantOrderNo } })
    return Order.findAll({ where: { sn: sn } })
      .then(orders => {
        orders[0].update({
          payment_status: 1,
        })
          .then(order => {
            return res.redirect('/orders')
          })
      })
  }
}

module.exports = orderController
