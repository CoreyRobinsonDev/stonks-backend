import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const router = express.Router();
dotenv.config();
const dbPromise = open({
  filename: "./database/finance.db",
  driver: sqlite3.Database
});
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
  const { ticker, date } = req.body;
  
  const close = await axios.get(`${baseUrl}v1/open-close/${ticker}/${date}?apiKey=${apiKey}`)
    .then((response) => response.data.close)
    .catch(() => null)
  let tickerDetails = await axios.get(`${baseUrl}v3/reference/tickers/${ticker}?apiKey=${apiKey}`)
    .then((response) => response.data)
    .catch(() => null)
  const tickerNews = await axios.get(`${baseUrl}v2/reference/news?ticker=${ticker}&apiKey=${apiKey}`)
    .then((response) => response.data)
    .catch(() => null)
  if (!tickerDetails || !tickerNews) return res.status(400).send("Invalid Ticker");
  if (tickerDetails.results.branding?.icon_url) tickerDetails.results.branding.icon_url += `?apiKey=${apiKey}`;

  tickerDetails = {...tickerDetails, close}

  res.send({ tickerDetails, tickerNews });
})

router.post("/buy", async (req, res) => {
  const { user_id, ticker } = req.body;
})