"use client";

import { Suspense, use } from "react";
import { loadRemoteComponent } from "@/lib/federation";

/**
 * The host-owned client boundary for remote "use client" components.
 *
 * A Server Component can't render a remote client component directly: RSC serialises
 * client components as *references* into Next's client-reference manifest, and the
 * remote's modules aren't in it. So the server only ever references THIS file, passing
 * the remote id + serialisable props. SSR renders it to HTML with the SSR React;
 * the browser loads the browser build and hydrates.
 */
function Inner({ id, props }: { id: string; props: Record<string, unknown> }) {
  const Component = use(loadRemoteComponent(id));
  return <Component {...props} />;
}

export function RemoteClient({
  id,
  props = {},
  fallback = null,
}: {
  id: string;
  props?: Record<string, unknown>;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <Inner id={id} props={props} />
    </Suspense>
  );
}
