# API Files Migration Notice

**IMPORTANT: The API files that were previously in this directory have been removed.**

All API functionality has been migrated to the new feature-based architecture:

- Auth API: `src/features/auth/api/`
- Profile API: `src/features/profile/api/`
- Post API: `src/features/feed/api/`
- Messaging API: `src/features/messaging/api/`

Please update your imports to use the new API modules instead of these deprecated ones.

## Migration Guide

1. Replace imports from `src/apis` with imports from the feature-specific API modules:

```javascript
// Old import
import { loginUser } from "../../apis";

// New import
import { login } from "../../features/auth/api";
```

2. Update function names to match the new API:

```javascript
// Old code
const response = await loginUser(credentials);

// New code
const response = await login(credentials);
```

3. Handle the response format differences:

```javascript
// Old code (might vary)
const token = data.token;

// New code
const { error, data } = response;
const token = data.token;
```
