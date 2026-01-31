import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    hospitalname:{  type: String,
      default: null},
    tenantid: {
      type: String,
      default: null,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["HOSPITAL_ADMIN"],
      default: "HOSPITAL_ADMIN",
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    contact: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: [true, "password is required"],
    },

    refreshToken: {
      type: String,
    },
 whatsappEnabled: {
  type: Boolean,
  default: false,
},

whatsappConfig: {
  provider: {
    type: String,
    enum: ["twilio"],
    default: "twilio",
  },

  twilioSid: {
    type: String,
    required: function () {
      return this.whatsappEnabled === true;
    },
  },

  twilioToken: {
    type: String,
    select: false, // never return in queries
    required: function () {
      return this.whatsappEnabled === true;
    },
  },

  whatsappSender: {
    type: String,
    required: function () {
      return this.whatsappEnabled === true;
    },
  },
},

    planType: {
      type: String,
      enum: ["Trial","Monthly", "Yearly", "One_Time"],
      required: true,
    },
     expiryDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "EXPIRED", "SUSPENDED"],
      default: "Active",
    },
     subscriptionPrice: {
      type: String,
      required: true,
    },

    timezone: {
      type: String,
      default: "Asia/Karachi",
    },
  },

  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.ispasswordcorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      role: this.role,
      tenantId: this.tenantid,
       status: this.status
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
export const User = mongoose.model("User", userSchema);
