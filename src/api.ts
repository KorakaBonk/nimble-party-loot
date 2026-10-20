import { LOOT_ITEM_TYPE } from './constants.js';
import PartyLootApp from './apps/PartyLootApp.svelte.js';
import { entryFromItem } from './lib/lootHelpers.js';
import { readStore, writeStore } from './settings.js';
import { addEntry } from './socket/transactions.js';
import type { CoinPurse } from './types.js';

export interface ApiResult {
	ok: boolean;
	error?: string;
}

export interface AddItemOptions {
	/** How many to add. Defaults to the item's own quantity. */
	quantity?: number;
	/** Shown as the depositor. Defaults to the current user's name. */
	depositedBy?: string;
}

/**
 * Add a copy of a Nimble object to the stash, from a document or a uuid. Nothing
 * is removed from the item's owner; callers that move an item delete it themselves.
 * GM only, because the stash is a world setting.
 */
async function addItem(itemOrUuid: any, options: AddItemOptions = {}): Promise<ApiResult> {
	if (!game.user.isGM) return { ok: false, error: 'Only a GM can add items to the party loot.' };

	const item = typeof itemOrUuid === 'string' ? await fromUuid(itemOrUuid) : itemOrUuid;
	if (!item || item.type !== LOOT_ITEM_TYPE) {
		return { ok: false, error: 'Only Nimble objects can go into the party loot.' };
	}

	const quantity = Math.floor(Number(options.quantity ?? item.system?.quantity ?? 1));
	if (!Number.isFinite(quantity) || quantity < 1) return { ok: false, error: 'Nothing to add.' };

	const store = readStore();
	addEntry(store, entryFromItem(item, quantity, options.depositedBy ?? game.user.name));
	await writeStore(store);
	return { ok: true };
}

/** Add coins to the stash. Negative amounts are ignored. GM only. */
async function addCoins(coins: Partial<CoinPurse>): Promise<ApiResult> {
	if (!game.user.isGM) return { ok: false, error: 'Only a GM can add coins to the party loot.' };

	const add = {
		cp: Math.max(0, Math.floor(Number(coins?.cp) || 0)),
		sp: Math.max(0, Math.floor(Number(coins?.sp) || 0)),
		gp: Math.max(0, Math.floor(Number(coins?.gp) || 0)),
	};
	if (add.cp + add.sp + add.gp === 0) return { ok: false, error: 'Nothing to add.' };

	const store = readStore();
	store.currency.cp += add.cp;
	store.currency.sp += add.sp;
	store.currency.gp += add.gp;
	await writeStore(store);
	return { ok: true };
}

/** Published as `game.modules.get('nimble-party-loot').api`. */
export function createApi() {
	return {
		/** Bumped when the API changes in a way callers should check for. */
		version: 1,
		open: () => PartyLootApp.show(),
		toggle: () => PartyLootApp.toggle(),
		app: PartyLootApp,
		addItem,
		addCoins,
	};
}
