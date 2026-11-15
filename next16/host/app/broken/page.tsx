import { connection } from "next/server";
import { loadRemoteComponent } from "@/lib/federation";

// Deliberately wrong: rendering a hook-using remote directly in RSC.
// The react-server React has no useState, so this throws. This is the
// boundary you have to design around.
export default async function Page() {
  await connection();
  const Counter = await loadRemoteComponent<{ start: number }>("remote/Counter");
  return <Counter start={1} />;
}
