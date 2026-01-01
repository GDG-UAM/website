import { Elysia } from "elysia";
import { getCertificateByPublicId } from "@/lib/controllers/certificateController";
import { findUserById } from "@/lib/controllers/userController";
import crypto from "node:crypto";

const BASE_URL = "https://gdguam.es";

export const badgesRoutes = new Elysia({ prefix: "/badges" })
  .get("/issuer", () => {
    return {
      "@context": "https://w3id.org/openbadges/v2",
      type: "Issuer",
      id: `${BASE_URL}/api/badges/issuer`,
      name: "Google Developer Group on Campus - Universidad Autónoma de Madrid",
      url: BASE_URL,
      image: `${BASE_URL}/logo/logo.svg`,
      email: "gdguam@gmail.com"
    };
  })

  .get("/class/:publicId", async ({ params: { publicId }, set }) => {
    try {
      const certificate = await getCertificateByPublicId(publicId);
      if (!certificate || certificate.revoked?.isRevoked) {
        set.status = 404;
        return { error: "Certificate not found or revoked" };
      }

      return {
        "@context": "https://w3id.org/openbadges/v2",
        type: "BadgeClass",
        id: `${BASE_URL}/api/badges/class/${publicId}`,
        name: certificate.title,
        description: certificate.description || certificate.title,
        criteria: {
          narrative: `Certificate awarded to ${certificate.recipient.name} for ${certificate.title}.`
        },
        issuer: `${BASE_URL}/api/badges/issuer`,
        image: `${BASE_URL}/logo/logo.svg`
      };
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/assertion/:publicId", async ({ params: { publicId }, set }) => {
    try {
      const certificate = await getCertificateByPublicId(publicId);
      if (!certificate || certificate.revoked?.isRevoked) {
        set.status = 404;
        return { error: "Certificate not found or revoked" };
      }

      if (!certificate.recipient.userId) {
        set.status = 400;
        return { error: "Certificate recipient has no associated user account" };
      }

      const user = await findUserById(String(certificate.recipient.userId));
      if (!user || !user.email) {
        set.status = 404;
        return { error: "User not found" };
      }

      const hash = crypto.createHash("sha256").update(user.email).digest("hex");

      return {
        "@context": "https://w3id.org/openbadges/v2",
        type: "Assertion",
        id: `${BASE_URL}/api/badges/assertion/${publicId}`,
        recipient: {
          type: "email",
          hashed: true,
          identity: `sha256$${hash}`
        },
        issuedOn: new Date(certificate.createdAt).toISOString(),
        verification: {
          type: "HostedBadge"
        },
        badge: `${BASE_URL}/api/badges/class/${publicId}`
      };
    } catch (e) {
      console.error(e);
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
