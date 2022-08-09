import bcrypt from "bcrypt";
import { PassportStatic } from "passport";
import local from "passport-local";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
const localStrategy = local.Strategy;

const passportConfig = async (passport: PassportStatic) => {
  const dbPromise = open({
      filename: "./database/finance.db",
      driver: sqlite3.Database
  });
  const db = await dbPromise;
  passport.use(new localStrategy(async (username, password, done) => {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [username.trim()]);
    if (!user) return done(null, false);

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) return done(err);

      if (result === true) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
  }))

  passport.serializeUser((user:any, done) => {
    process.nextTick(() => {
      done(null, user.id);
    })
  })

  passport.deserializeUser((id, done) => {
    process.nextTick(async () => {
      const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
      done(null, user);
    })
  });
  await db.close();
}
export default passportConfig;