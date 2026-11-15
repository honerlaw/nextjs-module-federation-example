import { connection } from "next/server";
import { loadRemoteComponent } from "@/lib/federation";

// A Server Component that awaits a federated module and renders it with the
// react-server React. Ships zero JS for the remote to the browser.
export default async function Page() {
  await connection();
  const ServerSafe = await loadRemoteComponent<{ who: string }>("remote/ServerSafe");
  return (
    <main>
      <h1>Remote rendered inside an RSC</h1>
      <ServerSafe who="RSC" />
    </main>
  );
}
