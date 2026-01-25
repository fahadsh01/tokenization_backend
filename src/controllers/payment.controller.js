import asynchandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { fileuploader } from "../utils/cloudinary.js";
import { Payment } from "../models/payment.model.js";
const createPayment = asynchandler(async (req, res) => {
      const tenantid = req.user.tenantId;
if (!tenantid) {
        throw new ApiError(401, "unauthorized");
}
console.log("the id",tenantid)
    const { title,amount , bank } = req.body;
  if (
    [title,amount , bank].some(
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
   tenantid, title,amount , bank,
    screenshot: Image.url,
    publicid: Image.public_id,
  });
  console.log("here is the public id :", Image.public_id);
  if (!Payment) {
    throw new ApiError(500, " Payment verification request failed. ");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment verification request sent sucussfully"));
});
export {
  createPayment,
};