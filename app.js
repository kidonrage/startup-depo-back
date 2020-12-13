const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios")
const dotenv = require('dotenv');

dotenv.config();

const port = process.env.PORT || 5000;

const app = express();

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let interval;

io.on("connection", (socket) => {
  console.log("New client connected");
  if (interval) {
    clearInterval(interval);
  }
  getApiAndEmit(socket)
  interval = setInterval(() => getApiAndEmit(socket), 60000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

const getApiAndEmit = async (socket) => {
  const placeDataResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJ85lN_Vzo-l4R8wHJ6xQHLGI&fields=reviews,url&key=${process.env.GOOGLE_MAPS_API_KEY}&language=ru`)
  
  console.log(placeDataResponse.data)

  const placeReviews = placeDataResponse.data.result.reviews
  const placeUrl = placeDataResponse.data.result.url

  const placeSortedReviews = placeReviews.sort((a,b) => (a.time < b.time) ? 1 : ((b.time < a.time) ? -1 : 0))

  console.log(placeDataResponse.data, process.env.GOOGLE_MAPS_API_KEY)

  socket.emit("reviews", {
    reviews: placeSortedReviews.filter(review => review.text !== ''),
    url: placeUrl
  });
};

server.listen(port, () => console.log(`Listening on port ${port}`));