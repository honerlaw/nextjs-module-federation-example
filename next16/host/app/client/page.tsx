import { RemoteClient } from "@/components/RemoteClient";

// Server Component page that hands off to the host-owned client boundary.
// The remote Counter is SSR'd (HTML in the response) and then hydrated.
export default function Page() {
  return (
    <main>
      <h1>Remote stateful component: SSR + hydrate</h1>
      <RemoteClient id="remote/Counter" props={{ start: 5 }} fallback={<p>loading remote…</p>} />
    </main>
  );
}
