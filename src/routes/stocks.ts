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
  const currentDate = new Date().toISOString().slice(0, 10).split("-");
  const yesterday = [...currentDate];
  yesterday[2] = (+yesterday[2] - 2).toString();
  yesterday[1] = (+yesterday[1] - 1).toString();
  const yesterdayDate = new Date(+yesterday[0], +yesterday[1], +yesterday[2]).toISOString().slice(0, 10);
  
  const { user_id, symbol, num_shares } = req.body;
  const transaction_type = "BUY";
  const time = new Date().getTime();
  const price = await axios.get(`${baseUrl}v1/open-close/${symbol}/${yesterdayDate}?apiKey=${apiKey}`)
    .then((response) => response.data.close)
    .catch(() => null)
  if (!price) return res.status(500).send("Error during price lookup");
  const company_name = await axios.get(`${baseUrl}v3/reference/tickers/${symbol}?apiKey=${apiKey}`)
    .then((response) => response.data.results.name)
    .catch(() => null)
  if (!company_name) return res.status(500).send("Error during company name lookup");
  const db = await dbPromise;

  db.run("INSERT INTO history (user_id, symbol, price, num_shares, transaction_type, time, company_name) VALUES (?, ?, ?, ?, ?, ?, ?)", [user_id, symbol, price, num_shares, transaction_type, time, company_name])

  db.close();
})