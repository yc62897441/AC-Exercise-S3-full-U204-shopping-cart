const db = require('../models')
const Product = db.Product
const PAGE_LIMIT = 3;
const PAGE_OFFSET = 0;

const productController = {
  getProducts: (req, res) => {
    return Product.findAndCountAll({ offset: PAGE_OFFSET, limit: PAGE_LIMIT, raw: true, nest: true })
      .then(products => { return res.render('products', { products }) })
  }
}

module.exports = productController