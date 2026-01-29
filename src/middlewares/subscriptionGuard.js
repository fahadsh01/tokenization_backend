import { ApiError } from "../utils/apierrors.js";

export const subscriptionGuard = (req, res, next) => {
  const { status } = req.user;

  if (status === "EXPIRED") {
    throw new ApiError(
      403,
      "Subscription expired. Please renew to continue."
    );
  }

  next();
};
