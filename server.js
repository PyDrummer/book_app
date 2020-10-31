'use strict';

// bring in the dependancies as variables
const express = require('express');
const cors = require('cors'); //cross origin resource sharing
const superagent = require('superagent');
//const pg = require('pg'); // postgreSQL
//const { response } = require('express');

require('dotenv').config(); // used to read a file/environment variables

// Declare our port for our server to listen on
const PORT = process.env.PORT || 4000; // reads the hidden file .env grabbing the PORT if you see 4000 something is wrong with .env

// Start/instanciate express
const app = express();
// use CORS
app.use(cors());

// This is for later! // creating our postgres client
// const client = new pg.Client(process.env.DATABASE_URL);

// Starting our EJS stuff here
app.use(express.static('./public'));
// app.use(express.urlencoded({ extended: true }));

// Set default view engine
app.set('view engine', 'ejs');

// Routes

app.get('/', (request, response) => {
  //console.log('/ route is working!');
  response.status(200).render('pages/index');
});

// Starting the server
app.listen(PORT, () => console.log(`now listening on port ${PORT}`));
