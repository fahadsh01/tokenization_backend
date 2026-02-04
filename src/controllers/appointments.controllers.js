import asynchandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Appointment } from "../models/createappointment.model.js";
import { Counter } from "../models/livecounter.model.js";
import { generateTenantLink } from "../utils/generateTenantLink.js";
import { User } from "../models/user.model.js";
import { io } from "../index.js";
import payment from "../Routes/payments.routes .js";
const createappointment= asynchandler(async(req,res)=>{
    const { patientName, whatsapp,amount,time } = req.body;
    const tenant_id = req.user.tenantid;
    if (!patientName || !whatsapp) {
      return res
        .status(400)
        .json({ message: "Patient name and WhatsApp required" });
    }
  if (!tenant_id ) {
    throw new ApiError(401, "You are not allowed to create a Appionment");
  }
const now = new Date();

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const today = formatter.format(now); // YYYY-MM-DD
    const counter = await Counter.findOneAndUpdate(
      { tenant_id, date: today },
      { $inc: { currentToken: 1 } },
      { new: true, upsert: true }
    );
    const tokenNumber = counter.currentToken;
  const appointmentData = {
  tenant_id,
  patientName,
  whatsapp,
  tokenNumber,
  appointmentDatePK: today,
  status: "WAITING",
};

if (time) {
  appointmentData.time = time;
}


if (amount) {
  appointmentData.payment = {
    amount: amount,
    status: "PAID", 
    paidAt: today,
  };
}
const appointment = await Appointment.create(appointmentData);
    const link = generateTenantLink(tenant_id);


const messageu = `🌸 السلام علیکم ${patientName}،

آپ کا اپائنٹمنٹ ٹوکن کامیابی سے جاری ہو گیا ہے۔
🔹 ٹوکن نمبر: ${tokenNumber}
🔹 وقت: ${time}
🔹 لائیو ٹوکن اسٹیٹس دیکھنے کے لیے:
${link}

⚠️ کلینک آنے سے پہلے لائیو ٹوکن اسٹیٹس ضرور چیک کریں۔
✅ جب آپ کا ٹوکن نمبر قریب ہو، اسی وقت آئیں تاکہ 
                  ہسپتال میں انتظار نہ کرنا پڑے۔

شکریہ،
Dr. ${req.user.fullname}`;

const messagee = ` Assalam-o-Alaikum ${patientName},

Your appointment token has been generated.
🔹 Token Number: ${tokenNumber}
🔹Time: ${time}
🔹 Live token status:
${link}

⚠️ Please check the live token status before coming.
✅ Come when your token number is near, 
   so you don’t have to wait at the clinic.

Thank you,
Dr. ${req.user.fullname}`;

const message = req.user.waplang === "EN" ? messagee : messageu;



  const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  const desktopUrl = `whatsapp://send?phone=${whatsapp}&text=${encodeURIComponent(message)}`;

     return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {
        appointment,
        whatsappUrl,
        desktopUrl,
      },
      "Appointment created successfully"
    )
  );

})
const getAppointment = asynchandler(async (req, res) => {
  const tenant_id= req.user?.tenantId;
  const { status  } = req.query;
  if (!tenant_id) {
    throw new ApiError(401, "Unauthorized user");
  }
 const now = new Date();
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const todayPK = formatter.format(now);
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayPK = formatter.format(yesterday);

const query = { tenant_id ,appointmentDatePK: { $in: [yesterdayPK, todayPK] } };
  if (status && status !== "ALL") {
  query.status = status;
}
  const appointments = await Appointment.find(
     query
  ).sort({ appointmentDatePK: 1 , tokenNumber: 1 });
  
  if (!appointments.length) {
    return res.status(200).json(
      new ApiResponse(
        200,
        [],
        `No ${status} appointments for today `
      )
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      appointments,
      "Appointments fetched successfully"
    )
  );
});
const getAppointmentPaymentStatus = asynchandler(async (req, res) => {
  const tenant_id = req.user?.tenantId;
  const { status } = req.query;

  if (!tenant_id) {
    throw new ApiError(401, "Unauthorized user");
  }

  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayPK = formatter.format(now);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayPK = formatter.format(yesterday);

  const query = {
    tenant_id,
    appointmentDatePK: { $in: [yesterdayPK, todayPK] },
    "payment.status": status, // fixed nested field
  };

  const appointments = await Appointment.find(query).sort({ appointmentDatePK: 1, tokenNumber: 1 });

  if (!appointments.length) {
    return res.status(200).json(
      new ApiResponse(200, [], `No ${status} appointments for today`)
    );
  }

  return res.status(200).json(
    new ApiResponse(200, appointments, "Appointments fetched successfully")
  );
});
 const advanceToken = asynchandler(async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    throw new ApiError(401, "Unauthorized");
  }
  const now = new Date();
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const todayPK = formatter.format(now);
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayPK = formatter.format(yesterday);


  const currentToken = await Appointment.findOne({
    tenant_id: tenantId,
    status: "IN_PROGRESS",
    appointmentDatePK: { $in: [yesterdayPK, todayPK] }, 
  }).sort({ appointmentDatePK: 1 ,tokenNumber: 1 }).select("tokenNumber status");

    const nextToken = await Appointment.findOne({
      tenant_id: tenantId,
      status: "WAITING",
appointmentDatePK: { $in: [yesterdayPK, todayPK] },    
}).sort({appointmentDatePK: 1,tokenNumber: 1}).select("tokenNumber status");
  if (!currentToken && nextToken) {
    nextToken.status = "IN_PROGRESS";
    await nextToken.save();
    const next = await Appointment.findOne({
      tenant_id: tenantId,
      status: "WAITING",
     appointmentDatePK: { $in: [yesterdayPK, todayPK] },    
}).sort({appointmentDatePK: 1,tokenNumber: 1}).select("tokenNumber status");

    io.to(`hospital:${tenantId}`).emit("token:update", {
      currentToken:nextToken.tokenNumber?? null,
      nextToken: next?.tokenNumber || null
    });
      let state;
   if (!next) {
    state = "LAST"
   } else {
     state = "NEXT"
   }
    return res.status(200).json(
      new ApiResponse(200, {
        state,
        currentToken:nextToken.tokenNumber?? null,
        nextToken: next?.tokenNumber || null
      })
    );
  }

  if (currentToken && nextToken) {
    currentToken.status = "DONE";
    await currentToken.save();

    nextToken.status = "IN_PROGRESS";
    await nextToken.save();
    const next = await Appointment.findOne({
      tenant_id: tenantId,
      status: "WAITING",
    appointmentDatePK: { $in: [yesterdayPK, todayPK] },    
}).sort({appointmentDatePK: 1,tokenNumber: 1}).select("tokenNumber status");
    io.to(`hospital:${tenantId}`).emit("token:update", {
      currentToken:nextToken.tokenNumber?? null,
      nextToken: next?.tokenNumber || null
    });
   let state;
   if (!next) {
    state = "LAST"
   } else {
     state = "NEXT"
   }
    return res.status(200).json(
      new ApiResponse(200, {
        state,
        currentToken:nextToken.tokenNumber?? null,
        nextToken: next?.tokenNumber || null
      })
    );
  }

  if (currentToken && !nextToken) {
    currentToken.status = "DONE";
    await currentToken.save();
  
    io.to(`hospital:${tenantId}`).emit("token:update", {
      currentToken: null,   // queue finished
      nextToken: null,
    });
  
    return res.status(200).json(
      new ApiResponse(200, {
        state: "EMPTY",
        currentToken: null,
      })
    );
  }
  
  io.to(`hospital:${tenantId}`).emit("token:update", {
    currentToken:nextToken.tokenNumber?? null,
    nextToken: next.tokenNumber  ?? null,
  });
  return res.status(200).json(
    new ApiResponse(200, {
      state: "EMPTY",
      currentToken: null,
    })
  );
});
const getLiveToken = asynchandler(async (req, res) => {
  const tenantId = req.user?.tenantId;
  const setting = req.user?.settings || "NONE";

  if (!tenantId) {
    throw new ApiError(401, "Unauthorized");
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayPK = formatter.format(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayPK = formatter.format(yesterday);

  const dateFilter = { $in: [yesterdayPK, todayPK] };
  const currentToken = await Appointment.findOne({
    tenant_id: tenantId,
    status: "IN_PROGRESS",
    appointmentDatePK: dateFilter,
  })
    .sort({ appointmentDatePK: 1, tokenNumber: 1 })
    .select("tokenNumber");

  const nextToken = await Appointment.findOne({
    tenant_id: tenantId,
    status: "WAITING",
    appointmentDatePK: dateFilter,
  })
    .sort({ appointmentDatePK: 1, tokenNumber: 1 })
    .select("tokenNumber");
  let state = "EMPTY";
  if (!currentToken && nextToken) state = "START";
  else if (currentToken && nextToken) state = "NEXT";
  else if (currentToken && !nextToken) state = "LAST";

  return res.status(200).json(
    new ApiResponse(200, {
      state,
      currentToken: currentToken?.tokenNumber || null,
      nextToken: nextToken?.tokenNumber || null,
      queueState: currentToken ? "IN_PROGRESS" : "IDLE",
      setting,
    })
  );
});
const refreshLiveToken = asynchandler(async (req, res) => {
  const tenantId = req.user?.tenantId;
  const setting = req.user?.settings || "NONE";
  if (!tenantId) {
    throw new ApiError(401, "Unauthorized");
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayPK = formatter.format(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayPK = formatter.format(yesterday);

  const dateFilter = { $in: [yesterdayPK, todayPK] };

  let waitingTokens = [];
  let doneAndSkippedTokens = [];

  if (setting === "BEFORE" || setting === "BOTH") {
    waitingTokens = await Appointment.find({
      tenant_id: tenantId,
      status: "WAITING",
      appointmentDatePK: dateFilter,
    })
      .sort({ appointmentDatePK: 1, tokenNumber: 1 })
      .select("tokenNumber patientName payment.status");
  }

  if (setting === "AFTER" || setting === "BOTH") {
    doneAndSkippedTokens = await Appointment.find({
      tenant_id: tenantId,
      status: { $in: ["DONE", "SKIPPED"] },
      appointmentDatePK: dateFilter,
    })
      .sort({ appointmentDatePK: 1, tokenNumber: 1 })
      .select("tokenNumber patientName payment.status");
  }
  

  return res.status(200).json(
    new ApiResponse(200, {
       setting,
      waitingTokens,
      doneAndSkippedTokens,
    } ,)
  );
});
const publicLiveToken = asynchandler(async (req, res) => {
  const { tenantId } = req.params;
  if (!tenantId) {
    throw new ApiError(401, "Tenant ID is required");
  }
const hospital = await User.findOne({tenantid: tenantId,}).select("hospitalname")
    const now = new Date();
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const todayPK = formatter.format(now);
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayPK = formatter.format(yesterday);
  const currentToken = await Appointment.findOne({
    tenant_id: tenantId,
    status: "IN_PROGRESS",
       appointmentDatePK: { $in: [yesterdayPK, todayPK] }, 
  }).sort({ appointmentDatePK: 1 ,tokenNumber: 1 }).select("tokenNumber status");

  const nextToken = await Appointment.findOne({
    tenant_id: tenantId,
    status: "WAITING",
    appointmentDatePK: { $in: [yesterdayPK, todayPK] }, 
  }).sort({ appointmentDatePK: 1 ,tokenNumber: 1 }).select("tokenNumber status");
   const nexts = await Appointment.find({
    tenant_id: tenantId,
    status: "WAITING",
     appointmentDatePK: { $in: [yesterdayPK, todayPK] }, 
  }).sort({ appointmentDatePK: 1 ,tokenNumber: 1 }).select("tokenNumber");
  return res.status(200).json(
    new ApiResponse(200, {
      currentToken: currentToken?.tokenNumber ?? null,
      nextToken: nextToken?.tokenNumber ?? null,
      hospital:hospital?.hospitalname,
       remainingTokens:nexts,
      queueState: currentToken ? "IN_PROGRESS" : "IDLE",
    })
  );
});
const addPatientPayment =asynchandler (async (req, res) => {
 try {
  const tenant_Id =req.user.tenantId
  if (!tenant_Id) {
    throw ApiError (401,"unauthorized")
  }
    const { Id } = req.params;
    const { amount } = req.body;
const appointment = await Appointment.findOne({
    _id:Id,
    tenant_id:tenant_Id,
  }).select("status payment");    
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
    }
      if (appointment.payment?.status === "PAID") {
    throw new ApiError(400, "Payment already completed");
  }
const now = new Date();
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const today = formatter.format(now); 
    appointment.payment = {
      amount,
      status: "PAID",
      paidAt:  today,
    };
if (appointment.status === "SKIPPED") {
    appointment.status = "DONE";
  }

    await appointment.save();

    return res.status(200).json(
    new ApiResponse(200, {},"Payment added successfully")
  );
  } catch (err) {
    return res.status(500).json(
    new ApiResponse(500, {},"Payment failed")
  );
  }
});
const getDailyDoctorSummary = asynchandler(async (req, res) => {
  const id = req.user._id;
  const tenant_Id = req.user.tenantId;
  if (!tenant_Id || !id) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(id).select("fullname");
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const name = user.fullname;

  // Pakistan date
  const now = new Date();
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const today = formatter.format(now); 

  const summary = await Appointment.aggregate([
    { $match: { tenant_id: tenant_Id } },
    {
      $facet: {
        paid: [
          {
            $match: {
              "payment.status": "PAID",
              "payment.paidAt": today,
            },
          },
          {
            $group: {
              _id: null,
              totalPatients: { $sum: 1 },
              totalAmount: { $sum: "$payment.amount" },
            },
          },
        ],

        waitingPatients: [
          {
            $match: {
              status: "WAITING",
              appointmentDatePK: today,
            },
          },
          { $count: "count" },
        ],
         donePatients: [
          {
            $match: {
              status: "DONE",
              appointmentDatePK: today,
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  const paidData = summary[0]?.paid?.[0] || {};
  const waitingData = summary[0]?.waitingPatients?.[0] || {};
  const doneData = summary[0]?.donePatients?.[0] || {};

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        doctorName: name,
        totalPatients: paidData.totalPatients || 0,
        totalAmount: paidData.totalAmount || 0,
        waitingPatients: waitingData.count || 0,
        donePatients: doneData.count || 0,
      },
      "Doctor summary fetched successfully"
    )
  );
});
const sendWhatsapp= asynchandler(async (req, res) => {
   try {
    const id = req.user._id
  const  tenant_Id  = req.user.tenantId; 
  if (!tenant_Id || !id) {
    throw ApiError(401,"unauthorized")
  }
const user= await User.findById(id).select("fullname contact")
const now = new Date();
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const today = formatter.format(now); 
console.log(today)
const summary = await Appointment.aggregate([
    { $match: { tenant_id: tenant_Id } },
    {
      $facet: {
        paid: [
          {
            $match: {
              "payment.status": "PAID",
              "payment.paidAt": today,
            },
          },
          {
            $group: {
              _id: null,
              totalPatients: { $sum: 1 },
              totalAmount: { $sum: "$payment.amount" },
            },
          },
        ],

        waitingPatients: [
          {
            $match: {
              status: "WAITING",
              appointmentDatePK: today,
            },
          },
          { $count: "count" },
        ],
         donePatients: [
          {
            $match: {
              status: "DONE",
              appointmentDatePK: today,
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  const paidData = summary[0]?.paid?.[0] || {};
  const waitingData = summary[0]?.waitingPatients?.[0] || {};
  const doneData = summary[0]?.donePatients?.[0] || {};

   const message = `Assalam-o-Alaikum Dr. ${user.fullname},

📊 Daily Summary: ${today}

🔹 Today’s Paid Patients : ${paidData.totalPatients}
🔹 Total Earnings: PKR ${paidData.totalAmount}
🔹 Today’s In Waiting: ${waitingData.count}
🔹 Today’s Checked Patients: ${doneData.count}

Keep up the great work! 🙌
Thank you,
Team Sysvon`;


 const whatsappUrl = `https://wa.me/${user.contact}?text=${encodeURIComponent(message)}`;
  const desktopUrl = `whatsapp://send?phone=${user.contact}&text=${encodeURIComponent(message)}`;
  return res.status(200).json(
    new ApiResponse(
      200,{desktopUrl,whatsappUrl},"whatsapp message sended successfuly"
    )
  );
   
  } catch (err) {
    throw ApiError(500,"Failed to fetch summary");
  }

});
const skipLiveToken = asynchandler(async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    throw new ApiError(401, "Unauthorized");
  }

  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayPK = formatter.format(now);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayPK = formatter.format(yesterday);

  const skippedToken = await Appointment.findOneAndUpdate(
    {
      tenant_id: tenantId,
      status: "IN_PROGRESS",
      appointmentDatePK: { $in: [yesterdayPK, todayPK] },
    },
    {
      $set: { status: "SKIPPED" },
    },
    {
      sort: { appointmentDatePK: 1, tokenNumber: 1 },
      new: true,
      select: "tokenNumber status",
    }
  );

  if (!skippedToken) {
    throw new ApiError(404, "No active token to skip");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { skipped: skippedToken.tokenNumber },
      `Skipped token ${skippedToken.tokenNumber} successfully`
    )
  );
});
const getMonthlyDoctorSummary = asynchandler(async (req, res) => {
  const userId = req.user._id;
  const tenant_Id = req.user.tenantId;

  if (!tenant_Id || !userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(userId).select("fullname");
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const doctorName = user.fullname;
  const { month, year } = req.query;
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month || String(now.getMonth() + 1).padStart(2, "0");

  const fromDate = `${y}-${m}-01`;
  const toDate = `${y}-${m}-31`; 

  const summary = await Appointment.aggregate([
    {
      $match: {
        tenant_id: tenant_Id,
        "payment.status": "PAID",
        "payment.paidAt": {
          $gte: fromDate,
          $lte: toDate,
        },
      },
    },
    {
      $group: {
        _id: "$payment.paidAt", // daily breakdown
        dailyPatients: { $sum: 1 },
        dailyAmount: { $sum: "$payment.amount" },
      },
    },
    {
      $sort: { _id: 1 }, // date ascending
    },
    {
      $group: {
        _id: null,
        totalPatients: { $sum: "$dailyPatients" },
        totalAmount: { $sum: "$dailyAmount" },
        days: {
          $push: {
            date: "$_id",
            patients: "$dailyPatients",
            amount: "$dailyAmount",
          },
        },
      },
    },
  ]);

  const data = summary[0] || {};

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        doctorName,
        month: `${y}-${m}`,
        totalPatients: data.totalPatients || 0,
        totalAmount: data.totalAmount || 0,
        dailyBreakdown: data.days || [],
      },
      "Monthly summary fetched successfully"
    )
  );
});

export {advanceToken, getLiveToken, publicLiveToken  ,getAppointment, createappointment,addPatientPayment,getDailyDoctorSummary,sendWhatsapp,skipLiveToken,getAppointmentPaymentStatus,getMonthlyDoctorSummary,refreshLiveToken };