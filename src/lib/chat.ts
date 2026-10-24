import { DENOMINATIONS, MODULE_ID, SETTING_CHAT_CARDS } from '../constants.js';
import type { ChatData, CoinPurse, LootAction } from '../types.js';

const esc = (value: unknown): string => foundry.utils.escapeHTML(String(value ?? ''));
const t = (key: string, data?: Record<string, unknown>): string =>
	data ? game.i18n.format(key, data) : game.i18n.localize(key);

/** Body class that hides every party loot card on this client. */
const HIDE_CLASS = 'npl-hide-chat-cards';

interface CardParts {
	image?: string;
	icon?: string;
	heading: string;
	subheading: string;
	sections: string[];
}

interface CardContext {
	data: ChatData;
	byGM: boolean;
}

function coinChips(coins: Partial<CoinPurse> | undefined): string {
	return [...DENOMINATIONS]
		.reverse()
		.filter((d) => (coins?.[d] ?? 0) > 0)
		.map(
			(d) =>
				`<span class="npl-chat-coin"><span class="npl-pip npl-pip--${d}"></span>${coins![d]} ${esc(
					t(`NIMBLE.currencyAbbreviations.${d}`),
				)}</span>`,
		)
		.join('');
}

const hasCoins = (coins: Partial<CoinPurse> | undefined): boolean =>
	DENOMINATIONS.some((d) => (coins?.[d] ?? 0) > 0);

const coinRow = (coins: Partial<CoinPurse> | undefined): string =>
	`<div class="npl-chat-coins">${coinChips(coins)}</div>`;

/** The body of a Nimble chat card; the header is added when the message renders. */
function card({ image, icon, heading, subheading, sections }: CardParts): string {
	const art = image
		? `<img class="nimble-chat-card__image" src="${esc(image)}" alt="" />`
		: `<i class="nimble-chat-card__image nimble-chat-card__image--fa-icon ${icon}" inert></i>`;
	return `<article class="nimble-chat-card__body npl-chat-body">
		<header class="nimble-chat-card__body-header">
			${art}
			<div class="nimble-chat-card__title-wrapper">
				<h3 class="nimble-chat-card__title">${heading}</h3>
				<h4 class="nimble-chat-card__meta">${subheading}</h4>
			</div>
		</header>
		${sections
			.filter(Boolean)
			.map((html) => `<section class="nimble-card-section">${html}</section>`)
			.join('')}
	</article>`;
}

const itemHeading = (data: ChatData): string =>
	(data.quantity ?? 1) > 1 ? `${data.quantity}× ${esc(data.itemName)}` : esc(data.itemName);
const strong = (value: unknown): string => `<strong>${esc(value)}</strong>`;
const toLoot = (): string => esc(t('NIMBLE_PARTY_LOOT.chat.toLoot'));
const fromLoot = (): string => esc(t('NIMBLE_PARTY_LOOT.chat.fromLoot'));
/** The GM gets wording of their own: they hand loot out rather than take it. */
const chatKey = (name: string, byGM: boolean): string =>
	`NIMBLE_PARTY_LOOT.chat.${byGM ? 'gm.' : ''}${name}`;

const builders: Partial<Record<LootAction, (ctx: CardContext) => string>> = {
	depositItem: ({ data, byGM }) =>
		card({
			image: data.img,
			heading: itemHeading(data),
			subheading: toLoot(),
			sections: [
				`<p>${t(chatKey('depositItem', byGM), {
					character: strong(data.characterName),
					item: `<strong>${itemHeading(data)}</strong>`,
				})}</p>`,
			],
		}),

	depositItemSource: ({ data }) =>
		card({
			image: data.img,
			heading: itemHeading(data),
			subheading: toLoot(),
			sections: [
				`<p>${t('NIMBLE_PARTY_LOOT.chat.gm.addItem', {
					item: `<strong>${itemHeading(data)}</strong>`,
				})}</p>`,
			],
		}),

	withdrawItem: ({ data, byGM }) =>
		card({
			image: data.img,
			heading: itemHeading(data),
			subheading: fromLoot(),
			sections: [
				`<p>${t(chatKey('withdrawItem', byGM), {
					character: strong(data.characterName),
					item: `<strong>${itemHeading(data)}</strong>`,
				})}</p>`,
			],
		}),

	depositCurrency: ({ data, byGM }) =>
		card({
			icon: 'fa-solid fa-coins',
			heading: esc(t('NIMBLE_PARTY_LOOT.chat.depositCoinsTitle')),
			subheading: toLoot(),
			sections: [
				`<p>${t(chatKey('depositCoins', byGM), { character: strong(data.characterName) })}</p>${coinRow(
					data.coins,
				)}`,
			],
		}),

	withdrawCurrency: ({ data, byGM }) =>
		card({
			icon: 'fa-solid fa-coins',
			heading: esc(t(chatKey('withdrawCoinsTitle', byGM))),
			subheading: fromLoot(),
			sections: [
				`<p>${t(chatKey('withdrawCoins', byGM), { character: strong(data.characterName) })}</p>${coinRow(
					data.coins,
				)}`,
			],
		}),

	spendCurrency: ({ data, byGM }) =>
		card({
			icon: 'fa-solid fa-cart-shopping',
			heading: esc(t('NIMBLE_PARTY_LOOT.chat.spendTitle')),
			subheading: fromLoot(),
			sections: [
				`<p>${t(chatKey('spendCoins', byGM), {
					character: strong(data.characterName || game.user.name),
					reason: strong(data.reason),
				})}</p>${coinRow(data.coins)}`,
			],
		}),

	adjustCurrency: ({ data }) =>
		card({
			icon: 'fa-solid fa-scale-balanced',
			heading: esc(t('NIMBLE_PARTY_LOOT.chat.adjustTitle')),
			subheading: esc(t('NIMBLE_PARTY_LOOT.chat.partyLoot')),
			sections: [
				hasCoins(data.coins)
					? `<p>${esc(t('NIMBLE_PARTY_LOOT.chat.gm.addCoins'))}</p>${coinRow(data.coins)}`
					: '',
				hasCoins(data.removed)
					? `<p>${esc(t('NIMBLE_PARTY_LOOT.chat.gm.removeCoins'))}</p>${coinRow(data.removed)}`
					: '',
			],
		}),

	clearLog: ({ data }) =>
		card({
			icon: 'fa-solid fa-broom',
			heading: esc(t('NIMBLE_PARTY_LOOT.chat.clearLogTitle')),
			subheading: esc(t('NIMBLE_PARTY_LOOT.chat.partyLoot')),
			sections: [`<p>${esc(t('NIMBLE_PARTY_LOOT.chat.gm.clearLog', { count: data.count ?? 0 }))}</p>`],
		}),
};

