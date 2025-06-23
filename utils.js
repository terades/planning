// utils.js

// HIER wird die Konstante EINMAL deklariert und exportiert.
export const alleRessourcen = ['Schirmer 1', 'Vorfertigung', 'AWE-Linie', 'Türen-Linie', 'Fenster-Linie'];
const today = new Date('2025-06-23T09:30:00'); // Aktuelle Zeit für konsistente Berechnungen

// --- Datums- und Kalenderfunktionen ---

export function getCalendarWeek(date) {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export function getWeekStartDate(year, week) {
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

// --- Status- und Berechnungsfunktionen ---

export function getAbrufInfo(abrufString) {
	if (!abrufString) return { text: '-', styleClass: 'abruf-ok', tagClass: 'tag-ok' };
	const localToday = new Date(today);
	localToday.setHours(0, 0, 0, 0);
	const abrufDate = new Date(abrufString);
	abrufDate.setHours(0, 0, 0, 0);
	const diffTime = abrufDate.getTime() - localToday.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	if (diffDays < 0) return { text: `-${Math.abs(diffDays)}T`, styleClass: 'abruf-danger', tagClass: 'tag-danger' };
	if (diffDays === 0) return { text: 'Heute', styleClass: 'abruf-warn', tagClass: 'tag-warn' };
	if (diffDays <= 7) return { text: `+${diffDays}T`, styleClass: 'abruf-warn', tagClass: 'tag-warn' };
	return { text: `+${diffDays}T`, styleClass: 'abruf-ok', tagClass: 'tag-ok' };
}

export function getMaterialStatus(item) {
	if (item.materialManuellVerfuegbar) return { id: 'available', text: 'Manuell als verfügbar markiert', shortText: 'Verfügbar ', iconColorClass: 'mat-ok', tagClass: 'tag-ok', icon: 'check' };
	const localToday = new Date(today);
	localToday.setHours(0, 0, 0, 0);
	if (!item.materialEtaDatum) return { id: 'unknown', text: 'ETA Unbekannt', shortText: 'Unbekannt', iconColorClass: 'mat-warn', tagClass: 'tag-warn', icon: 'question' };
	const eta = new Date(item.materialEtaDatum);
	eta.setHours(0, 0, 0, 0);
	const start = new Date(item.startDate);
	start.setHours(0, 0, 0, 0);
	const diffDaysToEta = Math.ceil((eta.getTime() - localToday.getTime()) / (1000 * 60 * 60 * 24));
	if (eta < localToday) return { id: 'available', text: `Verfügbar (seit ${eta.toLocaleDateString('de-DE')})`, shortText: 'Verfügbar', iconColorClass: 'mat-ok', tagClass: 'tag-ok', icon: 'check' };
	if (eta > start) return { id: 'late', text: `ETA: ${eta.toLocaleDateString('de-DE')} (nach Produktionsstart!)`, shortText: `+${diffDaysToEta}T (Spät)`, iconColorClass: 'mat-danger', tagClass: 'tag-danger', icon: 'warning' };
	return { id: 'ontime', text: `ETA: ${eta.toLocaleDateString('de-DE')}`, shortText: `+${diffDaysToEta}T`, iconColorClass: 'mat-on-time', tagClass: 'tag-on-time', icon: 'truck' };
}

export function getCapacityStatus(feValue, capacity) {
	if (feValue === null || !capacity || capacity === 0) return { color: '#555', message: '', isCritical: false };
	const ratio = feValue / capacity;
	if (ratio > 1.2) return { color: 'var(--color-no)', message: 'Kapazität stark überschritten!', isCritical: true };
	if (ratio > 1) return { color: 'var(--color-warn)', message: 'Warnung: Kapazität überschritten', isCritical: true };
	return { color: 'var(--color-yes)', message: 'Auslastung im grünen Bereich', isCritical: false };
}

export function berechneGesamtFe(item) {
	if (!item || !item.produktionsauftraege) return 0;
	return item.produktionsauftraege.reduce((sum, pa) => sum + pa.fe, 0);
}

export function berechneFertigeFe(item) {
	if (!item || !item.produktionsauftraege) return 0;
	return item.produktionsauftraege.filter(pa => pa.status === 'Erledigt').reduce((sum, pa) => sum + pa.fe, 0);
}

export function getKapazitaetForWoche(weekIdentifier, kapazitaeten) {
	const weeklyTotals = {};
	alleRessourcen.forEach(r => weeklyTotals[r] = 0);
	weeklyTotals.gesamt = 0;
	if (!weekIdentifier) return weeklyTotals;
	const [year, week] = weekIdentifier.split('-').map(Number);
	const startDate = getWeekStartDate(year, week);
	for (let i = 0; i < 7; i++) {
		const currentDate = new Date(startDate);
		currentDate.setUTCDate(startDate.getUTCDate() + i);
		const dateString = currentDate.toISOString().split('T')[0];
		const tagesKapa = getTagesKapazitaet(dateString, kapazitaeten);
		alleRessourcen.forEach(r => { weeklyTotals[r] += tagesKapa[r] || 0; });
	}
	weeklyTotals.gesamt = Object.values(weeklyTotals).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
	return weeklyTotals;
}

export function getTagesKapazitaet(dateString, kapaData) {
	const dayOfWeek = new Date(dateString).getUTCDay();
	const tagesKapa = { gesamt: 0 };
	alleRessourcen.forEach(resource => {
		const exception = kapaData.find(k => k.type === 'exception' && k.date === dateString && k.resource === resource);
		if (exception) {
			tagesKapa[resource] = (exception.status === 'Produktiv' ? Number(exception.capacity) : 0);
		} else {
			const defaultKapa = kapaData.find(k => k.type === 'default' && k.dayOfWeek === dayOfWeek && k.resource === resource);
			tagesKapa[resource] = (defaultKapa && defaultKapa.status === 'Produktiv' ? Number(defaultKapa.capacity) : 0);
		}
		tagesKapa.gesamt += tagesKapa[resource] || 0;
	});
	return tagesKapa;
}

// --- HILFSFUNKTIONEN FÜR DATENGENERIERUNG ---

export function generateItemDetails(index, type = 'backlog') {
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

export function createDefaultCapacities() {
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