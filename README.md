# Nimble Party Loot

A shared party-loot stash for the [Nimble 2](https://github.com/Nimble-Co/FoundryVTT-Nimble) system (0.10.0 or newer) on Foundry VTT v14. Players drag items and coins out of their own character and into a common pool; anyone can take them back out. Every transfer is reconciled against the real inventories and purses involved.

Built with Svelte 5 + Vite + TypeScript to mirror the Nimble system's own stack, and styled with the system's `--nimble-*` design tokens so it reads as native.

## Installation

In Foundry's *Add-on Modules* tab, click *Install Module* and paste this manifest URL:

```
https://github.com/KorakaBonk/nimble-party-loot/releases/latest/download/module.json
```

Then enable **Nimble Party Loot** in your Nimble world.

## What it does

- **Shared window for everyone.** A togglable button in the Token controls (and `Shift+L`) opens one shared window visible to all players.
- **Items.** Drag any Nimble *object* (weapon, armour, shield, consumable, misc) from a character sheet onto the window. You're asked how many to deposit; that quantity leaves the character and joins the pool. Items are grouped by type exactly like the inventory tab.
- **Coins.** Gold, silver and copper are shown as a read-only bar with three actions — **Deposit**, **Withdraw**, and **Spend** — each opening one dialog where you enter all three denominations at once, every field capped at the relevant maximum:
  - **Deposit** moves coins from one of your characters into the pool (capped at that character's holdings).
  - **Withdraw** moves coins from the pool into one of your characters (capped at the pool).
  - **Spend** removes coins from the pool entirely (paid to a merchant, a bribe, etc.) and asks what they're being spent on. No need to withdraw to a sheet first.
- **Spending ledger.** Every Spend is recorded in a shared, persisted ledger — "Hamlin (Bill) spent 10 gp on rope" — collapsible at the bottom of the window and visible to everyone. The GM can clear it.
- **Taking things out.** Drag a loot row onto a character sheet to take the whole stack, or use the row's **Take** button (with the character sheet closed) to choose a quantity and — if you own more than one character — which one receives it.
- **Identified state respected.** Unidentified items show their unidentified name to players; the GM sees the real name and an indicator.
- **Stackables merge.** Identical stackable objects collapse into one quantity in the pool.

## Trust model

The pool lives in a single **world-scoped setting**, which only a GM may write. Player actions are relayed over the module socket to the **active GM**, who validates ownership and caps and performs the write; Foundry then syncs the change to every client. This means:

- A player can only deposit items/coins from a character they own, and only as much as that character has.
- A player can only take loot into a character they own.
- **A GM must be online** for transfers to commit. (If you'd rather players transact without a GM present, that requires the alternative "shared actor with OWNER permission" backend — see the design notes in the source.)

GMs execute their own actions directly and can deposit from any sheet (including NPCs/monsters).

### GM extras

- **Add items from any source.** As GM, drag an item from the **Items sidebar** or a **compendium pack** onto the window. Since there's no owning character, nothing is removed — a copy is added to the pool, and you're asked how many. (Players can still only deposit from a character they own.)
- **Mint coins with no source.** The currency bar has a GM-only "add coins (no source)" panel: enter gp/sp/cp and click **Add** to drop a hoard straight into the stash. Negative values subtract, so it doubles as a correction tool.

## Chat cards

Every move in the party loot gets a chat card in the Nimble style (the same cards Nimble Loot Actor posts): items and coins put in or taken out, coins spent (with the reason), and the GM's extras (adding items or coins from no source, corrections, clearing the ledger). Players speak as the character involved; when a GM acts, the party loot speaks.

Each GM and player decides whether they want to see them: **Configure Settings → Nimble Party Loot → Show party loot in chat** is a per-user setting. Cards are still posted when you turn it off; they are only hidden on your screen.

## API for other modules

`game.modules.get('nimble-party-loot').api` offers:

| Call | What it does |
| --- | --- |
| `version` | `1`. Check it before using the calls below. |
| `open()` / `toggle()` | Open or toggle the party loot window. |
| `addItem(itemOrUuid, { quantity, depositedBy })` | Add a copy of a Nimble object (a document or its uuid) to the stash. `quantity` defaults to the item's own quantity, `depositedBy` to the current user's name. Stackables merge as usual. Nothing is removed from the item's owner. |
| `addCoins({ gp, sp, cp })` | Add coins to the stash. Missing or negative amounts count as zero. |

`addItem` and `addCoins` must run on a GM client, since the stash is a world setting. Both resolve to `{ ok: true }` or `{ ok: false, error }`. They post no chat card, so the calling module can announce the move in its own words.

## Building from source

```
npm ci
npm run build
```

The built module is written to `dist/`. Link or copy that folder into Foundry's `Data/modules/nimble-party-loot`.

## License

[MIT](LICENSE)
