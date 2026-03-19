import { sendLogicstarterEmail, sendLogicstarterSms } from "~/lib/logicstarter/messaging.server";
import { createLogicstarterStorageProvider } from "~/lib/logicstarter/storage.server";

export function logicstarter() {
  return {
    sendEmail: sendLogicstarterEmail,
    sendSms: sendLogicstarterSms,
    storage: createLogicstarterStorageProvider(),
  };
}
