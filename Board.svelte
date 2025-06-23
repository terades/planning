<script>
	import { flip } from 'svelte/animate';
	// KORREKTUR: Import der spezifischen Stores und Funktionen aus dem monolithischen Store
	import { 
		draftCards, 
		selectedWeekIdentifier, 
		hasPendingChanges, 
		weekOptions,
		draggingElement,
		dropTargetId,
		dropAfter,
		handleDrop, 
		handleBoardDragOver, 
		handleDragLeaveContainer, 
		handleCardDragOver,
		getCalendarWeek, 
		getMaterialStatus, 
		berechneGesamtFe
	} from './planningStore.js';
	import Card from './Card.svelte';
	
	// KORREKTUR: Lokaler Zustand wird mit 'let' deklariert
	let searchTermBoard = '';
	let activeFiltersBoard = { fl: null, material: null };

	// KORREKTUR: Alle abgeleiteten Werte werden mit reaktiven Statements ($:) deklariert
	$: weekLabel = (() => {
		if (!$selectedWeekIdentifier) return 'Alle Wochen';
		// Das $-Präfix abonniert den weekOptions-Store
		return $weekOptions.find(o => o.identifier === $selectedWeekIdentifier)?.label || '';
	})();

	$: cardsForSelectedWeek = (() => {
		if (!$selectedWeekIdentifier) return $draftCards;
		const [year, week] = $selectedWeekIdentifier.split('-').map(Number);
		return $draftCards.filter(card => {
			if (!card.startDate) return false;
			const cardDate = new Date(card.startDate);
			return cardDate.getFullYear() === year && getCalendarWeek(cardDate) === week;
		});
	})();

	$: filteredCardsForSelectedWeek = cardsForSelectedWeek.filter(card => {
		const searchMatch = searchTermBoard.trim() === '' || card.id.toLowerCase().includes(searchTermBoard.toLowerCase());
		const flMatch = activeFiltersBoard.fl === null || card.fl === activeFiltersBoard.fl;
		const materialMatch = activeFiltersBoard.material === null || getMaterialStatus(card).id === activeFiltersBoard.material;
		return searchMatch && flMatch && materialMatch;
	});
	
	$: displayCards = (() => {
		let itemsToDisplay = [...filteredCardsForSelectedWeek];
		if ($draggingElement) {
			const isDisplayed = itemsToDisplay.some(c => c.id === $draggingElement.item.id);
			if (isDisplayed) {
				itemsToDisplay = itemsToDisplay.filter(c => c.id !== $draggingElement.item.id);
			}

			if ($dropTargetId || ($draggingElement.type === 'backlog' && $dropTargetId === null)) {
				let targetIndex = itemsToDisplay.findIndex(c => c.id === $dropTargetId);
				const placeholder = { id: 'placeholder-card', isPlaceholder: true };
				
				if (targetIndex === -1) {
					if ($draggingElement.type === 'backlog') itemsToDisplay.push(placeholder);
				} else {
					if ($dropAfter) targetIndex++;
					itemsToDisplay.splice(targetIndex, 0, placeholder);
				}
			}
		}
		return itemsToDisplay;
	})();

	$: totalFeFlTrue = filteredCardsForSelectedWeek.filter(card => card.fl === 'T').reduce((sum, card) => sum + berechneGesamtFe(card), 0);
	$: totalFeFlFalse = filteredCardsForSelectedWeek.filter(card => card.fl === 'F').reduce((sum, card) => sum + berechneGesamtFe(card), 0);
</script>

