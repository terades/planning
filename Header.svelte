<script>
	import { 
		selectedWeekIdentifier, draftCards, kapazitaeten, isCapacityModalOpen,
		weekOptions, navigateToPreviousWeek, navigateToNextWeek
	} from './planningStore.js';
	import { 
		getKapazitaetForWoche, getCapacityStatus, berechneGesamtFe,
		getCalendarWeek, alleRessourcen
	} from './utils.js';

	// Reaktivität wird jetzt durch die $-Präfixe hergestellt. $derived ist nicht mehr nötig.
	$: aktuelleWochenKapazitaet = getKapazitaetForWoche($selectedWeekIdentifier, $kapazitaeten);

	$: cardsForSelectedWeek = (() => {
		if (!$selectedWeekIdentifier) return $draftCards;
		const [year, week] = $selectedWeekIdentifier.split('-').map(Number);
		return $draftCards.filter(card => {
			if (!card.startDate) return false;
			const cardDate = new Date(card.startDate);
			return cardDate.getFullYear() === year && getCalendarWeek(cardDate) === week;
		});
	})();

	$: currentTotalFe = cardsForSelectedWeek.reduce((sum, card) => sum + berechneGesamtFe(card), 0);
	$: capacityStatus = getCapacityStatus(currentTotalFe, aktuelleWochenKapazitaet.gesamt);
	$: displayCapacityPercentage = aktuelleWochenKapazitaet.gesamt > 0 ? Math.min((currentTotalFe) / aktuelleWochenKapazitaet.gesamt * 100, 125) : 0;
	$: displayCapacityMessage = `Kapazität KW ${$selectedWeekIdentifier?.split('-')[1] || ''}: ${aktuelleWochenKapazitaet.gesamt} FE`;

	$: ressourcenAuslastung = (() => {
		const auslastung = {};
		alleRessourcen.forEach(r => {
			auslastung[r] = { planned: 0, capacity: aktuelleWochenKapazitaet[r] || 0 };
		});
		cardsForSelectedWeek.forEach(card => {
			card.produktionsauftraege.forEach(pa => {
				if(auslastung.hasOwnProperty(pa.ressource)) {
					auslastung[pa.ressource].planned += pa.fe;
				}
			});
		});
		return Object.entries(auslastung).map(([name, {planned, capacity}]) => ({ name, planned, capacity }));
	})();
</script>

<header class="app-header">
	<div class="header-center">
		<div class="week-navigator">
			<button class="week-nav-btn" on:click={navigateToPreviousWeek}>&lt;</button>
			<select class="week-selector" bind:value={$selectedWeekIdentifier}>
				{#each $weekOptions as option (option.identifier)}
					<option value={option.identifier}>{option.label}</option>
				{/each}
			</select>
			<button class="week-nav-btn" on:click={navigateToNextWeek}>&gt;</button>
		</div>
		</div>
</header>

<style>
	/* Die Stile bleiben unverändert */
	.app-header {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		padding: 10px 24px;
		background-color: var(--color-surface);
		border-bottom: 1px solid #dee2e6;
		height: 75px;
		box-sizing: border-box;
		gap: 20px;
	}
	.header-left { display: flex; align-items: center; gap: 15px; }
	.header-center { justify-self: center; display: flex; align-items: center; gap: 25px; }
	.header-right { justify-self: end; }
	.header-title { font-size: 1.5rem; font-weight: 600; color: #334; }
	.user-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; background-color: #e9ecef; color: #495057; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; box-shadow: 0 0 5px rgba(0,0,0,.1); }
	.week-navigator { display: flex; align-items: center; gap: 0; }
	.week-nav-btn { background-color: #f8f9fa; border: 1px solid var(--color-neutral-border); padding: 8px 12px; font-size: 1rem; font-weight: 700; cursor: pointer; height: 43px; }
	.week-nav-btn:first-child { border-radius: var(--border-radius-base) 0 0 var(--border-radius-base); border-right: none; }
	.week-nav-btn:last-child { border-radius: 0 var(--border-radius-base) var(--border-radius-base) 0; border-left: none; }
	.week-nav-btn:hover { background-color: #e9ecef; }
	.week-selector { padding: 8px 12px; font-size: 1rem; border: 1px solid var(--color-neutral-border); border-left: none; border-right: none; background-color: var(--color-surface); min-width: 280px; height: 43px; -webkit-appearance: none; -moz-appearance: none; appearance: none; text-align: center; }
	.header-capacity { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid #e0e5ea; border-radius: var(--border-radius-base); }
	.header-capacity-text { font-size: .9rem; font-weight: 700; white-space: nowrap; }
	.header-capacity-text.pulse-warning { animation: pulse-warning 1.5s infinite ease-in-out; }
	.header-capacity-bar-outer { width: 80px; height: 8px; background-color: #e9ecef; border-radius: 4px; overflow: hidden; }
	.header-capacity-bar-inner { height: 100%; border-radius: 4px; transition: width .3s ease, background-color .3s ease; }
	
	.sub-header.resource-planning-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background-color: #e9ecef; border-bottom: 1px solid #dee2e6; gap: 20px; flex-wrap: wrap; }
	.resource-items-wrapper { display: flex; flex-wrap: wrap; gap: 20px; flex-grow: 1; justify-content: center; }
	.resource-item { flex: 1; min-width: 180px; padding: 8px 12px; border: 1px solid #ccc; border-radius: var(--border-radius-base); background-color: #f8f9fa; transition: background-color .3s ease; }
	.resource-item.overloaded { background-color: #fbebee; border-color: var(--color-no); }
	.resource-info { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; font-size: 0.9rem; }
	.resource-name { font-weight: 600; color: #343a40; }
	.resource-load { font-weight: 500; color: #6c757d; }
	.overloaded .resource-load { color: var(--color-no); font-weight: 700; }
	.resource-bar-outer { width: 100%; height: 8px; background-color: #dbe1e6; border-radius: 4px; overflow: hidden; }
	.resource-bar-inner { height: 100%; background-color: var(--color-yes); border-radius: 4px; transition: width .3s ease; }
	.overloaded .resource-bar-inner { background-color: var(--color-no); }
</style>