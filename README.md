# SecureOTP — React Native (Expo) + TypeScript

A local-only OTP authentication demo built with **Expo**, **TypeScript**, and **React Navigation**. No backend required — all OTP generation, validation, and session management happens on-device.

### 📲 [Download APK](https://expo.dev/accounts/abhishek180/projects/SecureOTP/builds/7590b590-146a-447f-8570-a6cc9d68c159)

---

## Table of Contents

1. [Setup Steps](#1-setup-steps)
2. [OTP Logic & Expiry Handling](#2-otp-logic--expiry-handling)
3. [Data Structures Used](#3-data-structures-used)
4. [Why AsyncStorage](#4-why-asyncstorage)

---

## 1. Setup Steps

### Prerequisites
- **Node.js** >= 18
- **npm** or **yarn**
- **Expo CLI** (installed globally or via `npx`)
- **Expo Go** app on your phone (iOS / Android) for testing

### Installation

```bash
# Clone the repository
git clone https://github.com/abhikumar0670/SecureOTP.git
cd SecureOTP

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

### Running the App

After `npx expo start` you will see a QR code in the terminal:

- **Android**: Open the **Expo Go** app and scan the QR code.
- **iOS**: Open the **Camera** app, scan the QR code, and tap the Expo banner.
- **Web**: Press `w` in the terminal to open in the browser.
- **Emulator**: Press `a` (Android) or `i` (iOS) in the terminal.

### DEV Mode

In development mode (`__DEV__ === true`):
- The generated OTP is shown in an **alert dialog** after tapping "Send OTP" for easy testing.
- Analytics events are also printed to the **console**.

---

## 2. OTP Logic & Expiry Handling

### Generation
- When the user taps **Send OTP**, a random **6-digit** code is generated via `Math.random()` and stored **per email** in the `OtpManager` service.
- The code, creation timestamp, and attempt counter are saved together as an `OtpRecord`.

### Expiry
- Each OTP is valid for exactly **60 seconds** from its `createdAt` timestamp.
- On every verification attempt, the service checks `Date.now() - createdAt > 60_000`.
- Once expired, the record is deleted and the user receives an "OTP Expired" message.

### Attempt Limiting
- A maximum of **3 incorrect attempts** are allowed per OTP.
- After 3 failures the OTP is locked and the user must **Resend** to get a fresh code.

### Resend Behaviour
- Resending generates a brand-new OTP for the same email.
- The old OTP is **automatically invalidated** (overwritten in the Map).
- The attempt counter and countdown timer **reset** to their initial values.

### Validation Flow (in order)
1. No OTP on file -> `no_otp`
2. OTP expired -> `expired`
3. Max attempts reached -> `max_attempts`
4. Wrong code -> `incorrect` (increments counter)
5. Correct code -> `success` (record deleted to prevent reuse)

---

## 3. Data Structures Used

| Structure | Where | Why |
|-----------|-------|-----|
| `Map<string, OtpRecord>` | `otpManager.ts` | O(1) look-up / insert / delete by email key. Naturally isolates OTP data per user. No prototype pollution risk (unlike plain `{}`). |
| `OtpRecord` (object) | `types/auth.ts` | Groups `code`, `createdAt`, and `attempts` into a single typed unit for clarity and type safety. |
| `AnalyticsPayload[]` (array) | `analytics.ts` | Append-only log — events are pushed to the end. Serialized to JSON for AsyncStorage persistence. |
| `useRef` (interval IDs & timestamps) | Hooks | Refs survive re-renders without triggering them, which is essential for timers and session start times. |

---

## 4. Why AsyncStorage

| Reason | Detail |
|--------|--------|
| **Expo compatibility** | `@react-native-async-storage/async-storage` works out of the box with Expo — zero native config. |
| **Persistence** | Data survives app restarts, so analytics logs and session start times are never lost. |
| **Non-blocking** | All reads/writes are async and don't freeze the UI thread. |
| **Simplicity** | Simple key-value API (`getItem` / `setItem`) is sufficient for our use case — no need for SQLite or Realm. |
| **Industry standard** | It is the most widely used persistence library in the React Native ecosystem. |

---

## Project Structure

```
SecureOTP/
├── App.tsx                          # Entry point — initialises analytics & renders navigator
├── src/
│   ├── types/
│   │   └── auth.ts                  # Shared TypeScript interfaces & type aliases
│   ├── services/
│   │   ├── otpManager.ts            # OTP generation, storage (Map), and validation logic
│   │   └── analytics.ts             # AsyncStorage-backed event logging service
│   ├── hooks/
│   │   ├── useSessionTimer.ts       # Custom hook: live session timer with AppState handling
│   │   └── useOtp.ts                # Custom hook: OTP countdown, verification, resend logic
│   ├── navigation/
│   │   └── AppNavigator.tsx         # React Navigation stack configuration
│   └── screens/
│       ├── LoginScreen.tsx          # Email input, generate OTP, navigate
│       ├── OtpScreen.tsx            # OTP input, verify, navigate to session
│       └── SessionScreen.tsx        # Session info, live timer, logout
├── package.json
├── tsconfig.json
└── README.md
```

---

## Key Libraries

| Package | Purpose |
|---------|---------|
| `expo` | Managed React Native framework |
| `typescript` | Static type checking |
| `@react-navigation/native` | Screen navigation |
| `@react-navigation/native-stack` | Native stack navigator |
| `@react-native-async-storage/async-storage` | Persistent key-value storage |
| `react-native-screens` | Native screen optimisation |
| `react-native-safe-area-context` | Safe area insets |

---

## License

This project is for educational / assignment purposes only.
