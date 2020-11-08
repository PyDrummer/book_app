'use strict';

// bring in the dependancies as variables
const express = require('express');
const cors = require('cors'); //cross origin resource sharing
const superagent = require('superagent');
const pg = require('pg'); // postgreSQL
//const { response } = require('express');
const methodOverride = require('method-override');

require('dotenv').config(); // used to read a file/environment variables

// Declare our port for our server to listen on
const PORT = process.env.PORT || 3000; // reads the hidden file .env grabbing the PORT if you see 3000 something is wrong with .env

// Start/instanciate express
const app = express();
// use CORS
app.use(cors());
// Starting our EJS stuff here
app.use(express.static('public'));
// Allows us to get the secure POST info.
app.use(express.urlencoded({ extended: true }));
// Bringing in the Method override dependancy
app.use(methodOverride('_method'));
// Set default view engine
app.set('view engine', 'ejs');

// This is for later! // creating our postgres client
const client = new pg.Client(process.env.DATABASE_URL);

// Routes

app.get('/', (request, response) => {
  //console.log('/ route is working!');
  const SQL = `SELECT * FROM book_info`;

  client.query(SQL)
    .then(results => {
      // console.log(results.rows);
      let bookData = results.rows;
      let bookCount = results.rows.length;
      //console.log(bookCount);
      response.status(200).render('pages/index', {bookData, bookCount});
    });
});

// Takes us to the details page
app.get('/books/:id', (req, res) => {

  const SQL = `SELECT * FROM book_info WHERE id=$1;`;
  const params = [req.params.id];

  client.query(SQL, params)
    .then(results => {
      console.log('results.rows =', results.rows);
      let savedDetails = results.rows;
      res.status(200).render('pages/books/detail', {savedDetails});
    });
});

// Takes us to the search page
app.get('/search', (request, response) => {
  response.status(200).render('pages/searches/new');
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

  // console.log(URL);
  superagent.get(URL)
    .then(data => {
      let bookInfo = data.body.items.map(book => {
        // If there isnt an image, replace it with a placeholder
        let imageLink = '';
        if (book.volumeInfo.imageLinks) {
          imageLink = book.volumeInfo.imageLinks.thumbnail;
        } else {
          imageLink = 'https://i.imgur.com/J5LVHEL.jpg';
        }
        // If there isnt a category, replace it with "No Category Info"
        let categories = '';
        if (book.volumeInfo.categories) {
          categories = book.volumeInfo.categories;
        } else {
          categories = 'No Category Info';
        }
        return new Book(book, categories, imageLink);
      });
      //console.log(bookInfo);
      res.status(200).render('pages/searches/show', { bookInfo });
    })
    .catch((error) => {
      console.log('error', error);
      res.status(500).render('pages/error');
    });
});

// Saving the book to our database
app.post('/save/:isbn', (req, res) => {
  //console.log('req.params.isbn: ', req.params);
  console.log('req.body: ', req.body);
  let title = req.body.title;
  console.log('title is: ', title);
  let author = req.body.author;
  console.log(author);
  let isbn = req.body.isbn;
  let image_url = req.body.bookPic;
  let bookshelf = req.body.bookshelf;
  let desc = req.body.description;

  const SQL = `INSERT INTO book_info (author, title, isbn, image_url, bookshelf, description) VALUES ($1, $2, $3, $4, $5, $6)`;
  const safeValues = [author, title, isbn, image_url, bookshelf, desc];

  client.query(SQL, safeValues)
    .then(results => {
      console.log('results.rows =', results.rows);
      //let savedDetails = results.rows;
      res.status(200).redirect('/');
    });
});


// Constructor!
function Book(obj, category, pic) {
  this.bookTitle = obj.volumeInfo.title;
  this.bookAuthor = obj.volumeInfo.authors[0];
  this.description = obj.volumeInfo.description;
  this.isbn = obj.volumeInfo.industryIdentifiers[0].identifier;
  this.bookshelf = category;
  this.bookPic = pic;
}

// Starting the server
//app.listen(PORT, () => console.log(`now listening on port ${PORT}`));

// client starting app
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Client now listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.log('Error! ', err);
  });
