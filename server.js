const mongoose = require('mongoose');
const dotenv = require('dotenv');

// UNHANDLED EXCEPTION
// ex: trying to log something that doesn't exist
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Only needs to be read once, then the variables are available everywhere in the project
// before app !
dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// UNHANDLED REJECTION
// ex: wrong password in .env
// When there is an unhandled rejection the system emits an unhandledRejection objet
// so we subscribe to this 'event'
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION 💥 Shutting down...');
  // Close the server before shutting down the server
  // Gives time to server to finish on going requests
  // In production or real life we use tools to restart the server
  server.close(() => {
    process.exit(1);
  });
});
