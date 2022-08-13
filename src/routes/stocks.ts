import express from "express";
import axios from "axios";
import dotenv from "dotenv";

export const router = express.Router();
dotenv.config();
const apiKey = process.env.API_KEY;
const baseUrl = "https://api.polygon.io/";

router.post("/groupedDailyBars", (req, res) => {
  const { date, isAdjusted, includeOTC } = req.body;
  const apiCall = `${baseUrl}v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=${isAdjusted}&include_otc=${includeOTC}&apiKey=${apiKey}`;

  axios.get(apiCall)
    .then((response) => res.send(response.data))
    .catch((err) => res.status(400).send(err))
})

router.post("/tickerDetails", async (req, res) => {
  const { ticker } = req.body;
  
  const tickerDetails = await axios.get(`${baseUrl}v3/reference/tickers/${ticker}?apiKey=${apiKey}`).then((response) => response.data);
  const tickerNews = await axios.get(`${baseUrl}v2/reference/news?ticker=${ticker}&apiKey=${apiKey}`).then((response) => response.data);
  res.send({ tickerDetails, tickerNews });
})