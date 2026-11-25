# Quick Grid integration contract

**Status:** proposal for review. No simulator code or configuration has been changed.

## Current boundary

Quick Grid owns its player accounts, online lobbies, tournament sessions, and simulator telemetry. Grid Manager owns licensed pilots, categories, seasons, official race records, and official points. The two products currently have separate identity and scoring models.

The simulator's player profile contains a username and pilot name. Those display fields are not a safe identity key. Link a simulator account to a Grid Manager pilot only through an explicit, auditable association approved by the account holder and an administrator. Never match pilots by name alone or reuse the simulator's session cookie in Grid Manager.

The simulator's online tournament scoring is separate from Grid Manager's category and season scoring. A result imported from Quick Grid should carry the finishing position and race status. Grid Manager must calculate official points using the selected season's effective scoring profile.

## Proposed exchange

1. An administrator links one Quick Grid account to one Grid Manager pilot after the account holder confirms the link.
2. An administrator maps an eligible Quick Grid tournament to an existing Grid Manager season and race.
3. After a race finishes, Quick Grid's server sends a signed result summary to a dedicated Grid Manager integration endpoint.
4. Grid Manager validates the account links, season, category, license, race status, and participant results before creating records.
5. Grid Manager returns an acknowledgement containing the external race identifier and the created or rejected result identifiers.

The exchange should be server-to-server over HTTPS. It should use a dedicated integration credential, a request timestamp, an HMAC signature, replay protection, and an idempotency key. The credential must be separate from Quick Grid's telemetry-ingest secret and from human administrator credentials.

## Result fields to agree

The event should include:

- a stable simulator account identifier for each participant;
- an external tournament and race identifier;
- the mapped Grid Manager season and race identifiers;
- finishing position and final status, including DNF and disqualification;
- lap count and best-lap time when the simulator has them;
- simulator build and track identifiers for traceability;
- race start and finish timestamps with an explicit timezone;
- an idempotency key and signature metadata.

Grid Manager should reject unknown or unlinked accounts, mismatched categories or seasons, duplicate external results, and races that are not eligible for official scoring. Corrections should be auditable and use the existing administrator-controlled result update flow.

Raw 10 Hz telemetry should remain in Quick Grid's telemetry store. The first integration should transfer race summaries only. A later telemetry-sharing contract would need separate consent, retention, access, and privacy rules.

## Open decisions before implementation

- Whether an administrator approves every account link or approves only the first link for a player.
- Whether imported races are immediately official or require an administrator to publish the result.
- Which Quick Grid tournament formats can map to a Grid Manager race type.
- The retention policy for the account-link record and imported simulator identifiers.
- Whether the backend will add a dedicated integration role and endpoint, separate from human ADMIN mutations.

## Simulator references reviewed

- [Player accounts](https://github.com/Quick-grid/simulator/blob/main/docs/player_accounts.md)
- [Online multiplayer](https://github.com/Quick-grid/simulator/blob/main/docs/online_multiplayer.md)
- [Machine-learning telemetry](https://github.com/Quick-grid/simulator/blob/main/docs/ml_telemetry.md)
- [Authentication router](https://github.com/Quick-grid/simulator/blob/main/server/src/auth/router.js)
