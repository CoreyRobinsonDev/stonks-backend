import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const router = express.Router();

const dbPromise = open({
  filename: "./database/finance.db",
  driver: sqlite3.Database
});

router.post("/reset", async (req, res) => {
  const db = await dbPromise;
  const idObj = await db.get("SELECT id FROM users WHERE username LIKE 'Guest%'");
  const id = idObj?.id;
  if (!id) return;

  db.run("DELETE FROM portfolio WHERE user_id = ?", [id]);
  db.run("DELETE FROM history WHERE user_id = ?", [id]);
  db.run("DELETE FROM users WHERE id = ?", [id]);
})
