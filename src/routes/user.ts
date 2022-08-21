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

  const colors = ["#26727E", "#E06D10", "#398557","#5062AA","#DA304C","#163D57","#8E4C9E","#A24F0B","#276D9B","#2D1832","#0F2417","#341A04","#711423"]
  const portfolio = await db.all("SELECT symbol, shares FROM portfolio WHERE user_id = ?", [id]);

  for (let i = 0; i < portfolio.length; i++) {
    const closeObj = await db.get("SELECT close FROM stocks WHERE symbol = ?", [portfolio[i].symbol]); 
    const price = closeObj.close;
    portfolio[i].price = price;
    portfolio[i].color = colors[i % colors.length];
  }
  console.log(portfolio)
  res.send(portfolio);
})