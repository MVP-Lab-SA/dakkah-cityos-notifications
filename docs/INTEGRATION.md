# 🔌 Integration Guide

How to send notifications from any Dakkah CityOS microservice.

## 1. Install the SDK

Ensure your service has the latest SDK installed:

```bash
pnpm add @mvp-lab-sa/cityos-sdk
```

## 2. Initialize the Client

Inject the `NotificationClient` into your service logic. It requires a `CityOSCityBusClient` instance.

```typescript
import {
  CityOSCityBusClient,
  NotificationClient,
} from "@mvp-lab-sa/cityos-sdk";

// 1. Setup Bus
const bus = new CityOSCityBusClient({
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["cityos-redpanda:29092"],
  clientId: "my-service-id",
});
await bus.connect();

// 2. Setup Notification Client
const notifications = new NotificationClient(bus);
```

## 3. Send a Push Notification

### Using Helper Method (Recommended)

```typescript
await notifications.sendPush(
  ["ExponentPushToken[xxxx]", "ExponentPushToken[yyyy]"], // Target Tokens
  "Trip Update", // Title
  "Your driver has arrived at the pickup point.", // Body
);
```

### Using Raw Payload (Advanced)

If you need to send custom data or specify the provider explicitly:

```typescript
import { NotificationProvider } from "@mvp-lab-sa/cityos-sdk";

await notifications.send({
  provider: NotificationProvider.EXPO, // or NotificationProvider.FCM
  tokens: ["ExponentPushToken[xxxx]"],
  title: "Payment Success",
  body: "Thank you for your purchase.",
  data: {
    orderId: "12345",
    deepLink: "cityos://orders/12345",
  },
  priority: "high",
});
```

## 4. Payload Specification

The system expects messages on `cityos.notifications.send` to match this interface:

| Field      | Type       | Required | Description                                       |
| :--------- | :--------- | :------- | :------------------------------------------------ |
| `provider` | `string`   | Yes      | `EXPO`, `FCM`, `SMS`, or `EMAIL`.                 |
| `tokens`   | `string[]` | Yes      | Array of destination tokens/addresses.            |
| `title`    | `string`   | Yes      | The bold header of the notification.              |
| `body`     | `string`   | Yes      | The main content text.                            |
| `data`     | `object`   | No       | Custom JSON object for app logic (e.g., routing). |
| `priority` | `string`   | No       | `high` (default), `normal`, or `low`.             |

> **Note**: The SDK enforces this structure automatically.
