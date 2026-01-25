import asynchandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierrors.js";
import { Admin } from "../models/admin.model.js";
import {User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async (userId) => {
  try {
  let user= await User.findById(userId);
  if (!user) {
    user = await Admin.findById(userId);
  }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh tocken "
    );
  }
};
const register = asynchandler(async (req, res) => {
  const {  username, password } = req.body;
  if (
    [username, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All the fields are required ");
  }
  const userexisted = await Admin.findOne({
   username,
  });
  if (userexisted) {
    throw new ApiError(409, "The user  with email or username already exists");
  }
  const newUser = await Admin.create({
   username,
    password,
   
  });

  const CreatedUser = await Admin.findById(newUser._id).select(
    "-password -refreshTocken"
  );
  if (!CreatedUser) {
    throw new ApiError(500, "something went wrong while registring the user ");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, CreatedUser, "user registerd successfully "));
});
const loginUser = asynchandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Username and password are required");
  }
  let user = await User.findOne({ username });
  let role = "USER";
  if (!user) {
    user = await Admin.findOne({ username });
    role = "ADMIN";
  }
  if (!user) {
    throw new ApiError(401, "Invalid username or password");
  }
  const isPasswordValid = await user.ispasswordcorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid username or password");
  }
  const { accessToken, refreshToken } =
    await generateAccessandRefreshToken(user._id);
  const loggedInUser =
    role === "ADMIN"
      ? await Admin.findById(user._id).select("-password -refreshToken")
      : await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser },
        "User logged in successfully"
      )
    );
});
const logoutUser = asynchandler(async (req, res) => {
  const role = req.user.role;
  let user;
console.log(req.user._id)
  if (role === "HOSPITAL_ADMIN") {
    user = await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { refreshToken: 1 } },
      { new: true }
    );
  } else {
    user = await Admin.findByIdAndUpdate(
      req.user._id,
      { $unset: { refreshToken: 1 } },
      { new: true }
    );
  }
console.log(user)

  if (!user) {
    throw new ApiError(401, "Invalid user");
  }
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});
const refreshAccessToken = asynchandler(async (req, res) => {
  try {
    const incommingRefreshToken =
      req.cookie.refreshToken || req.body.refreshToken;
    if (!incommingRefreshToken) {
      throw new ApiError(401, "unauthorized user ");
    }
    const verifyRjwt = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await Admin.findById(verifyRjwt?._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh Token ");
    }
    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh Token is not found ");
    }
    const { accessToken, refreshToken } = await generateAccessandRefreshToken(
      user._id
    );
    const option = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token and Refresh Token is Created Sucessfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh Token ");
  }
});
const changeOldPassword = asynchandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await Admin.findById(req.user?._id);
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
const authMe = asynchandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: req.user._id,
        role: req.user.role,
      },
      "Authenticated user"
    )
  );
});

export {
  register,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeOldPassword,
  authMe,
};
