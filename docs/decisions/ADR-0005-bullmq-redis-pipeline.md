# ADR-0005: BullMQ & Redis Job Pipeline for Video Renders

## Status: Accepted

## Context
Rendering a 45-second 1080p vertical video takes between 15 and 45 seconds depending on hardware. HTTP requests cannot stay open synchronously for this duration.

## Decision
Implement a durable asynchronous queue utilizing **BullMQ** backed by **Redis 7**. The web app receives immediate job IDs and polls progress or receives webhooks.

## Consequences
- Resilient retry mechanics for transient render failures.
- Rate limiting and priority queues for paying tiers.
