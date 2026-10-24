import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { GameShell } from "@/components/olive/GameShell";
import { boot } from "@/lib/olive/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  useEffect(() => {
    boot();
  }, []);
  return <GameShell />;
}
