import './styles.js';
import { createApi } from './api.js';
import PartyLootApp from './apps/PartyLootApp.svelte.js';
import { DRAG_TYPE_WITHDRAW, MODULE_ID } from './constants.js';
import { isNimble } from './lib/actors.js';
import { withdrawItem } from './lib/lootActions.js';
import { registerSocket } from './socket/socket.js';
import { lootStore } from './state/lootStore.svelte.js';
import { readStore, registerSettings } from './settings.js';

Hooks.once('init', () => {
	registerSettings();
	registerSocket();

	game.keybindings.register(MODULE_ID, 'toggle', {
		name: 'NIMBLE_PARTY_LOOT.keybindToggle',
		editable: [{ key: 'KeyL', modifiers: ['Shift'] }],
		onDown: () => {
			PartyLootApp.toggle();
			return true;
		},
	});

	const mod = game.modules.get(MODULE_ID);
	if (mod) mod.api = createApi();
});

Hooks.once('ready', () => {
	if (!isNimble()) {
		ui.notifications.error('Nimble Party Loot requires the Nimble system to be active.');
		return;
	}
	// Seed the reactive store from the persisted setting for this session.
	lootStore.replace(readStore());
});

/**
 * Add a control button to the Token tools group (visible to all users,
 * including players). Uses the record-style controls introduced in v13 and kept
 * in v14; button tools only fire `onChange` (the old `onClick` is gone).
 */
Hooks.on('getSceneControlButtons', (controls: any) => {
	const group = controls.tokens ?? controls.token;
	if (!group?.tools) return;
	group.tools['party-loot'] = {
		name: 'party-loot',
		title: 'NIMBLE_PARTY_LOOT.controlTitle',
		icon: 'fa-solid fa-box-archive',
		button: true,
		visible: true,
		order: 99,
		onChange: () => PartyLootApp.toggle(),
	};
});

/**
 * Withdraw a loot row dropped onto an actor sheet: it is atomically removed
 * from the pool and created on that actor. Drag-to-sheet takes the whole stack;
 * use the in-window "Take" button for partial quantities.
 */
function withdrawDroppedEntry(actor: any, data: any): void {
	const entry = lootStore.items.find((e) => e.entryId === data.entryId);
	if (!entry) {
		ui.notifications.warn('That item is no longer in the stash.');
		return;
	}
	if (!actor?.testUserPermission(game.user, 'OWNER') || actor.type !== 'character') {
		ui.notifications.warn('You can only take loot into a character you own.');
		return;
	}
	void withdrawItem(entry, actor.id, entry.quantity);
}

/**
 * Catch loot rows on their way into any actor sheet, before the sheet's own
 * handlers see them. Nimble 0.10's inventory rows handle every drop themselves
 * (moving items in and out of containers) and stop it there, so a row dropped
 * onto an existing item would never reach `dropActorSheetData`.
 */
Hooks.on('renderActorSheetV2', (sheet: any, element: HTMLElement) => {
	if (!element || element.dataset.nplDropBound) return;
	element.dataset.nplDropBound = 'true';
	element.addEventListener(
		'drop',
		(event: DragEvent) => {
			const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
			if (!data || data.type !== DRAG_TYPE_WITHDRAW) return;
			event.preventDefault();
			event.stopPropagation();
			withdrawDroppedEntry(sheet.actor ?? sheet.document, data);
		},
		{ capture: true },
	);
});

/**
 * Fallback for sheets that are not ActorSheetV2 subclasses but still run the
 * core drop hook. Returning false cancels the sheet's default drop handling.
 */
Hooks.on('dropActorSheetData', (actor: any, _sheet: any, data: any) => {
	if (!data || data.type !== DRAG_TYPE_WITHDRAW) return true;
	withdrawDroppedEntry(actor, data);
	return false;
});
