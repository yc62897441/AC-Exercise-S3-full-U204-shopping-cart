'use strict';

const faker = require('faker')

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('OrderItems',
      Array.from({ length: 10 }).map((item, index) => ({
        OrderId: Math.floor(Math.random() * 2) + 1,
        ProductId: Math.floor(Math.random() * 10) + 1,
        price: Math.floor(Math.random() * 500) + 1,
        quantity: Math.floor(Math.random() * 10) + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      )
      , {})
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('OrderItems', null, {})
  }
};
