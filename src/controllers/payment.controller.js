import asynchandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { fileuploader } from "../utils/cloudinary.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { Accounts } from "../models/accounts.model.js";
import mongoose from "mongoose";
const createPayment = asynchandler(async (req, res) => {
      const tenantid = req.user.tenantId;
if (!tenantid) {
        throw new ApiError(401, "unauthorized");
}
console.log("the id",tenantid)
    const { title,amount,bank,planType} = req.body;
  if (
    [title,amount,bank,planType].some(
      (field) => !field || field.toString().trim() === ""
    )
  ) {
    throw new ApiError(400, "All the fields are required ");
  }
const ImageLocalpath = req.file?.path;
  console.log("the id",ImageLocalpath)

  if (!ImageLocalpath) {
    throw new ApiError(400, "path for  image is required ");
  }
  const Image = await fileuploader(ImageLocalpath);
console.log("the Image",Image)
  if (!Image) {
    throw new ApiError(500, "Image is not uploaded ");
  }
  const  payment= await Payment.create({
   tenantid, title,amount , bank,planType,
    screenshot: Image.url,
    publicid: Image.public_id,
  });
  console.log("here is the public id :", Image.public_id);
  if (!Payment) {
    throw new ApiError(500, " Payment verification request failed. ");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Payment verification request sent sucussfully"));
});
const getPayments = asynchandler(async (req, res) => {
  const { status  } = req.query;
 if (!status) {
    throw new ApiError(400, "status is required");
 }
  const role=req.user.role
 if (!role ==="SUPER_ADMIN" ) {
  throw new ApiError(401, "unauthorized");
 }
  const Payments = await Payment.find({status});
  console.log(Payments)
  if (!Payments|| Payments.length === 0) {
 return res
    .status(200)
    .json(
      new ApiResponse(200, Payments, `No ${status} Payments `)
    );}
    console.log(Payments)
  return res
    .status(200)
    .json(
      new ApiResponse(200, Payments, `sucussfully ${status} Payments requests`)
    );
});
const PaymentApproval = asynchandler(async (req, res) => {
  const { role } = req.user;
  if (role !== "SUPER_ADMIN") {
    throw new ApiError(403, "Forbidden");
  }
  const { price, tenantid, planType, expiryDate } = req.body;
  if (!price || !tenantid || !planType || !expiryDate) {
    throw new ApiError(400, "All fields are required");
  }

  if (isNaN(new Date(expiryDate))) {
    throw new ApiError(400, "Invalid expiry date");
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedUser = await User.findOneAndUpdate(
      { tenantid },
      {
        planType,
        price,
        expiryDate,
        status: "Active",
      },
      { new: true, session }
    );

    if (!updatedUser) {
      throw new ApiError(404, "Tenant not found");
    }

    // Approve only a pending payment
    const payment = await Payment.findOneAndUpdate(
      { tenantid, status: "PENDING" },
      { status: "APPROVED" },
      { new: true, session }
    );

    if (!payment) {
      throw new ApiError(404, "No pending payment found");
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResponse(200, { user: updatedUser }, "Payment approved successfully")
    );

  } catch (error) {
    // Rollback on any failure
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
const RejectPayment = asynchandler(async (req, res) => {
  const { role } = req.user;
  if (role !== "SUPER_ADMIN") {
    throw new ApiError(401, "Forbidden");
  }
  const {tenantid } = req.body;
  if (!tenantid) {
    throw new ApiError(400, "All fields are required");
  }
  const payment = await Payment.findOneAndUpdate(
      { tenantid, status: "PENDING" },
      { status: "SUSPENDED" },
      { new: true,}
    );
  if (!payment) {
        throw new ApiError(400, "request failed");

  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, ` sucussfull `)
    );
});
const getTnantPayments = asynchandler(async (req, res) => {
  const tenantid = req.user.tenantId;
if (!tenantid) {
        throw new ApiError(401, "unauthorized");
}
console.log("the id",tenantid)
  const Payments = await Payment.find({tenantid});
  if (!Payments|| Payments.length === 0) {
 return res
    .status(200)
    .json(
      new ApiResponse(200, Payments, `No Payments request`)
    );}
  return res
    .status(200)
    .json(
      new ApiResponse(200, Payments, `sucussfully fetch Payments request`)
    );
});
const deleteProduct = asynchandler(async (req, res) => {
 const role=req.user.role
 if (!role ==="SUPER_ADMIN" ){
  throw new ApiError(401, "unauthorized");
 }  const { publicid } = req.body;
  const imgdel = await deleteFile(publicid);
  if (!imgdel) {
    throw new ApiError(404, "image deletion is faild");
  }
  const deleted = await Product.findByIdAndDelete(id);
  if (deleted === null) {
    throw new ApiError(404, "Product not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "product deleted sucessfully"));
});
const addAccount = asynchandler(async (req, res) => {
      const role = req.user.role;
  if (role !== "SUPER_ADMIN") {
    throw new ApiError(401, "Unauthorized");
  }
    const {title,accountNumber,bank,} = req.body;
    console.log(title,accountNumber,bank)
  if (
    [title,accountNumber,bank].some(
      (field) => !field || field.toString().trim() === ""
    )
  ) {
    throw new ApiError(400, "All the fields are required ");
  }
  const  account= await Accounts.create({
title,accountNumber,bank    
  });
  if (!account) {
    throw new ApiError(500, " account addition  failed. ");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, account, "account addition sucussfull"));
});
const getAccount = asynchandler(async (req, res) => {
    const tenantid = req.user.tenantId;
    const role =req.user.role
if (!tenantid && role !== "SUPER_ADMIN") {
    throw new ApiError(401, "unauthorized");
}       
 const accounts = await Accounts.find();
  if (!accounts|| accounts.length === 0) {
 return res
    .status(200)
    .json(
      new ApiResponse(200,  accounts, `No accounts `)
    );}
  return res
    .status(200)
    .json(
      new ApiResponse(200,  accounts, ` accounts fetched sucussfully `)
    );
});
const deleteAccount = asynchandler(async (req, res) => {
  const { id } = req.params;
  const role = req.user.role;
  if (role !== "SUPER_ADMIN") {
    throw new ApiError(401, "Unauthorized");
  }
  const deleted = await Accounts.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Account not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Account deleted successfully"));
});

export {
   getPayments,createPayment,PaymentApproval,getTnantPayments,addAccount,getAccount,deleteAccount,RejectPayment
};
