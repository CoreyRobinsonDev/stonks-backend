import express from "express";
import axios from "axios";
import dotenv from "dotenv";

export const router = express.Router();
dotenv.config();
const apiKey = process.env.API_KEY;
const baseUrl = "https://api.polygon.io/v2";

router.post("/groupedDailyBars", (req, res) => {
  const { date, isAdjusted, includeOTC } = req.body;
  const apiCall = `${baseUrl}/aggs/grouped/locale/us/market/stocks/${date}?adjusted=${isAdjusted}&include_otc=${includeOTC}&apiKey=${apiKey}`;

  console.log(apiCall)
  axios.get(apiCall)
    .then((response) => res.send(response.data))
    .catch((err) => res.status(400).send(err))
})