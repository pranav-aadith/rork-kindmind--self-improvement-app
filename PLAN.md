# Fix SDK version mismatch for Expo Go

**Problem**
Your phone's Expo Go expects SDK 54, but the app is detected as SDK 52 due to a broken Stripe plugin reference in the project config.

**Fix**
- Remove the Stripe plugin entry from the app configuration (it was already removed as a dependency in a previous fix, but the config reference was left behind)
- Remove `@stripe/stripe-react-native` from the dependencies list if still present
- This will allow the project to build and load correctly in Expo Go SDK 54
