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
app.use(express.static('public'));
// Allows us to get the secure POST info.
app.use(express.urlencoded({ extended: true }));

// Set default view engine
app.set('view engine', 'ejs');

// Routes

app.get('/', (request, response) => {
  //console.log('/ route is working!');
  response.status(200).render('pages/index');
});

app.post('/searches', (req, res) => {
  //console.log(req.body);
  const search = req.body.search;
  const authorOrTitle = req.body.authorOrTitle;
  let urlAuthOrTitle = '';

  if (authorOrTitle === 'title') {
    urlAuthOrTitle = `intitle:${search}`;
  }
  else if (authorOrTitle === 'author') {
    urlAuthOrTitle = `inauthor:${search}`;
  }
  // Originally had a 3rd search option we removed this for the lab.
  // else {
  //   urlAuthOrTitle = search;
  // }

  const URL = `https://www.googleapis.com/books/v1/volumes?q=${urlAuthOrTitle}`;

  console.log(URL);
  superagent.get(URL)
    .then(data => {
      let bookInfo = data.body.items.map(book => {
        let imageLink = '';
        if (book.volumeInfo.imageLinks) {
          imageLink = book.volumeInfo.imageLinks.thumbnail;
        } else {
          imageLink = 'https://i.imgur.com/J5LVHEL.jpg';
        }
        return new Book(book, imageLink);
      });
      res.status(200).render('pages/searches/show', {bookInfo});
    })
    .catch((error) => {
      console.log('error', error);
      res.status(500).send('pages/error');
    });
});

// Constructor!
function Book(obj, pic) {
  this.bookTitle = obj.volumeInfo.title;
  this.bookAuthor = obj.volumeInfo.authors[0];
  this.description = obj.volumeInfo.description;
  this.bookPic = pic;
}

// Starting the server
app.listen(PORT, () => console.log(`now listening on port ${PORT}`));
