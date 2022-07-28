const mongoose = require('mongoose');

const connectWithDb = () => {
  mongoose
    .connect(process.env.DB_URL)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.log('Error connecting to MongoDB: ', err);
    });
};

module.exports = connectWithDb;
