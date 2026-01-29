# 🏗️ Notification System Architecture

## The "Factory vs. Platform" Pattern

This system follows the **"Code vs. Configuration"** separation principle used throughout Dakkah CityOS.

### 1. The Factory (This Repository)

**Repo:** `dakkah-cityos-notifications`

- **Role**: Source Code & Build Logic.
- **Responsibility**:
  - Defining how to connect to Kafka.
  - Defining how to talk to Apple/Google APIs.
  - Building the Docker Images.
- **Output**: Docker Images pushed to GHCR (`ghcr.io/mvp-lab-sa/dakkah-cityos-notifications/notification-expo-worker`).

### 2. The Platform (Infrastructure Repo)

**Repo:** `dakkah-cityos-infrastructure`

- **Role**: Orchestrator.
- **Responsibility**:
  - Running the images built by the Factory.
  - Injecting Secrets (API Keys, Kafka Passwords).
  - Managing Scaling & Restarts.

---

## Data Flow

1.  **Producer**: A service (e.g., `Booking BFF`) wants to notify a user. It uses the `NotificationClient` from the SDK.
2.  **Bus**: The message is published to the `cityos.notifications.send` topic on Redpanda.
3.  **Consumer (Worker)**:
    - The `expo-worker` container picks up messages where `provider: "EXPO"`.
    - The `fcm-worker` container picks up messages where `provider: "FCM"`.
4.  **Provider**: The worker calls the external API (Expo or Firebase) to deliver the message to the user's device.

## Key Design Decisions

- **Stateless**: Workers do not store history. They are pure "Fire and Forget". History should be managed by a separate "Notification Manager" service (future) if needed.
- **At-Least-Once Delivery**: Kafka ensures messages are not lost. Workers should be idempotent where possible.
- **Decoupled**: The workers do not know _who_ sent the message, only _what_ to send.
