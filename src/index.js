import dotenv from "dotenv";
import connectDB from "./db/index.js";
// import express from "express"; 
import userRouter from "./routes/user.routes.js";

dotenv.config();

console.log("ENV CHECK:", process.env.MONGODB_URI);


import express from "express";

const app = express();

app.use(express.json());


app.use("/api/v1/users", userRouter);

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed !!!", err);
  });








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