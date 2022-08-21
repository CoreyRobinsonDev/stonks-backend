import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import cookieParser  from "cookie-parser";
import bcypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
// import axios from "axios";

import passportConfig from "./util/passportConfig";
import { router as userRouter } from "./routes/user";
import { router as stocksRouter } from "./routes/stocks";
import { router as guestRouter } from "./routes/guest";


dotenv.config();
const app = express();
const PORT = process.env.PORT || "3001";
const dbPromise = open({
  filename: "./database/finance.db",
  driver: sqlite3.Database
});


// (async () => {
//   const apiKey = process.env.API_KEY;
//   const db = await dbPromise;
//   const stocks = await axios.get(`https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/2020-10-14?apiKey=${apiKey}`).then((res) => res.data.results)
  
//   for (const stock of stocks) {
//     stock.c = stock.c ?? 0;
//     stock.h = stock.h ?? 0;
//     stock.l = stock.l ?? 0;
//     stock.n = stock.n ?? 0;
//     stock.o = stock.o ?? 0;
//     stock.v = stock.v ?? 0;
//     stock.vw = stock.vw ?? 0;
//    await db.run("INSERT INTO stocks (symbol, close, high, low, num_transactions, open, volume, volume_weighted_price) VALUES(?,?,?,?,?,?,?,?)", [stock.T, stock.c, stock.h, stock.l, stock.n, stock.o, stock.v, stock.vw])
//   }
//   console.log("done")
// })()

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
app.use("/guest", guestRouter);
  

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})