# Nouri Product Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the authenticated Nouri PWA feel like a polished commercial mobile product while preserving the working Supabase-backed MVP behavior.

**Architecture:** Presentation-layer refinement only. Existing authentication, database, realtime synchronization, pantry, grocery, meal, expiry, and consumption logic remain the source of truth; visual changes are isolated in the Nouri polish stylesheet and branding/PWA assets.

**Tech Stack:** Static HTML/CSS/ES modules, Supabase, GitHub Pages PWA.

**Spec:** Approved Nouri product-polish design from the September 15, 2026 conversation.

## Global Constraints

- Product name: **Nouri**.
- Tagline: **Eat smarter. Waste less.**
- Preserve all existing MVP functionality.
- Keep the app mobile-first and installable as a PWA.
- Do not add a public marketing landing page in this pass.
- Avoid introducing a package/build dependency.

---

## Tasks

- [x] Add automated acceptance checks for the Nouri visual system and mobile touch targets.
- [x] Refine the Nouri visual layer with stronger hierarchy, branded surfaces, card treatment, dashboard stat accents, and mobile spacing.
- [x] Verify the visual acceptance tests after the CSS change.
- [ ] Pull the changes locally and perform browser/iPhone smoke testing.
- [ ] Reassess the dashboard/mobile UX for the next polish pass.
