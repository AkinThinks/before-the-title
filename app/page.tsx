import { Suspense } from "react";
import WelcomeScreen from "@/components/screens/WelcomeScreen";

export default function HomePage() {
  return (
    <Suspense>
      <WelcomeScreen />
    </Suspense>
  );
}
