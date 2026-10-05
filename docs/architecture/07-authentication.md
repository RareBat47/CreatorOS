# 07 - Authentication: CreatorOS

## 1. Auth Stack: Better-Auth
CreatorOS implements [Better-Auth](https://better-auth.com) for authentication and organization multi-tenancy.

### Key Capabilities
- **OAuth Providers**: Google, GitHub for frictionless sign-in.
- **Magic Links / Email**: Passwordless fallback.
- **Session Management**: Cookie-based HTTP-only session tokens.
- **Organization Plugin**: Multi-seat workspaces allowing agency users to invite team members and assign client-specific Creator Brain permissions.

## 2. Authorization & RBAC
- **Owner**: Full billing, user invitation, and profile deletion rights.
- **Creator / Editor**: Can generate scripts, trigger video renders, and modify brand rules.
- **Viewer / Client**: Read-only access to view rendered videos and copy repurposing text packages.
