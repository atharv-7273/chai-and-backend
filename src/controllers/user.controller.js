import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudiary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponce.js";

const registerUser = asyncHandler(   async (req,res) => {
   // get user details from frontend
   // validation - not empty
   //ckeak if user already exist::username , emmail

   // cheak for images and  avatar
   // upload them to  cloudnary , avatar
   //create user object - create entry in DB
   //  remove password and refresh token field from responce 
   // ckeck for user creation  
   // return res

   const {fullName, email, username, password } = req.body
   console.log("email:", email);

  if (
    [fullName, email, username,password].some((field) => field?.trim() ==="")
  ) {
    throw new ApiError(400,"All fields are require")
  }

 const existedUser = User.findOne({
    $or: [{username}, {email}]
  })

  if(existedUser){
    throw new ApiError(409,"User with email or  username is already exists")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if(!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is required")
  }

  const avatar = await uploadOnCloudiary(avatarLocalPath)
  const coverImage = await uploadOnCloudiary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400,"Avatar file is required")
  }

  const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowercase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser) {
    throw new ApiError(500,"Somthing went wrong while regristring the user")
  }

  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully")
  )


} )

export {registerUser}