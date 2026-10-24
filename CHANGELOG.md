# Changelog

## 1.0.0

First public release.

- One shared **Party Loot** window for the whole table, opened from the Token controls or with `Shift+L`.
- Players drag Nimble objects from their characters into the pool and take them back out, by dragging a row onto a sheet or with the **Take** button. Stackable objects merge.
- Gold, silver and copper can be deposited, withdrawn, or spent straight from the pool, with every spend recorded in a shared ledger.
- Unidentified objects show their unidentified name to players.
- GMs can add objects from the Items directory or a compendium, and add or correct coins with no source.
- Every move gets a chat card in Nimble's style. Each user chooses whether to see them.
- All transfers are checked and written by the active GM, so a GM must be online.
- An API for other modules (`game.modules.get('nimble-party-loot').api`, version 1) with `open`, `toggle`, `addItem` and `addCoins`.
