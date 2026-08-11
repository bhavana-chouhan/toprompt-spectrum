// Auto-emitted by generate-component-library.ts (Sprint ε.5).
// Deterministic stack layout for Match routes — declares the
// modal presentation for the create form so iOS users can swipe down
// to dismiss. The LLM is locked out of this file.
import { Stack } from 'expo-router';

export default function MatchStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="new"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}
