import express from "express";
import sqlite3 from "sqlite3";
import axios from "axios";
import dotenv from "dotenv";
import { open } from "sqlite";
dotenv.config();

const apiKey = process.env.API_KEY;
const baseUrl = "https://api.polygon.io/";
export const router = express.Router();
const dbPromise = open({
  filename: "./database/finance.db",
  driver: sqlite3.Database
});

router.get("/getLoggedUser", (req, res) => {
  res.send(req.user);
})

router.post("/getPortfolio", async (req, res) => {
  const { id } = req.body;
  const currentDate = new Date().toISOString().slice(0, 10).split("-");
  const yesterday = [...currentDate];
  yesterday[2] = (+yesterday[2] - 3).toString();
  yesterday[1] = (+yesterday[1] - 1).toString();
  const yesterdayDate = new Date(+yesterday[0], +yesterday[1], +yesterday[2]).toISOString().slice(0, 10);
  const db = await dbPromise;

  const portfolio = await db.all("SELECT symbol, shares FROM portfolio WHERE user_id = ?", [id]);

  for (const obj of portfolio) {
    const price = await axios.get(`${baseUrl}v1/open-close/${obj?.symbol}/${yesterdayDate}?apiKey=${apiKey}`)
      .then((response) => response.data.close)
      .catch(() => null)
    obj.price = price;
  }
  console.log(portfolio)
  res.send(portfolio);
})