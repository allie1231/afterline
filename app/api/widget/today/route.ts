// Alias of /api/today for the iOS Scriptable widget.
//
// Why a separate path: when the original /api/today route was missing /
// broken during an earlier deploy attempt, iOS NSURLCache on at least
// one device cached the fallback HTML response and kept serving it back
// to Scriptable even after the route started returning JSON. Cache
// busters in the query string didn't escape the cached entry. A fresh
// path with no NSURLCache history is the cleanest cure.
//
// Behavior is identical to /api/today — both can coexist indefinitely.

import { GET as today } from "@/app/api/today/route";

export const dynamic = "force-dynamic";

export { today as GET };
