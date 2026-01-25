import asynchandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierrors.js";
import { Superadmin } from "../models/superadmin.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
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
  const { fullname, email, password } = req.body;
  if ([fullname, email, password].some((fields) => fields?.trim() === "")) {
    throw new ApiError(400, "All the fields are required ");
  }
  const userexisted = await Superadmin.findOne({
    email,
  });
  if (userexisted) {
    throw new ApiError(409, "The user  with email or username already exists");
  }
  const newUser = await Superadmin.create({
    fullname,
    password,
    email,
  });

  const CreatedUser = await Superadmin.findById(newUser._id).select(
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
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  const isUser = await Superadmin.findOne({
    email,
  });
  if (!isUser) {
    throw new ApiError(404, "User do not exist ");
  }
  const isUserValid = await isUser.ispasswordcorrect(password);
  if (!isUserValid) {
    throw new ApiError(401, "password is incorrect");
  }
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    isUser._id
  );
  const logInUser = await Superadmin.findById(isUser._id).select(
    "-password -refreshToken"
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
        {
          user: logInUser,
        },
        "user log in sucessfully "
      )
    );
});
const logoutUser = asynchandler(async (req, res) => {
  Superadmin.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "user log out"));
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

    const user = await Superadmin.findById(verifyRjwt?._id);
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
  const user = await Superadmin.findById(req.user?._id);
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

export {
  register,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeOldPassword,
};
