"use client";

import dynamic from "next/dynamic";

const LoadingFallback = () => (
  <div className="flex min-h-dvh items-center justify-center bg-background">
    <p className="text-sm text-muted-foreground">読み込み中...</p>
  </div>
);

const PlantScreen = dynamic(
  () =>
    import("@/components/plant/plant-screen").then((module) => ({
      default: module.PlantScreen,
    })),
  { ssr: false, loading: LoadingFallback }
);

export default function PlantPage() {
  return <PlantScreen />;
}
