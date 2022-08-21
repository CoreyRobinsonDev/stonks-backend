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
  const db = await dbPromise;

  const portfolio = await db.all("SELECT symbol, shares FROM portfolio WHERE user_id = ?", [id]);

  for (const obj of portfolio) {
    const closeObj = await db.get("SELECT close FROM stocks WHERE symbol = ?", [obj.symbol]); 
    const price = closeObj.close;
    obj.price = price;
  }
  console.log(portfolio)
  res.send(portfolio);
})