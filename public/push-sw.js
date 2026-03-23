self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = {
      notification: { title: "Thông báo mới", body: "Bạn có thông báo mới" },
    };
  }

  const notification = payload.notification || {};
  const data = payload.data || {};

  const title = notification.title || "Thông báo mới";
  const options = {
    body: notification.body || "Bạn có thông báo mới",
    icon: "/pictures/logo.png",
    badge: "/pictures/logo.png",
    data: {
      route:
        data.type === "employee_invite" || data.type === "employee_removed"
          ? "/dashboard/employees?tab=invitations"
          : "/dashboard/employees?tab=invitations",
      rawPayload: payload,
    },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients
        .matchAll({ includeUncontrolled: true, type: "window" })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: "BIZFLOW_PUSH", payload });
          });
        }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const route =
    event.notification.data?.route || "/dashboard/employees?tab=invitations";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.postMessage({ type: "BIZFLOW_PUSH_CLICK", route });
            client.focus();
            client.navigate(route);
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(route);
        }
      }),
  );
});
