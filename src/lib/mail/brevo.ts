import * as SibApiV3Sdk from "@getbrevo/brevo";
import config from "@/lib/config";

export type ContactPayload = {
  type: "personal" | "sponsor";
  name: string;
  email: string;
  message: string;
  orgName?: string;
  website?: string;
};

const defaultClient = new SibApiV3Sdk.TransactionalEmailsApi();
defaultClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, config.brevoKey);

export async function sendContactEmail(payload: ContactPayload) {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.templateId = payload.type === "personal" ? 2 : 3;
    sendSmtpEmail.to = [
      {
        email: config.associationEmail,
        name: "GDGoC UAM Website"
      }
    ];
    sendSmtpEmail.replyTo = { email: payload.email, name: payload.name };
    sendSmtpEmail.params = {
      CONTACT_NAME: payload.name,
      CONTACT_EMAIL: payload.email,
      CONTENT: payload.message,
      CONTACT_ORG_NAME: payload.orgName,
      CONTACT_WEBSITE: payload.website
    };

    await defaultClient.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
