# SecureOTP — React Native (Expo) + TypeScript

A local‑only OTP authentication demo built with **Expo**, **TypeScript**, and **React Navigation**. No backend required — all OTP generation, validation, and session management happens on‑device.

---

## Table of Contents

1. [OTP Logic & Expiry Handling](#1-otp-logic--expiry-handling)
2. [Data Structures Used](#2-data-structures-used)
3. [Why AsyncStorage](#3-why-asyncstorage)
4. [What Copilot / GPT Helped With vs What I Implemented](#4-what-copilot--gpt-helped-with-vs-what-i-implemented)
5. [Setup Steps](#5-setup-steps)

---

## 1. OTP Logic & Expiry Handling

### Generation
- When the user taps **Send OTP**, a random **6‑digit** code is generated via `Math.random()` and stored **per email** in the `OtpManager` service.
- The code, creation timestamp, and attempt counter are saved together as an `OtpRecord`.

### Expiry
- Each OTP is valid for exactly **60 seconds** from its `createdAt` timestamp.
- On every verification attempt, the service checks `Date.now() - createdAt > 60_000`.
- Once expired, the record is deleted and the user receives an "OTP Expired" message.

### Attempt Limiting
- A maximum of **3 incorrect attempts** are allowed per OTP.
- After 3 failures the OTP is locked and the user must **Resend** to get a fresh code.

### Resend Behaviour
- Resending generates a brand‑new OTP for the same email.
- The old OTP is **automatically invalidated** (overwritten in the Map).
- The attempt counter and countdown timer **reset** to their initial values.

### Validation Flow (in order)
1. No OTP on file → `no_otp`
2. OTP expired → `expired`
3. Max attempts reached → `max_attempts`
4. Wrong code → `incorrect` (increments counter)
5. Correct code → `success` (record deleted to prevent reuse)

---

## 2. Data Structures Used

| Structure | Where | Why |
|-----------|-------|-----|
| `Map<string, OtpRecord>` | `otpManager.ts` | O(1) look‑up / insert / delete by email key. Naturally isolates OTP data per user. No prototype pollution risk (unlike plain `{}`). |
| `OtpRecord` (object) | `types/auth.ts` | Groups `code`, `createdAt`, and `attempts` into a single typed unit for clarity and type safety. |
| `AnalyticsPayload[]` (array) | `analytics.ts` | Append‑only log — events are pushed to the end. Serialized to JSON for AsyncStorage persistence. |
| `useRef` (interval IDs & timestamps) | Hooks | Refs survive re‑renders without triggering them, which is essential for timers and session start times. |

---

## 3. Why AsyncStorage

| Reason | Detail |
|--------|--------|
| **Expo compatibility** | `@react-native-async-storage/async-storage` works out of the box with Expo — zero native config. |
| **Persistence** | Data survives app restarts, so analytics logs and session start times are never lost. |
| **Non‑blocking** | All reads/writes are async and don't freeze the UI thread. |
| **Simplicity** | Simple key–value API (`getItem` / `setItem`) is sufficient for our use case — no need for SQLite or Realm. |
| **Industry standard** | It is the most widely used persistence library in the React Native ecosystem. |

---

## 4. What Copilot / GPT Helped With vs What I Implemented

### What AI (Copilot / GPT) helped with:
- **Boilerplate generation** — initial file scaffolding, StyleSheet templates, and React Navigation setup.
- **Code comments & documentation** — generating JSDoc‑style comments explaining design decisions.
- **Edge‑case enumeration** — listing all OTP failure reasons (`expired`, `max_attempts`, etc.) to ensure nothing was missed.
- **README structure** — drafting the table of contents and section headings.

### What I understood and implemented myself:
- **Architecture decisions** — choosing clean separation between UI (screens), business logic (services), and side effects (hooks).
- **OTP validation logic** — the ordered check sequence (no_otp → expired → max_attempts → incorrect → success) was designed to handle every edge case correctly.
- **Timer correctness** — using `Date.now() - startTime` for elapsed calculation instead of incrementing a counter, ensuring the timer stays accurate even after app backgrounding.
- **Memory leak prevention** — ensuring every `setInterval` has a matching `clearInterval` in cleanup functions.
- **State management strategy** — deciding to use `useRef` for values that must survive re‑renders without causing them (interval IDs, session start time).
- **Per‑email OTP isolation** — choosing `Map<string, OtpRecord>` to naturally scope OTP data to individual users.

---

## 5. Setup Steps

### Prerequisites
- **Node.js** ≥ 18
- **npm** or **yarn**
- **Expo CLI** (installed globally or via `npx`)
- **Expo Go** app on your phone (iOS / Android) for testing

### Installation

```bash
# 1. Navigate to the project folder
cd SecureOTP

# 2. Install dependencies (already done if you cloned this repo)
npm install

# 3. Start the Expo development server
npx expo start
```

### Running the App

After `npx expo start` you'll see a QR code in the terminal:

- **Android**: Open the **Expo Go** app → Scan QR code.
- **iOS**: Open the **Camera** app → Scan QR code → Tap the Expo banner.
- **Web**: Press `w` in the terminal to open in browser.
- **Emulator**: Press `a` (Android) or `i` (iOS) in the terminal.

### DEV Mode

In development mode (`__DEV__ === true`):
- The generated OTP is shown in an **Alert dialog** after tapping "Send OTP" for easy testing.
- Analytics events are also printed to the **console**.

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
│       ├── LoginScreen.tsx          # Email input → generate OTP → navigate
│       ├── OtpScreen.tsx            # OTP input → verify → navigate to session
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
| `@react-native-async-storage/async-storage` | Persistent key–value storage |
| `react-native-screens` | Native screen optimisation |
| `react-native-safe-area-context` | Safe area insets |

---

## License

This project is for educational / assignment purposes only.