<div class="panel-container" class:is-draft={$hasPendingChanges} on:dragover={handleBoardDragOver} on:dragleave={handleDragLeaveContainer} on:drop={handleDrop}>
	<div class="board-header">
		<h2>Board ({weekLabel})</h2>
		<div class="metrics-wrapper">
			<div class="fl-summary">
				<div class="fl-metric" title="Summe FE für FL = T"><span class="value-fl fl-true">T</span><span class="metric-value">{totalFeFlTrue} FE</span></div>
				<div class="fl-metric" title="Summe FE für FL = F"><span class="value-fl fl-false">F</span><span class="metric-value">{totalFeFlFalse} FE</span></div>
			</div>
		</div>
	</div>

	<div class="filter-controls board-filters">
		<span class="filter-count">({filteredCardsForSelectedWeek.length} / {cardsForSelectedWeek.length})</span>
		<input type="search" class="search-input" placeholder="Board durchsuchen..." bind:value={searchTermBoard}>
		<div class="filter-btn-group">
			<button class="filter-btn" class:active={activeFiltersBoard.fl === null} on:click={() => activeFiltersBoard.fl = null}>Alle</button>
			<button class="filter-btn" class:active={activeFiltersBoard.fl === 'T'} on:click={() => activeFiltersBoard.fl = 'T'}>FL: T</button>
			<button class="filter-btn" class:active={activeFiltersBoard.fl === 'F'} on:click={() => activeFiltersBoard.fl = 'F'}>FL: F</button>
		</div>
		<select class="form-control filter-select" bind:value={activeFiltersBoard.material}>
			<option value={null}>Material: Alle</option>
			<option value="available">Verfügbar</option>
			<option value="ontime">Unterwegs</option>
			<option value="late">Verspätet</option>
			<option value="unknown">Unbekannt</option>
		</select>
	</div>
	
	<div class="items-container cards-container">
		{#each displayCards as card, index (card.id)}
			<div animate:flip={{ duration: 300 }}>
				<Card {card} {index} on:dragover={(e) => handleCardDragOver(e, card.id)} />
			</div>
		{:else}
			<p class="empty-message">Für diese Woche sind keine Karten verplant.</p>
		{/each}
	</div>
</div>

<style>
	.panel-container { border: 1px solid var(--color-neutral-border); border-radius: var(--border-radius-large); box-shadow: var(--shadow-medium); padding: 20px; display: flex; flex-direction: column; min-width: 0; background-color: var(--color-surface); height: 100%; box-sizing: border-box; }
	.panel-container.is-draft { box-shadow: 0 0 0 3px var(--color-on-time), var(--shadow-medium); }
	.board-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 20px; }
	.board-header h2 { font-size: 1.25rem; color: #334; margin: 0; white-space: nowrap; flex-grow: 1; }
	.metrics-wrapper { display: flex; align-items: center; gap: 20px; }
	.fl-summary { display: flex; gap: 16px; }
	.fl-metric { display: flex; align-items: center; gap: 8px; }
	.metric-value { font-size: 1rem; font-weight: 600; color: #343a40; }
	.value-fl { font-size: .9rem !important; padding: 2px 8px; border-radius: 12px; font-weight: 700; }
	.value-fl.fl-true { background-color: #1890ff; color: #fff; }
	.value-fl.fl-false { background-color: #d9d9d9; color: #555; }
	.items-container { overflow-y: auto; flex-grow: 1; padding: 5px; }
	.cards-container { display: grid; grid-auto-rows: min-content; gap: 16px; min-height: 100px; align-content: start; }
	.filter-controls { display: flex; align-items: center; padding: 10px 5px 20px; gap: 10px; flex-wrap: wrap; }
	.filter-count { font-size: 1rem; font-weight: 500; color: #6c757d; margin-right: auto; }
	.search-input { padding: 8px 12px; font-size: .95rem; border: 1px solid var(--color-neutral-border); border-radius: var(--border-radius-base); flex-grow: 1; min-width: 150px; }
	.filter-btn-group { display: flex; border: 1px solid var(--color-neutral-border); border-radius: var(--border-radius-base); overflow: hidden; }
	.filter-btn { padding: 8px 16px; font-size: .9rem; font-weight: 500; background-color: var(--color-surface); color: var(--color-text-secondary); border: none; border-left: 1px solid var(--color-neutral-border); cursor: pointer; transition: background-color .2s ease; }
	.filter-btn:first-child { border-left: none; }
	.filter-btn:hover { background-color: #e9ecef; }
	.filter-btn.active { background-color: var(--color-primary); color: #fff; }
	.filter-select { flex-grow: 1; max-width: 180px; padding: 8px 12px; font-size: .9rem; border: 1px solid var(--color-neutral-border); border-radius: var(--border-radius-base); background-color: var(--color-surface); }
	.empty-message { font-style: italic; color: #999; text-align: center; padding: 20px; }
</style>