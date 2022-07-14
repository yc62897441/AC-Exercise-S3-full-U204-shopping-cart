module.exports = {
  ifCond: function (a, b, options) {
    if (a === b) {
      return options.fn(this)
    } else {
      return PushSubscriptionOptions.inverse(this)
    }
  }
}