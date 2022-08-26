import express from "express";
import axios from "axios";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config();
export const router = express.Router();

const apiKey = process.env.API_KEY;
const baseUrl = "http://api.polygon.io/";
const dbPromise = open({
  filename: "./database/finance.db",
  driver: sqlite3.Database
});



router.get("/groupedDailyBars", async (req, res) => {
  const db = await dbPromise;
  const stocks = await db.all("SELECT * FROM stocks");
  res.send(stocks);
})

router.post("/tickerDetails", async (req, res) => {
  const { ticker } = req.body;
  const db = await dbPromise;
  
  const closeObj = await db.get("SELECT close FROM stocks WHERE symbol = ?", [ticker]);
  const close = closeObj?.close;

  let tickerDetails = await axios.get(`${baseUrl}v3/reference/tickers/${ticker}?apiKey=${apiKey}`)
    .then((response) => response.data)
    .catch(() => null)
  const tickerNews = await axios.get(`${baseUrl}v2/reference/news?ticker=${ticker}&limit=100&apiKey=${apiKey}`)
    .then((response) => response.data)
    .catch(() => null)
  if (!tickerDetails || !tickerNews) return res.status(400).send("Invalid Ticker");
  if (tickerDetails.results.branding?.icon_url) tickerDetails.results.branding.icon_url += `?apiKey=${apiKey}`;

  tickerDetails = {...tickerDetails, close}

  res.send({ tickerDetails, tickerNews });
})


router.post("/buy", async (req, res) => {
  const db = await dbPromise;
  const { user_id, symbol } = req.body;
  const shares = parseInt(req.body?.num_shares);
  const transaction_type = "BUY";
  const time = new Date().getTime();
  const closeObj = await db.get("SELECT close FROM stocks WHERE symbol = ?", [symbol]);
  const price = closeObj?.close;

  const balanceObj = await db.get("SELECT balance FROM users WHERE id = ?", [user_id]);
  const balance = balanceObj.balance;

  if (!symbol || !price) return res.status(400).send("Invalid ticker symbol");
  if (!shares) return res.status(400).send("Shares must be in positive integer amounts");
  if (price * shares > balance) return res.status(400).send("Insufficient funds");

  const remainingBalance = balance - (price * shares);
  await db.run("UPDATE users SET balance = ? WHERE id = ?", [remainingBalance, user_id])
  await db.run("INSERT INTO history (user_id, symbol, price, num_shares, transaction_type, time) VALUES (?, ?, ?, ?, ?, ?)", [user_id, symbol, price, shares, transaction_type, time]);

  const ownedShares = await db.get("SELECT shares FROM portfolio WHERE user_id = ? AND symbol = ?", [user_id, symbol]);
  
  if (ownedShares === undefined) {
    await db.run("INSERT INTO portfolio (user_id, symbol, shares) VALUES (?, ?, ?)", [user_id, symbol, shares])
  } else {
    await db.run("UPDATE portfolio SET shares = ? WHERE user_id = ? and symbol = ?", [ownedShares.shares + shares, user_id, symbol])
  }

  res.send({
    message: `Successfully purchased ${shares} share${shares === 1 ? "" : "s"} of ${symbol} at $${price.toLocaleString("en-US")} for a total of $${(price * shares).toLocaleString("en-US")}`,
    balance: remainingBalance
  });
})

router.post("/sell", async (req, res) => {
  const { user_id, symbol } = req.body;
  const shares = parseInt(req.body.shares);
  const db = await dbPromise;

  const transaction_type = "SELL";
  const closeObj = await db.get("SELECT close FROM stocks WHERE symbol = ?", symbol);
  const price = closeObj?.close;
  const balanceObj = await db.get("SELECT balance FROM users WHERE id = ?", [user_id]);
  const balance = balanceObj?.balance;
  const portfolio = await db.all("SELECT symbol, shares FROM portfolio WHERE user_id = ?", [user_id]);
  const hasSymbol = portfolio.find(obj => obj.symbol === symbol);
  const time = new Date().getTime();
  const ownedShares = hasSymbol?.shares;

  if (!price || !symbol) return res.status(400).send("Invalid ticker symbol");
  if (!shares) return res.status(400).send("Shares must be in positive integer amounts");
  if (ownedShares < shares || !ownedShares || !hasSymbol) return res.status(400).send("Insufficient shares");

  if (ownedShares - shares === 0) {
    await db.run("DELETE FROM portfolio WHERE user_id = ? AND symbol = ?", [user_id, symbol]);
  } else {
    await db.run("UPDATE portfolio SET shares = ? WHERE user_id = ? AND symbol = ?", [(ownedShares - shares), user_id, symbol]);
  }
  await db.run("UPDATE users SET balance = ? WHERE id = ?", [(price * shares) + balance, user_id]);
 
  await db.run("INSERT INTO history (user_id, symbol, price, num_shares, transaction_type, time) VALUES (?, ?, ?, ?, ?, ?)", [user_id, symbol, price, shares, transaction_type, time]);
  
  res.send({
    message: `Successfully sold ${shares} shares of ${symbol} at $${price.toLocaleString("en-US")} per share for a total of $${(price * shares).toLocaleString("en-US")}`,
    balance: (price * shares) + balance
  })
})