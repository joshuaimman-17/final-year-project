# Dr.Plant React / Next.js PWA Structure

This architecture supports the `Offline-First` requirements for Farmers, while scaling to Experts and Admins.

## Directory Structure
```
src/
├── app/
│   ├── (farmer)/             # Farmer Dashboard & Tools
│   │   ├── dashboard/        # Telemetry UI, offline graphs
│   │   ├── diagnosis/        # Camera input, ML uploads
│   │   └── advisory/         # Cached recommendations
│   ├── (expert)/             # Expert Dashboard
│   │   └── validations/      # Queue for pending AI diagnoses
│   └── (admin)/              # Admin Dashboard
│       └── users/            # RBAC management UI
├── components/
│   ├── offline/              # Offline banners & sync indicators
│   └── charts/               # Recharts for ESP32 telemetry
├── lib/
│   ├── indexeddb.ts          # idb/dexie wrapper for caching data
│   └── api.ts                # Axios wrapper handling JWT tokens
└── service-worker/
    └── sw.js                 # Workbox config for caching static assets
```

## Service Worker Configuration (Workbox)
For offline sensor graphs and advisory guides:
```javascript
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// Cache GET requests to /advisories and /telemetry
registerRoute(
  ({url}) => url.pathname.startsWith('/api/v1/telemetry'),
  new NetworkFirst({
    cacheName: 'sensor-data-cache'
  })
);

registerRoute(
  ({url}) => url.pathname.startsWith('/api/v1/advisories'),
  new CacheFirst({
    cacheName: 'advisory-cache'
  })
);
```

## Data Sync (IndexedDB)
When a Farmer creates a Farm while offline:
1. Save `FarmCreate` object to `IndexedDB` with `sync_status = pending`.
2. Service Worker `backgroundSync` listens for reconnection.
3. Automatically replay POST request to FastAPI `Farm Service` when online.
