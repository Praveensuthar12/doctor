const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
require('./config/passport');
const passportLib = require('passport');
require('dotenv').config();
const response = require('./middleware/response');

const app = express();

app.use(helmet());
app.use(morgan('dev'));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(response);
app.use(passportLib.initialize());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/appointment', require('./routes/appointment'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));

app.get('/health', (req, res) =>
  res.ok({ time: new Date().toISOString() }, 'OK')
);

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected ✅');

    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT} ✅`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

startServer();



// const express = require('express')
// const mongoose = require('mongoose');
// const helmet = require('helmet')
// const morgan = require('morgan')
// const cors = require('cors')
// const bodyParser = require('body-parser')
// require('./config/passport')
// const passportLib = require('passport');
// require('dotenv').config();
// const response = require('./middleware/response');



// const app = express();

// //helmet is a security middleware for Express 
// //It helps protect your app by settings various HTTP headers
// app.use(helmet());

// //morgan is an HTTP request logger middleware
// app.use(morgan('dev'))
// app.use(cors({
//     origin: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean) || '*',
//     credentials: true
// }));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));


// //used response
// app.use(response);


// //Initialize passport
// app.use(passportLib.initialize());

// //Mongodb connection
// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => console.log('MongoDB connected ✅'))
//     .catch(err => console.error('MongoDB connection error:', err));

// app.use('/api/auth', require('./routes/auth'))
// app.use('/api/doctor', require('./routes/doctor'))
// app.use('/api/patient', require('./routes/patient'))
// app.use('/api/appointment', require('./routes/appointment'))
// app.use('/api/payment', require('./routes/payment'))
// app.use('/api/admin', require('./routes/admin'))

// app.get('/health', (req, res) => res.ok({ time: new Date().toISOString() }, 'OK'))


// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => console.log(`Server listening on ${PORT} ✅`));