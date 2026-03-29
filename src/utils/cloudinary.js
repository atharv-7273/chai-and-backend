import {v2 as cloudinary } from "cloudinary"
import { response } from "express";
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudiary = async (localFilePath) => {
  try {
    if(!localFilePath) return null
    //upload the file on cloudnary
    const responce = await cloudinary.uploader.upload(localFilePath{
      resource_type:"auto"
    })
    //file uploaded successfully
    console.log("file is Upload on cloudinary",response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath)  //removes the locally saved temmporary file as the upload operation gor failed
    return null;
    
  }
  
}

export {uploadOnCloudiary}