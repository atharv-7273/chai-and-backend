import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken";

// ================= TOKEN GENERATION =================
// generate access and refresh tokens for user
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    // generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};


// ================= REGISTER =================
const registerUser = asyncHandler(async (req, res) => {

  // get user details from frontend
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  const { fullName, email, username, password } = req.body;

  // validation - check fields are not empty
  if (
    [fullName, email, username, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists (username or email)
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // check for images (avatar, coverImage)
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  let avatar = null;
  let coverImage = null;

  // upload avatar to Cloudinary
  if (avatarLocalPath) {
    avatar = await uploadOnCloudinary(avatarLocalPath);
  }

  // upload cover image to Cloudinary
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  // ❌ OLD (optional avatar validation removed)
  // if (!avatar) {
  //   throw new ApiError(400,"Avatar file is required")
  // }

  // create user object - save in DB
  const user = await User.create({
    fullName,
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  });

  // remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  // return response
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  );
});


// ================= LOGIN =================
const loginUser = asyncHandler(async (req, res) => {

  // req body -> data from frontend
  const { email, username, password } = req.body;

  // username or email required
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // find the user in DB
  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // generate access and refresh tokens
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  // remove sensitive fields
  const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken");

  // cookie options
  const options = {
    httpOnly: true,
    secure: true
  };

  // send cookies and response
  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in Successfully"
      )
    );
});


// ================= LOGOUT =================
const logoutUser = asyncHandler(async (req, res) => {

  // remove refresh token from DB
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined }
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  // clear cookies and send response
  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});


const refreshAccessToken = asyncHandler(async(req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 

  if(incomingRefreshToken){
    throw new ApiError(401,"unauthorised request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken) {
     throw new ApiError(401,"Refresh Token is expired or used")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
    const {accessToken , newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken ,options)
    .json(
      new ApiResponse(
        200,
      {accessToken,refreshToken:newRefreshToken},
      "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
    
  }


})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
};