# ADR-0006: Better-Auth for Multi-Tenant Authentication

## Status: Accepted

## Context
We need authentication supporting both individual creators (OAuth, email) and agencies (teams, organizations, roles).

## Decision
Adopt **Better-Auth** with the Organization plugin:
- Full TypeScript integration with Drizzle ORM.
- Built-in multi-tenancy and team invitation workflows.

## Consequences
- Rapid setup of authentication without third-party vendor lock-in.
