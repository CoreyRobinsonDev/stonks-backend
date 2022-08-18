import express from "express";

export const router = express.Router();

router.get("/getLoggedUser", (req, res) => {
  res.send(req.user);
})