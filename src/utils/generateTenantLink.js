import crypto from "crypto";

export const generateTenantLink = (tenantId) => {
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999); // valid till end of today

  const exp = midnight.getTime();
  const payload = `${tenantId}.${exp}`;

  const sig = crypto
    .createHmac("sha256", process.env.LINK_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 12); 

  return `https://publiclivetoken.netlify.app/${tenantId}/publicLiveToken?e=${exp}&s=${sig}`;
};
