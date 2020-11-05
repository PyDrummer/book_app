DROP TABLE if exists book_info;

CREATE TABLE book_info (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255)
);
