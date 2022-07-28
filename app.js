const express = require('express');
require('dotenv').config();
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const homeRoute = require('./routes/home');
const userRoute = require('./routes/user');

const app = express();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
  })
);

app.set('view engine', 'ejs');

app.use(morgan('dev'));

app.use('/api/v1', homeRoute);
app.use('/api/v1', userRoute);

app.get('/signuptest', (req, res) => {
  res.render('signuptest');
});

module.exports = app;
