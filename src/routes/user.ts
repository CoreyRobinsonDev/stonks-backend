import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const router = express.Router();
const dbPromise = open({
    filename: "./database/finance.db",
    driver: sqlite3.Database
});

router.get("/getLoggedUser", (req, res) => {
  res.send(req.user);
})