// ✅ IMPORTS (ONLY ONCE)
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import userRouter from "./routes/user.routes.js";
import cookieParser from "cookie-parser";

// ✅ CONFIG
dotenv.config();

console.log("ENV CHECK:", process.env.MONGODB_URI);

// ✅ APP INIT
const app = express();

// ✅ MIDDLEWARES
app.use(express.json());
app.use(cookieParser());

// ✅ ROUTES
app.use("/api/v1/users", userRouter);

// ✅ DB + SERVER
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed !!!", err);
  });


// ❌ OLD CODE (COMMENTED)
// import express from "express";
// const app = express()
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI} /${DB_NAME}`)
//     app.on("error",() => {
//       console.log("ERRR:",error);
//       throw error
//     })
//     app.listen(process.env.PORT,() => {
//       console.log(`App is listening on port ${process.env.PORT}`)
//     })
//   } catch(error){
//     console.log("ERROR: ",error)
//     throw err
//   }
// })()