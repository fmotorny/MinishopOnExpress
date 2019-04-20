'use strict';
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    name: DataTypes.STRING,
    price: DataTypes.FLOAT,
    image: DataTypes.STRING,
    category: DataTypes.STRING,
  }, {});
  Product.associate = function(models) {
    // associations can be defined here

  };
  return Product;
};