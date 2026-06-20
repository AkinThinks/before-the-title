import { Suspense } from "react";
import WelcomeScreen from "@/components/screens/WelcomeScreen";

export default function ExperiencePage() {
  return (
    <Suspense>
      <WelcomeScreen />
    </Suspense>
  );
}
