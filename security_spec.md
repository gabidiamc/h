# Firestore Security Specification & Invariants

## 1. Data Invariants

- **Authentication & Identity**: Any authenticated user can only manage their own profile and saved items. Spoofing of `userId` or `id` is forbidden.
- **Role Elevation**: Users cannot elevate their own role to `admin` or modify their `role` field on their profile.
- **Admin Supremacy**: Administrative collections (`/admins/{adminId}`) and announcement authoring (`/announcements/{announcementId}`) are strictly restricted to trusted administrators.
- **Family Inquiries Integrity**: Inquiries submitted by families must bind `userId` to the active caller UID or anonymous identity, and callers can read only their own submitted inquiries, while administrators can read and update all inquiries.
- **Immortal Keys & Timestamps**: Timestamps (`createdAt`) cannot be altered or set to past/future dates outside `request.time`.
- **Relational Integrity**: Saved items under `/users/{userId}/savedItems/{savedItemId}` must belong to the parent `{userId}` matching `request.auth.uid`.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Spoofed User UID on Profile Creation**: Malicious user `user_attacker` attempting to create `/users/user_victim`.
2. **Privilege Escalation on Profile**: Standard user updating their own profile with `role: "admin"`.
3. **Ghost Field Injection**: Adding undeclared field `isMasterSuperuser: true` to `/users/{userId}`.
4. **Denial-of-Wallet Oversized String**: Creating an inquiry with a 500KB `message` field exceeding the 2000 character limit.
5. **Unauthorized Announcement Write**: Regular authenticated user attempting to create or update an announcement in `/announcements`.
6. **Inquiry Hijacking**: User `user_a` attempting to read or update `user_b`'s private inquiry.
7. **Cross-User Subcollection Tampering**: User `user_a` creating a saved item under `/users/user_b/savedItems/item1`.
8. **Admin Collection Injection**: Non-admin user writing to `/admins/{anyUid}`.
9. **Timestamp Falsification**: Client specifying a fake `createdAt: "2020-01-01T00:00:00Z"` rather than server timestamp.
10. **ID Path Poisoning**: Attempting to write with a junk ID containing illegal path traversal or non-alphanumeric characters.
11. **Blanket Query Scraping**: Unauthorized client issuing an open collection group or unfiltered query without owner scoping.
12. **Terminal State Mutation**: Regular user attempting to alter an inquiry marked `resolved`.

---

## 3. Test Runner Design

The `firestore.rules.test.ts` suite verifies that each of the above 12 scenarios results in a `PERMISSION_DENIED` error when executed against Firestore security rules.
