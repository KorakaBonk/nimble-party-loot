import { requestTransaction } from '../socket/socket.js';
import type { TxResult } from '../socket/transactions.js';
import type { CoinPurse, LootAction, LootEntry } from '../types.js';
import { announce } from './chat.js';

async function notify(action: LootAction, result: TxResult, success: string): Promise<boolean> {
	if (result.ok) {
		ui.notifications.info(success);
		await announce(action, result.data);
		return true;
	}
	ui.notifications.warn(result.error ?? 'The transfer could not be completed.');
	return false;
}

/** Format a coin bundle like "10 gp, 5 sp" (omitting zeroes). */
export function coinString(coins: Partial<CoinPurse>): string {
	const parts: string[] = [];
	if (coins.gp) parts.push(`${coins.gp} gp`);
	if (coins.sp) parts.push(`${coins.sp} sp`);
	if (coins.cp) parts.push(`${coins.cp} cp`);
	return parts.join(', ') || '0';
}

export async function depositItem(actorId: string, itemId: string, quantity: number) {
	const result = await requestTransaction('depositItem', { actorId, itemId, quantity });
	return notify('depositItem', result, 'Item stashed in party loot.');
}

export async function depositItemSource(uuid: string, quantity: number, name: string) {
	const result = await requestTransaction('depositItemSource', { uuid, quantity });
	return notify('depositItemSource', result, `Added ${quantity}× ${name} to the stash.`);
}

export async function withdrawItem(entry: LootEntry, actorId: string, quantity: number) {
	const result = await requestTransaction('withdrawItem', {
		actorId,
		entryId: entry.entryId,
		quantity,
	});
	return notify('withdrawItem', result, `Took ${quantity}× ${entry.name}.`);
}

export async function depositCurrency(actorId: string, coins: CoinPurse) {
	const result = await requestTransaction('depositCurrency', { actorId, ...coins });
	return notify('depositCurrency', result, `Deposited ${coinString(coins)}.`);
}

export async function withdrawCurrency(actorId: string, coins: CoinPurse) {
	const result = await requestTransaction('withdrawCurrency', { actorId, ...coins });
	return notify('withdrawCurrency', result, `Withdrew ${coinString(coins)}.`);
}

export async function spendCurrency(coins: CoinPurse, reason: string) {
	const result = await requestTransaction('spendCurrency', { ...coins, reason });
	return notify('spendCurrency', result, `Spent ${coinString(coins)} on ${reason}.`);
}

export async function adjustCurrency(deltas: { cp: number; sp: number; gp: number }) {
	const result = await requestTransaction('adjustCurrency', deltas);
	return notify('adjustCurrency', result, 'Stash coins updated.');
}

export async function clearLog() {
	const result = await requestTransaction('clearLog', {});
	return notify('clearLog', result, 'Ledger cleared.');
}
