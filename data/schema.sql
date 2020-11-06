DROP TABLE if exists book_info;

CREATE TABLE book_info (
  id SERIAL PRIMARY KEY,
  author VARCHAR(255),
  title VARCHAR(255),
  isbn VARCHAR(255),
  image_url VARCHAR(500),
  description VARCHAR(255)
);

INSERT INTO book_info (author, title, isbn, image_url, description) VALUES ('Frank Herbert', 'Dune', 'ISBN_13 9780441013593', 'http://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=5&edge=curl&source=gbs_api', 'Follows the adventures of Paul Atreides, the son of a betrayed duke given up for dead on a treacherous desert planet and adopted by its fierce, nomadic people, who help him unravel his most unexpected destiny.'
);

INSERT INTO book_info (author, title, isbn, image_url, description) VALUES ('Brandon Mull', 'Fablehaven', 'ISBN_13 1416947205', 'http://books.google.com/books/content?id=w7FfrQxhnxEC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'When Kendra and Seth go to stay at their grandparents&#39; estate, they discover that it is a sanctuary for magical creatures and that a battle between good and evil is looming.'
);

