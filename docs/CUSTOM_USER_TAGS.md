# Custom User Profile Tags

## Overview

User profiles now support custom tags that appear alongside role-based tags. These tags are displayed with custom icons and use the Google Red color scheme.

## Tag Types

### Automatic Tags (Based on User Role)

- **GDG Organizer** - Displayed for users with `admin` role
- **Team Member** - Displayed for users with `team` role

### Custom Tags (Admin-Assignable)

- **Founder**
- **President**
- **Vice President**
- **Treasurer**
- **Secretary**

## Features

### 1. Bio Text Formatting

- Bio text now respects newlines (users can write multi-line bios)
- Newlines are preserved using `white-space: pre-wrap` CSS

### 2. Tag Display

- Each tag has its own unique icon from Google Material Icons
- All tags use the Google Red color (`var(--google-red)`)
- Tags appear in a row between the user's name and their social links
- Tags wrap on smaller screens for better mobile display

### 3. Tag Icons

All icons are from Google Material Icons and follow this SVG structure:

```xml
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
  <path d="[icon-specific-path]"/>
</svg>
```

Icon mappings:

- **GDG Organizer**: Group icon (multiple people)
- **Team Member**: Badge icon
- **Founder**: Shield with checkmark
- **President**: Star/trophy icon
- **Vice President**: Eye/visibility icon
- **Treasurer**: Dollar/money icon
- **Secretary**: Document icon

## API Usage

### Get User Profile (with tags)

```bash
GET /api/users/{userId}
```

Response includes:

```json
{
  "id": "...",
  "name": "John Doe",
  "role": "admin",
  "customTags": ["founder", "president"],
  "bio": "Multi-line\nbio text",
  ...
}
```

### Update Custom Tags (Admin Only)

```bash
PATCH /api/admin/users/{userId}/tags
Content-Type: application/json
x-csrf-token: {token}

{
  "customTags": ["founder", "president"]
}
```

**Requirements:**

- Requester must be an admin or association email
- CSRF token required
- Valid tag values: `founder`, `president`, `vice-president`, `treasurer`, `secretary`

**Example using fetch:**

```javascript
// First get CSRF token
const csrfRes = await fetch("/api/csrf");
const { token } = await csrfRes.json();

// Then update tags
const response = await fetch("/api/admin/users/USER_ID/tags", {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "x-csrf-token": token
  },
  body: JSON.stringify({
    customTags: ["founder", "president"]
  })
});
```

## Database Schema

### UserSettings Model

```typescript
profile: {
  shortBio?: string;
  github?: string;
  linkedin?: string;
  x?: string;
  instagram?: string;
  website?: string;
  customTags?: Array<"founder" | "president" | "vice-president" | "treasurer" | "secretary">;
}
```

## Future Enhancements

Consider adding:

1. UI in the admin permissions page to manage custom tags
2. More custom tag types (e.g., "Ambassador", "Mentor", "Speaker")
3. Tag history/audit log
4. Custom tag colors or themes
5. Tag expiration dates
