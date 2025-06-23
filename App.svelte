<script>
	import './styles.css';
	// KORREKTUR: Alle Imports kommen jetzt aus einer einzigen Datei. 'utils.js' wird nicht mehr benötigt.
	import { 
		selectedCard, isCapacityModalOpen, hasPendingChanges, kapazitaeten,
		applyChanges, discardChanges, handleItemSave, handleCapacityUpdate, handleDragEnd,
		alleRessourcen
	} from './planningStore.js';
	import { onMount, onDestroy } from 'svelte';

	import Header from './Header.svelte';
	import Board from './Board.svelte'; 
	import Backlog from './Backlog.svelte';
	import EditItemModal from './EditItemModal.svelte';
	import ResourceCalendarModal from './ResourceCalendarModal.svelte';

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			selectedCard.set(null);
			isCapacityModalOpen.set(false);
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		discardChanges();
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div class="app-container" on:dragend={handleDragEnd}>
	<Header />
	<div class="main-layout"><Backlog /><Board /></div>

	<ResourceCalendarModal
		bind:isOpen={$isCapacityModalOpen}
		initialKapazitaeten={$kapazitaeten}
		{alleRessourcen}
		on:update={handleCapacityUpdate}
	/>

	<EditItemModal
		item={$selectedCard}
		{alleRessourcen}
		on:save={handleItemSave}
		on:close={() => selectedCard.set(null)}
	/>

	{#if $hasPendingChanges}
		<div class="pending-changes-bar">
			<span>Sie haben ungespeicherte Änderungen.</span>
			<div class="buttons">
				<button class="btn btn-secondary" on:click={discardChanges}>Verwerfen</button>
				<button class="btn btn-primary" on:click={applyChanges}>Übernehmen</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: var(--color-background);
	}

	.main-layout {
		display: grid;
		grid-template-columns: 3fr 5fr;
		gap: 25px;
		padding: 20px;
		flex-grow: 1;
		/* Wichtig, damit die Panels scrollen können, ohne die Seite zu verzerren */
		height: auto;
		min-height: 0;
		overflow: hidden;
	}

	.pending-changes-bar {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		background-color: var(--color-text-primary);
		color: white;
		padding: 12px 24px;
		border-radius: var(--border-radius-large);
		box-shadow: var(--shadow-medium);
		display: flex;
		align-items: center;
		gap: 20px;
		z-index: 100;
	}
    .pending-changes-bar .buttons {
        display: flex;
        gap: 10px;
    }
</style>