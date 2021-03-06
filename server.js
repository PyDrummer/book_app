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

//-----------------------------------------------------
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

//-----------------------------------------------------
// Routes
app.get('/', homeHandler);
// Takes us to the details page
app.get('/books/:id', detailsHandler);
// Takes us to the search page
app.get('/search', searchRenderHandler);
// handles searching
app.post('/searches', searchHandler);
// Saving the book to our database
app.post('/save/:isbn', bookSaveHandler);
// Book edits handler
app.put('/edit/:id', bookEditHandler);
// Deleting handler
app.delete('/delete/:id', deleteHandler);

//-----------------------------------------------------
// function handlers
function homeHandler(req, res) {
  const SQL = `SELECT * FROM book_info`;

  client.query(SQL)
    .then(results => {
      // console.log(results.rows);
      let bookData = results.rows;
      let bookCount = results.rows.length;
      //console.log(bookCount);
      res.status(200).render('pages/index', { bookData, bookCount });
    })
    .catch(err => {
      console.log('Error! ', err);
    });
}

function detailsHandler(req, res) {
  const SQL = `SELECT * FROM book_info WHERE id=$1;`;
  const params = [req.params.id];

  client.query(SQL, params)
    .then(results => {
      // console.log('results.rows =', results.rows);
      let savedDetails = results.rows;
      res.status(200).render('pages/books/detail', { savedDetails, bookshelf });
    })
    .catch(err => {
      console.log('Error! ', err);
    });
}

function searchRenderHandler(req, res) {
  res.status(200).render('pages/searches/new');
}

function searchHandler(req, res) {
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

  superagent.get(URL)
    .then(data => {
      let bookInfo = data.body.items.map(book => {

        //------------------------------------------------------
        // Refactored for ternary operation in the constructor

        // If there isnt an image, replace it with a placeholder
        // let imageLink = '';
        // if (book.volumeInfo.imageLinks) {
        //   imageLink = book.volumeInfo.imageLinks.thumbnail;
        // } else {
        //   imageLink = 'https://i.imgur.com/J5LVHEL.jpg';
        // }
        // If there isnt a category, replace it with "No Category Info"
        // let categories = '';
        // if (book.volumeInfo.categories) {
        //   categories = book.volumeInfo.categories;
        // } else {
        //   categories = 'No Category Info';
        // }
        //------------------------------------------------------
        return new Book(book);
      });
      //console.log(bookInfo);
      res.status(200).render('pages/searches/show', { bookInfo });
    })
    .catch((error) => {
      console.log('error', error);
      res.status(500).render('pages/error');
    });
}

function bookSaveHandler(req, res) {
  let title = req.body.title;
  let author = req.body.author;
  let isbn = req.body.isbn;
  let image_url = req.body.bookPic;
  let bookshelf = req.body.bookshelf;
  let desc = req.body.description;

  // search the database to see if we already have this "saved book"
  const SQL = `SELECT * FROM book_info WHERE isbn=$1`;
  const safeValue = [isbn];

  client.query(SQL, safeValue)
    .then(results => {
      if (results.rows.length > 0) {
        console.log('book already saved in the database!');
        res.status(200).redirect('/');
      } else {
        const SQL = `INSERT INTO book_info (author, title, isbn, image_url, bookshelf, description) VALUES ($1, $2, $3, $4, $5, $6)`;
        const safeValues = [author, title, isbn, image_url, bookshelf, desc];

        client.query(SQL, safeValues)
          .then(results => {
            console.log('stored the book in the database: ', results.rows);
            //let savedDetails = results.rows;
            res.status(200).redirect('/');
          })
          .catch(err => {
            console.log('Error! ', err);
          });
      }
    })
    .catch(err => {
      console.log('Error! ', err);
    });
}

function bookEditHandler(req, res) {
  //console.log('req.params:', req.body);
  let id = req.body.id;
  let author = (req.body.author === '') ? 'No Author Given' : req.body.author;
  let title = (req.body.title === '') ? 'No Title Given': req.body.title;
  let isbn = (req.body.isbn === '') ? 'No ISBN Given' : req.body.isbn;
  let image_url = (req.body.image_url === '') ? 'https://i.imgur.com/J5LVHEL.jpg' : req.body.image_url;
  let description = (req.body.description === '') ? 'No Description Given' : req.body.description;
  let bookshelf = req.body.bookshelf;

  const SQL = `UPDATE book_info SET author=$2, title=$3, isbn=$4, image_url=$5, bookshelf=$6, description=$7 WHERE id=$1`;
  const safeValue = [id, author, title, isbn, image_url, bookshelf, description];

  client.query(SQL, safeValue)
    .then(results => {
      res.status(200).redirect('/');
    })
    .catch(err => {
      console.log('Error! ', err);
    });
}

function deleteHandler(req, res) {
  const SQL = `DELETE FROM book_info WHERE id=$1`;
  const saveValue = [req.params.id];

  client.query(SQL, saveValue)
    .then(results => {
      res.status(200).redirect('/');
    })
    .catch(err => {
      console.log('Error! ', err);
    });
}

//-----------------------------------------------------
// Constructor!
function Book(obj) {
  this.bookTitle = obj.volumeInfo.title || 'No Title Found';
  this.bookAuthor = obj.volumeInfo.authors ? obj.volumeInfo.authors[0] : 'No Author Found';
  this.description = obj.volumeInfo.description || 'No Description Found';
  this.isbn = obj.volumeInfo.industryIdentifiers ? obj.volumeInfo.industryIdentifiers[0].identifier : 'ISBN Not Found';
  this.bookshelf = obj.volumeInfo.categories ? obj.volumeInfo.categories : 'N/A';
  this.bookPic = obj.volumeInfo.imageLinks ? obj.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
}

//-----------------------------------------------------
// Bookshelf types:
const bookshelf = [
  'ANTIQUES & COLLECTIBLES',
  'ARCHITECTURE',
  'ART',
  'BIBLES',
  'BIOGRAPHY & AUTOBIOGRAPHY',
  'BODY, MIND & SPIRIT',
  'BUSINESS & ECONOMICS',
  'COMICS & GRAPHIC NOVELS',
  'COMPUTERS',
  'COOKING',
  'CRAFTS & HOBBIES',
  'DESIGN',
  'DRAMA',
  'EDUCATION',
  'FAMILY & RELATIONSHIPS',
  'FICTION',
  'FOREIGN LANGUAGE STUDY',
  'GAMES & ACTIVITIES',
  'GARDENING',
  'HEALTH & FITNESS',
  'HISTORY',
  'HOUSE & HOME',
  'HUMOR',
  'JUVENILE FICTION',
  'JUVENILE NONFICTION',
  'LANGUAGE ARTS & DISCIPLINES',
  'LAW',
  'LITERARY COLLECTIONS',
  'LITERARY CRITICISM',
  'MATHEMATICS',
  'MEDICAL',
  'MUSIC',
  'NATURE',
  'PERFORMING ARTS',
  'PETS',
  'PHILOSOPHY',
  'PHOTOGRAPHY',
  'POETRY',
  'POLITICAL SCIENCE',
  'PSYCHOLOGY',
  'REFERENCE',
  'RELIGION',
  'SCIENCE',
  'SELF-HELP',
  'SOCIAL SCIENCE',
  'SPORTS & RECREATION',
  'STUDY AIDS',
  'TECHNOLOGY & ENGINEERING',
  'TRANSPORTATION',
  'TRAVEL',
  'TRUE CRIME',
  'YOUNG ADULT FICTION',
  'YOUNG ADULT NONFICTION'];

//-----------------------------------------------------
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
