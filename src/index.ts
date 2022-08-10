import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import cookieParser  from "cookie-parser";
import bcypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";

import passportConfig from "./util/passportConfig";
import { router as userRouter } from "./routes/user";
import { router as stocksRouter } from "./routes/stock";

dotenv.config();
const app = express();
const PORT = process.env.PORT || "3001";
const dbPromise = open({
    filename: "./database/finance.db",
    driver: sqlite3.Database
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
  secret: "secretcode",
  resave: true,
  saveUninitialized: true
}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);


// Routes
app.post("/register", async (req, res) => {
  const { password, confirmPassword } = req.body;
  const username = req.body.username.trim();
  const db = await dbPromise;
  const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);

  if (user) return res.status(409).send("Username Already Exists");
  if (!username || !password || typeof username !== "string" || typeof password !== "string") return res.status(401).send("Improper Values")
  if (password !== confirmPassword) return res.status(401).send("Passwords Don't Match");
  const hashedPassword = await bcypt.hash(password, 10);
  
  await db.run("INSERT INTO users (username, password, balance) VALUES (?, ?, ?)", [username, hashedPassword, 0]);

  res.status(201).send("Account Created");
  db.close();
})


app.post("/login", passport.authenticate("local"), (req, res) => {
  res.status(200).send(req.user);
})


app.post("/logout", (req, res) => {
  req.logout(() => { });
  res.status(200).send("Success")
})


app.use("/user", userRouter);
app.use("/stocks", stocksRouter);
  

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})