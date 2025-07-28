// planningStore.js
import { writable, get } from 'svelte/store';

//======================================================================
// HILFSFUNKTIONEN & KONSTANTEN (früher in utils.js)
//======================================================================

export const alleRessourcen = ['Schirmer 1', 'Vorfertigung', 'AWE-Linie', 'Türen-Linie', 'Fenster-Linie'];
const today = new Date('2025-06-23T10:00:00'); 

function getCalendarWeek(date) {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekStartDate(year, week) {
	const d = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
	const day = d.getUTCDay() || 7;
	if (day !== 1) d.setUTCHours(-24 * (day - 1));
	return d;
}

export function generateWeekOptions() {
	const options = [{ label: 'Alle Wochen anzeigen', identifier: null }];
	const now = new Date();
	for (let i = -4; i <= 20; i++) {
		let dateForWeek = new Date();
		dateForWeek.setDate(now.getDate() + i * 7);
		const year = dateForWeek.getFullYear();
		const week = getCalendarWeek(dateForWeek);
		const weekStartDate = getWeekStartDate(year, week);
		const weekEndDate = new Date(weekStartDate);
		weekEndDate.setDate(weekEndDate.getDate() + 6);
		const identifier = `${year}-${week}`;
		if (!options.some(o => o.identifier === identifier)) {
			options.push({
				label: `KW ${week} (${weekStartDate.toLocaleDateString('de-DE')} - ${weekEndDate.toLocaleDateString('de-DE')})`,
				identifier: identifier
			});
		}
	}
	return options;
}

function generateItemDetails(index, type = 'backlog') {
	const boardStatuses = ['Verplant', 'In Arbeit'];
	const randomDayOffset = Math.floor(Math.random() * 60) - 30;
	const startDate = new Date('2025-06-22T12:00:00');
	startDate.setDate(startDate.getDate() + randomDayOffset);
	const abrufDate = new Date(startDate);
	abrufDate.setDate(startDate.getDate() + (Math.floor(Math.random() * 34) + 7));
	let materialEtaDatum = null;
	let materialManuellVerfuegbar = Math.random() < 0.1;
	if (!materialManuellVerfuegbar && Math.random() < 0.8) {
		const etaDate = new Date(startDate);
		const etaDayOffset = Math.floor(Math.random() * 40) - 30;
		etaDate.setDate(etaDate.getDate() + etaDayOffset);
		materialEtaDatum = etaDate.toISOString().split('T')[0];
	}
	const numPa = Math.floor(Math.random() * 4) + 2;
	const produktionsauftraege = Array(numPa).fill(null).map((_, i) => ({
		id: `PA-${index}-${i}`, name: `Produktionsauftrag ${i + 1}`,
		status: (type === 'backlog' ? 'Geplant' : ['Geplant', 'In Arbeit', 'Erledigt'][Math.floor(Math.random() * 3)]),
		fe: Math.floor(Math.random() * 5) + 1,
		ressource: alleRessourcen[Math.floor(Math.random() * alleRessourcen.length)]
	}));
	return { produktionsauftraege, startDate: startDate.toISOString().split('T')[0], abrufDatum: abrufDate.toISOString().split('T')[0], materialEtaDatum, materialManuellVerfuegbar, hs100: Math.random() > 0.5, dgs: Math.random() > 0.5, schirmer: Math.random() > 0.5, fl: Math.random() > 0.5 ? 'T' : 'F', status: type === 'backlog' ? 'Neu' : boardStatuses[Math.floor(Math.random() * boardStatuses.length)] };
}

function createDefaultCapacities() {
	const defaults = [];
	const resourcesWithCapacity = [
		{ resource: 'Schirmer 1', capacity: 20 }, { resource: 'Vorfertigung', capacity: 20 },
		{ resource: 'AWE-Linie', capacity: 40 }, { resource: 'Türen-Linie', capacity: 30 },
		{ resource: 'Fenster-Linie', capacity: 35 },
	];
	for (let day = 1; day <= 5; day++) { resourcesWithCapacity.forEach(rc => { defaults.push({ type: 'default', dayOfWeek: day, ...rc, status: 'Produktiv' }); }); }
	for (let day of [6, 0]) { alleRessourcen.forEach(r => { defaults.push({ type: 'default', dayOfWeek: day, resource: r, capacity: 0, status: 'Geschlossen' }); }); }
	defaults.push({ type: 'exception', date: '2025-10-03', resource: 'AWE-Linie', capacity: 0, status: 'Feiertag' });
	return defaults;
}

//======================================================================
// STORES & METHODEN (früher in planningStore.js)
//======================================================================

export const cards = writable(Array(30).fill(null).map((_, i) => ({ id: `BTL${String(i + 1).padStart(5, '0')}`, ...generateItemDetails(i, 'board') })));
export const backlogItems = writable(Array(25).fill(null).map((_, i) => ({ id: `BLG${String(i + 1).padStart(3, '0')}`, ...generateItemDetails(i, 'backlog') })));
export const kapazitaeten = writable(createDefaultCapacities());
export const draftCards = writable([]);
export const draftBacklogItems = writable([]);
export const hasPendingChanges = writable(false);
export const selectedWeekIdentifier = writable(`${new Date().getFullYear()}-${getCalendarWeek(new Date())}`);
export const selectedCard = writable(null);
export const isCapacityModalOpen = writable(false);
export const draggingElement = writable(null);
export const dropTargetId = writable(null);
export const dropAfter = writable(false);
export const weekOptions = writable(generateWeekOptions());

export function applyChanges() { cards.set(JSON.parse(JSON.stringify(get(draftCards)))); backlogItems.set(JSON.parse(JSON.stringify(get(draftBacklogItems)))); hasPendingChanges.set(false); }
export function discardChanges() { draftCards.set(JSON.parse(JSON.stringify(get(cards)))); draftBacklogItems.set(JSON.parse(JSON.stringify(get(backlogItems)))); hasPendingChanges.set(false); }
export function handleItemSave(event) { const updatedItemData = event.detail; const listToUpdate = updatedItemData.source === 'board' ? draftCards : draftBacklogItems; listToUpdate.update(items => { const itemIndex = items.findIndex(i => i.id === updatedItemData.id); if (itemIndex !== -1) { items[itemIndex] = updatedItemData; } return items; }); hasPendingChanges.set(true); selectedCard.set(null); }
export function handleCapacityUpdate(event) { kapazitaeten.set(event.detail); isCapacityModalOpen.set(false); }
export function returnCardToBacklog(cardToReturn) { draftBacklogItems.update(items => [...items, { ...cardToReturn, status: 'Neu' }]); draftCards.update(items => items.filter(card => card.id !== cardToReturn.id)); hasPendingChanges.set(true); }
export function navigateToPreviousWeek() { const options = get(weekOptions); const currentIndex = options.findIndex(o => o.identifier === get(selectedWeekIdentifier)); if (currentIndex > 1) { selectedWeekIdentifier.set(options[currentIndex - 1].identifier); } }
export function navigateToNextWeek() { const options = get(weekOptions); const currentIndex = options.findIndex(o => o.identifier === get(selectedWeekIdentifier)); if (currentIndex > -1 && currentIndex < options.length - 1) { selectedWeekIdentifier.set(options[currentIndex + 1].identifier); } }
export function handleDragStart(event, type, item) { draggingElement.set({ type, item }); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', item.id); }
export function handleDrop() { const dragging = get(draggingElement); if (!dragging) return; const itemToMove = dragging.item; if (dragging.type === 'backlog') { draftBacklogItems.update(items => items.filter(i => i.id !== itemToMove.id)); const [year, week] = get(selectedWeekIdentifier).split('-').map(Number); const newItem = { ...itemToMove, startDate: getWeekStartDate(year, week).toISOString().split('T')[0], status: 'Verplant' }; draftCards.update(items => { const targetIndex = items.findIndex(c => c.id === get(dropTargetId)); if (targetIndex !== -1) { items.splice(get(dropAfter) ? targetIndex + 1 : targetIndex, 0, newItem); } else { items.push(newItem); } return items; }); } else if (dragging.type === 'card') { draftCards.update(items => { const fromIndex = items.findIndex(c => c.id === itemToMove.id); if (fromIndex === -1) return items; const [draggedItem] = items.splice(fromIndex, 1); const targetIndex = items.findIndex(c => c.id === get(dropTargetId)); if (targetIndex !== -1) { items.splice(get(dropAfter) ? targetIndex + 1 : targetIndex, 0, draggedItem); } else { items.push(draggedItem); } return items; }); } hasPendingChanges.set(true); }
export function handleDragEnd() { draggingElement.set(null); dropTargetId.set(null); dropAfter.set(false); }
export function handleCardDragOver(event, cardId) { event.preventDefault(); event.stopPropagation(); const dragging = get(draggingElement); if (!dragging || dragging.item.id === cardId) return; const rect = event.currentTarget.getBoundingClientRect(); const isAfter = event.clientY > (rect.top + rect.height / 2); if (get(dropTargetId) !== cardId || get(dropAfter) !== isAfter) { dropTargetId.set(cardId); dropAfter.set(isAfter); } }
export function handleBoardDragOver(event) { event.preventDefault(); if (get(draggingElement) && !event.target.closest('.card')) { dropTargetId.set(null); dropAfter.set(false); } }
export function handleDragLeaveContainer(event) { if (!event.currentTarget.contains(event.relatedTarget)) { dropTargetId.set(null); dropAfter.set(false); } }