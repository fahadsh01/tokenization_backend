import asynchandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierrors.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const register = asynchandler(async (req, res) => {
  // Only SUPER_ADMIN can create tenants
  if (req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "You are not allowed to create a tenant");
  }
 console.log(req.user.role)
  const {
    fullname,
    hospitalname,
    tenantid,
    contact,
    email,
    username,
    password,
    whatsappEnabled,
    whatsappConfig,
    planType,
    subscriptionPrice,
    expiryDate,
    status,
  } = req.body;
console.log( whatsappEnabled,
    whatsappConfig)
  // Validate required fields
  if (
    [fullname, hospitalname, tenantid, contact, username, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All required fields must be filled");
  }

  // Check if user already exists
  const userExists = await User.findOne({username });

  if (userExists) {
    throw new ApiError(
      409,
      "User with this username already exists"
    );
  }

  // Create user
  const newUser = await User.create({
    fullname,
    hospitalname,
    tenantid,
    contact,
    email,
    username,
    password,
    role:"HOSPITAL_ADMIN",
   planType,
     subscriptionPrice,
    expiryDate,
    status,
    whatsappEnabled,
    whatsappConfig: whatsappEnabled ? whatsappConfig : null,
    timezone:"Asia/Karachi"
  });

  // Remove sensitive fields
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while registering the user"
    );
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      createdUser,
      "Hospital tenant registered successfully"
    )
  );
});
const tenants= asynchandler(async (req, res) => {
    if (req.user.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "You are not allowed to get tenants");
  }
const tenants  = await User.find().select("-password -refreshToken");
if (!tenants.length) {
    return res.status(200).json(
      new ApiResponse(200, [], "No tenants created so far")
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200,tenants, "Fetched tenants successfully")
    );
});
const changeOldPassword = asynchandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(400, "user Not found ");
  }
  const isMatch = await user.ispasswordcorrect(oldPassword);
  if (!isMatch) {
    throw new ApiError(401, "invalid Old Password  ");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password is updated sucussfully"));
});
const  getUserProfile= asynchandler(async (req, res) => {
  const id =req.user._id
  console.log()
  if (!id) {
    throw new ApiError(401, "Unauthorized");
  }
 const user=await User.findById(id).select("hospitalname tenantid planType expiryDate status")
 
  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "Authenticated user"
    )
  );
});

export {
  register,
  tenants,
  changeOldPassword,getUserProfile
};