/**
 * Tell the table what just happened in the party loot. Players speak as the
 * character involved; when the GM acts, the party loot itself speaks.
 * Cards are always posted; each user decides whether to see them.
 */
export async function announce(action: LootAction, data: ChatData | undefined): Promise<void> {
	const build = builders[action];
	if (!build || !data) return;

	const byGM = !!game.user.isGM;
	const ChatMessage = CONFIG.ChatMessage.documentClass;
	const actor = data.actorId ? game.actors.get(data.actorId) : null;
	const speaker = byGM
		? ChatMessage.getSpeaker({ alias: t('NIMBLE_PARTY_LOOT.appTitle') })
		: ChatMessage.getSpeaker({ actor });

	try {
		await ChatMessage.create({
			content: build({ data, byGM }),
			speaker,
			flags: { [MODULE_ID]: { action, card: 1 } },
		});
	} catch (error) {
		// The transfer itself already succeeded; a missing card is not worth an error toast.
		console.warn(`${MODULE_ID} | Could not post the chat card.`, error);
	}
}

/** Show or hide party loot cards on this client, following the user's setting. */
export function applyChatCardVisibility(show: boolean = game.settings.get(MODULE_ID, SETTING_CHAT_CARDS)): void {
	document.body.classList.toggle(HIDE_CLASS, !show);
}

/** Nimble picks header text that stays readable on the author's colour. */
function headerTextColor(color: any): string {
	const { r = 0, g = 0, b = 0 } = color ?? {};
	return r * 0.2126 + g * 0.7152 + b * 0.0722 >= 0.6 ? 'hsl(50, 14%, 9%)' : 'hsl(38, 38%, 94%)';
}

/**
 * Give party loot messages the frame Nimble's own chat cards have: a header in
 * the author's colour with the speaker, time and delete button, over a bordered body.
 */
export function renderLootMessage(message: any, html: HTMLElement | any): void {
	const element: HTMLElement | undefined = html instanceof HTMLElement ? html : html?.[0];
	const flags = message?.flags?.[MODULE_ID];
	if (!element || !flags?.action) return;

	const color = message.author?.color;
	element.classList.add('nimble-chat-card', 'npl-chat-message');
	if (color) {
		element.style.setProperty('--nimble-user-background-color', color.css ?? String(color));
		element.style.setProperty('--nimble-user-text-color', headerTextColor(color));
	}

	const speaker = message.speaker?.alias || message.author?.name || '';
	const header = document.createElement('header');
	header.className = 'nimble-chat-card__header';
	header.innerHTML = `<span>${esc(speaker)}</span>
		<time class="message-timestamp">${esc(foundry.utils.timeSince(message.timestamp))}</time>`;

	if (message.canUserModify?.(game.user, 'delete')) {
		const remove = document.createElement('button');
		remove.type = 'button';
		remove.className = 'nimble-u-unstyled-button message-delete';
		remove.setAttribute('aria-label', game.i18n.localize('Delete'));
		remove.innerHTML = '<i class="fas fa-trash" inert></i>';
		remove.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			message.delete();
		});
		header.append(remove);
	}

	element.querySelector('.message-header')?.replaceWith(header);
}
