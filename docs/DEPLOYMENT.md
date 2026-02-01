# ship Deployment & Operations

This document covers how to run the notification workers in production.

## 🐳 Docker Images

Images are built from this repository and stored in the **GitHub Container Registry (GHCR)**.

| Service         | Image                                                                            |
| :-------------- | :------------------------------------------------------------------------------- |
| **Expo Worker** | `ghcr.io/mvp-lab-sa/dakkah-cityos-notifications/notification-expo-worker:latest` |
| **FCM Worker**  | `ghcr.io/mvp-lab-sa/dakkah-cityos-notifications/notification-fcm-worker:latest`  |

## 🛠️ Environment Variables

The workers require these environment variables to be injected at runtime (usually via `docker-compose.deploy.yml` or Dokploy).

### Common Variables

| Variable        | Description                               | Default                 |
| :-------------- | :---------------------------------------- | :---------------------- |
| `NODE_ENV`      | Runtime mode.                             | `production`            |
| `KAFKA_BROKERS` | Comma-separated list of Redpanda brokers. | `cityos-redpanda:29092` |

### Expo Worker Specific

| Variable            | Description                           | Required |
| :------------------ | :------------------------------------ | :------- |
| `EXPO_ACCESS_TOKEN` | Access token from Expo.dev dashboard. | **YES**  |

### FCM Worker Specific

| Variable                   | Description                                           | Required            | Options                                               |
| :------------------------- | :---------------------------------------------------- | :------------------ | :---------------------------------------------------- |
| `FCM_SERVICE_ACCOUNT_JSON` | Minified JSON string of the Firebase Service Account. | **YES** (Preferred) | Copy content of `service-account.json` into one line. |
| `FCM_SERVER_KEY`           | Legacy Firebase Server Key (Not recommended).         | NO                  | Only use if Service Account is unavailable.           |

## ☸️ Orchestration

The orchestration is managed in the **Infrastructure Repository** (`dakkah-cityos-infrastructure`).

- **File**: `docker-compose.infra.yml`
- **Network**: Must represent the same Docker network as Redpanda (`cityos-network`).
- **Restart Policy**: `unless-stopped` is recommended.

## 🔍 Troubleshooting

### Logs

To view logs for a specific worker:

```bash
docker logs -f notification-expo-worker
```

### Common Errors

- **"Kafka Connection Error"**: Check `KAFKA_BROKERS` is correct and the worker is on the same network as Redpanda.
- **"Authentication Error" (Expo/FCM)**: Verify your `EXPO_ACCESS_TOKEN` or `FCM_SERVICE_ACCOUNT_JSON` are valid and have not expired.
