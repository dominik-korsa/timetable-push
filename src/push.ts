import webpush, {WebPushError} from "web-push";
import config from "./config";
import {NotificationBody} from "./types";
import {getRegistrations, removeRegistrations} from "./database";

webpush.setVapidDetails(
  config.vapidSubject,
  config.vapidPublicKey,
  config.vapidPrivateKey,
);

export async function pushToAll(body: NotificationBody) {
  const registrations = await getRegistrations();
  const bodyJSON = JSON.stringify(body);
  const outdatedEndpoints: string[] = [];
  await Promise.all(registrations.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, bodyJSON);
    } catch (error) {
      if (error instanceof WebPushError && error.statusCode === 410) {
        outdatedEndpoints.push(subscription.endpoint);
        return;
      }
      console.error(error);
    }
  }));
  if (outdatedEndpoints.length > 0) {
    console.log(`Removing ${outdatedEndpoints.length} outdated registrations`);
    await removeRegistrations(outdatedEndpoints);
  }
}
