<script>
	// KORREKTUR: Wir importieren die benötigten Stores und Hilfsfunktionen direkt.
	import { draftBacklogItems, getMaterialStatus } from './planningStore.js';
	import BacklogItem from './BacklogItem.svelte';

	// KORREKTUR: Lokaler Zustand wird mit 'let' deklariert, ohne $state.
	let searchTermBacklog = '';
	let activeFiltersBacklog = { fl: null, material: null };

	// KORREKTUR: Abgeleiteter Zustand wird mit einem reaktiven Statement ($:) erstellt.
	// Das $-Präfix bei $draftBacklogItems sorgt für die Reaktivität zum Store.
	$: filteredBacklogItems = $draftBacklogItems.filter(item => {
		const searchMatch = searchTermBacklog.trim() === '' || item.id.toLowerCase().includes(searchTermBacklog.toLowerCase());
		const flMatch = activeFiltersBacklog.fl === null || item.fl === activeFiltersBacklog.fl;
		const materialMatch = activeFiltersBacklog.material === null || getMaterialStatus(item).id === activeFiltersBacklog.material;
		return searchMatch && flMatch && materialMatch;
	});
</script>

<div class="panel-container">
	<h2>Backlog ({filteredBacklogItems.length} / {$draftBacklogItems.length})</h2>
	
	<div class="filter-controls">
		<input type="search" class="search-input" placeholder="Backlog durchsuchen..." bind:value={searchTermBacklog}>
		<div class="filter-btn-group">
			<button class="filter-btn" class:active={activeFiltersBacklog.fl === null} on:click={() => activeFiltersBacklog.fl = null}>Alle</button>
			<button class="filter-btn" class:active={activeFiltersBacklog.fl === 'T'} on:click={() => activeFiltersBacklog.fl = 'T'}>FL: T</button>
			<button class="filter-btn" class:active={activeFiltersBacklog.fl === 'F'} on:click={() => activeFiltersBacklog.fl = 'F'}>FL: F</button>
		</div>
		<select class="form-control filter-select" bind:value={activeFiltersBacklog.material}>
			<option value={null}>Material: Alle</option>
			<option value="available">Verfügbar</option>
			<option value="ontime">Unterwegs</option>
			<option value="late">Verspätet</option>
			<option value="unknown">Unbekannt</option>
		</select>
	</div>

	<div class="items-container">
		{#each filteredBacklogItems as item (item.id)}
			<BacklogItem {item} />
		{:else}
			<p class="empty-message">Keine Backlog-Elemente entsprechen Ihren Kriterien.</p>
		{/each}
	</div>
</div>

<style>
	/* Die Stile bleiben unverändert */
	.panel-container { border: 1px solid var(--color-neutral-border); border-radius: var(--border-radius-large); box-shadow: var(--shadow-medium); padding: 20px; display: flex; flex-direction: column; min-width: 0; background-color: var(--color-surface); height: 100%; box-sizing: border-box; }
	.panel-container h2 { font-size: 1.5rem; color: #334; margin: 0 0 10px 0; text-align: center; }
	.items-container { overflow-y: auto; flex-grow: 1; padding: 5px; display: flex; flex-direction: column; gap: 12px; }
	.filter-controls { display: flex; align-items: center; padding: 0 5px 20px; gap: 10px; flex-wrap: wrap; }
	.search-input { padding: 8px 12px; font-size: .95rem; border: 1px solid var(--color-neutral-border); border-radius: var(--border-radius-base); flex-grow: 1; min-width: 150px; }
	.filter-btn-group { display: flex; border: 1px solid var(--color-neutral-border); border-radius: var(--border-radius-base); overflow: hidden; }
	.filter-btn { padding: 8px 16px; font-size: .9rem; font-weight: 500; background-color: var(--color-surface); color: var(--color-text-secondary); border: none; border-left: 1px solid var(--color-neutral-border); cursor: pointer; transition: background-color .2s ease; }
	.filter-btn:first-child { border-left: none; }
	.filter-btn:hover { background-color: #e9ecef; }
	.filter-btn.active { background-color: var(--color-primary); color: #fff; }
	.filter-select { flex-grow: 1; max-width: 180px; padding: 8px 12px; font-size: .9rem; border: 1px solid var(--color-neutral-border); border-radius: var(--border-radius-base); background-color: var(--color-surface); }
	.empty-message { font-style: italic; color: #999; text-align: center; padding: 20px; }
</style>