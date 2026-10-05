# ADR-0004: Dual-Environment Model Gateway Abstraction

## Status: Accepted

## Context
Developers work locally with local gateways (e.g. Antigravity Gateway on Windows at `127.0.0.1:8999`), while production requires reliable cloud providers (DashScope, OpenAI, Anthropic).

## Decision
Implement `@creatoros/model-router` as an abstraction layer. The router seamlessly toggles between `dev` (Antigravity) and `prod` (cloud gateway) based on environment configuration.

## Consequences
- Zero cloud API spend during local testing and development.
- Single codebase for both local development and production deployments.
