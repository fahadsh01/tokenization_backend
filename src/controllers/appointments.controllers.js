import asynchandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Appointment } from "../models/createappointment.model.js";
import { Counter } from "../models/livecounter.model.js";
import { generateTenantLink } from "../utils/generateTenantLink.js";
import { User } from "../models/user.model.js";
import { io } from "../index.js";
const createappointment= asynchandler(async(req,res)=>{
    const { patientName, whatsapp } = req.body;
    const tenant_id = req.user.tenantid;
    if (!patientName || !whatsapp) {
      return res
        .status(400)
        .json({ message: "Patient name and WhatsApp required" });
    }
  if (!tenant_id ) {
    throw new ApiError(403, "You are not allowed to create a Appionment");
  }
  const now = new Date();
    const pakistanOffset = 5 * 60; 
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const pakistanTime = new Date(utc + pakistanOffset * 60000);

    const yyyy = pakistanTime.getUTCFullYear();
    const mm = String(pakistanTime.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(pakistanTime.getUTCDate()).padStart(2, "0");

    const today = `${yyyy}-${mm}-${dd}`; // "YYYY-MM-DD"

    const counter = await Counter.findOneAndUpdate(
      { tenant_id, date: today },
      { $inc: { currentToken: 1 } },
      { new: true, upsert: true }
    );

    const tokenNumber = counter.currentToken;

    // --- Step 3: Create appointment ---
    const appointment = await Appointment.create({
      tenant_id,
      patientName,
      whatsapp,
      tokenNumber,
      status: "WAITING",
    });
    const link = generateTenantLink(tenant_id);



const message = `Hello ${patientName},

Your appointment token has been generated successfully.

🔹 Token Number: ${tokenNumber}

You can view your live token status here:
${link}
Please keep this link for today only.

Thank you,
Doctor`;


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
const getallAppointment = asynchandler(async (req, res) => {
  const tenant_id = req.user?.tenant_id;

  if (!tenant_id) {
    throw new ApiError(401, "Unauthorized user");
  }

  const appointments = await Appointment.find({ tenant_id }).sort({
    tokenNumber: 1,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, appointments, "Appointments fetched successfully")
    );
});
const getAppointment = asynchandler(async (req, res) => {
  const tenant_id= req.user?.tenantId;
  const { status  } = req.query;
console.log( status ,tenant_id)
  if (!tenant_id) {
    throw new ApiError(401, "Unauthorized user");
  }
  const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);

const query = { tenant_id ,createdAt: { $gte: startOfDay, $lte: endOfDay }};
  if (status && status !== "ALL") {
  query.status = status;
}
  const appointments = await Appointment.find(
     query
  ).sort({ tokenNumber: 1 });
  
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
const updateAppointmentconter = asynchandler(async (req, res) => {
    const tenant_id = req.user?.tenant_id;
    if (!tenant_id) {
      throw new ApiError(401, "Unauthorized user");
    }
    const lastAppointment = await Livecounter.findOneAndUpdate(
  tenant_id,
  {
    $set: { conter: +1 },
  },
  {
    new: true,
  }
);
  return res
    .status(200)
    .json(new ApiResponse(200, n, "Appointments created successfully"));
});
 const advanceToken = asynchandler(async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    throw new ApiError(401, "Unauthorized");
  }
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const currentToken = await Appointment.findOne({
    tenant_id: tenantId,
    status: "IN_PROGRESS",
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .sort({ tokenNumber: 1 })
    .select("tokenNumber status");

    const nextToken = await Appointment.findOne({
      tenant_id: tenantId,
      status: "WAITING",
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ tokenNumber: 1 })
      .select("tokenNumber status");

  // 🟢 START QUEUE
  if (!currentToken && nextToken) {
    nextToken.status = "IN_PROGRESS";
    await nextToken.save();
    const next = await Appointment.findOne({
      tenant_id: tenantId,
      status: "WAITING",
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ tokenNumber: 1 })
      .select("tokenNumber");
    io.to(`hospital:${tenantId}`).emit("token:update", {
      currentToken:nextToken.tokenNumber?? null,
      nextToken: next?.tokenNumber || null
    });
    return res.status(200).json(
      new ApiResponse(200, {
        state: "STARTED",
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
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ tokenNumber: 1 })
    .select("tokenNumber");
    console.log("next",next)
      
    io.to(`hospital:${tenantId}`).emit("token:update", {
      currentToken:nextToken.tokenNumber?? null,
      nextToken: next?.tokenNumber || null

    });
   
    return res.status(200).json(
      new ApiResponse(200, {
        state: "ADVANCED",
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
        state: "QUEUE_EMPTY",
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
      state: "NO_APPOINTMENTS",
      currentToken: null,
    })
  );
});
const getLiveToken = asynchandler(async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    throw new ApiError(401, "Unauthorized");
  }
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const currentToken = await Appointment.findOne({
    tenant_id: tenantId,
    status: "IN_PROGRESS",
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ tokenNumber: 1 });

  const nextToken = await Appointment.findOne({
    tenant_id: tenantId,
    status: "WAITING",
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ tokenNumber: 1 });

  return res.status(200).json(
    new ApiResponse(200, {
      currentToken: currentToken?.tokenNumber || null,
      nextToken: nextToken?.tokenNumber || null,
      queueState: currentToken ? "IN_PROGRESS" : "IDLE",
    })
  );
});
const publicLiveToken = asynchandler(async (req, res) => {
  const { tenantId } = req.params;
console.log(tenantId )
  if (!tenantId) {
    throw new ApiError(400, "Tenant ID is required");
  }
const hospital = await User.findOne({tenantid: tenantId,}).select("hospitalname")
console.log(hospital)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const currentToken = await Appointment.findOne({
    tenant_id: tenantId,
    status: "IN_PROGRESS",
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ tokenNumber: 1 });

  const nextToken = await Appointment.findOne({
    tenant_id: tenantId,
    status: "WAITING",
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ tokenNumber: 1 });

  return res.status(200).json(
    new ApiResponse(200, {
      currentToken: currentToken?.tokenNumber ?? null,
      nextToken: nextToken?.tokenNumber ?? null,
      hospital:hospital?.hospitalname,
      queueState: currentToken ? "IN_PROGRESS" : "IDLE",
    })
  );
});

export {advanceToken, getLiveToken, publicLiveToken  ,getAppointment, createappointment,  updateAppointmentconter };





