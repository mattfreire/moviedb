curl -X GET 'http://localhost:3000/movies'

curl -X GET 'http://localhost:3000/movies?title=Inception&date_gte=2010-07-16&date_lt=2010-07-18' \
  -H 'Accept: application/json'