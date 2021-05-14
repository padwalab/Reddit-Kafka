import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const server = process.env.DB_HOST + ":" + process.env.DB_PORT;
const database = process.env.DB_DB;
class Database {
  constructor() {
    this._connect();
  }
  _connect() {
    mongoose
      .connect("mongodb+srv://reddit:redditdb@cluster0.oihwj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      })
      .then(() => {
        console.log("Database connection successful");
      })
      .catch((error) => {
        console.log(error);
        console.log("Database connection failed ");
      });
    mongoose.set("toJSON", {
      virtuals: true,
      versionKey: false,
      transform: (doc, converted) => {
        delete converted._id;
      },
    });
  }
}

//module.exports = new Database();
export default Database;
