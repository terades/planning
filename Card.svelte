<script>
	import { flip } from 'svelte/animate';
	// KORREKTUR: Import der spezifischen Stores und Funktionen
	import { selectedCard, draggingElement, handleDragStart, returnCardToBacklog } from './planningStore.js';
	// KORREKTUR: Hilfsfunktionen kommen ebenfalls aus dem monolithischen Store
	import { getAbrufInfo, getMaterialStatus, berechneGesamtFe, berechneFertigeFe, getCalendarWeek } from './planningStore.js';

	let { card, index } = $props();
	
	// Die Berechnungen sind jetzt wieder reaktive Deklarationen ($:), die auf die Store-Werte ($) lauschen.
	$: abrufInfo = card.isPlaceholder ? { styleClass: '' } : getAbrufInfo(card.abrufDatum);
	$: materialInfo = card.isPlaceholder ? { text: '', iconColorClass: '', tagClass: '', shortText: '' } : getMaterialStatus(card);
	$: gesamtFe = card.isPlaceholder ? 0 : berechneGesamtFe(card);
	$: fertigeFe = card.isPlaceholder ? 0 : berechneFertigeFe(card);
</script>

<div
	class="card {abrufInfo.styleClass}"
	class:placeholder={card.isPlaceholder}
	class:card-fl-true={!card.isPlaceholder && card.fl === 'T'}
	class:is-dragging={!card.isPlaceholder && $draggingElement?.item.id === card.id}
	draggable={!card.isPlaceholder}
	on:dragstart={(e) => { if (!card.isPlaceholder) handleDragStart(e, 'card', card); }}
	on:click={() => { if (!card.isPlaceholder) selectedCard.set({ ...card, source: 'board' }); }}
>
	{#if !card.isPlaceholder}
		<button class="remove-card-button" title="Zurück ins Backlog" on:click|stopPropagation={() => returnCardToBacklog(card)}>&times;</button>
		<div class="item-grid">
			<div class="data-point align-center">
				<span class="label">Start / KW</span>
				<span class="value date-value">{new Date(card.startDate).toLocaleDateString('de-DE')}</span>
				<span class="kw-badge">KW {getCalendarWeek(new Date(card.startDate))}</span>
			</div>
			</div>
	{/if}
</div>

<style>
	/* Die Stile bleiben identisch zur vorherigen Version */
	.card { 
		position: relative; 
		background-color: var(--color-surface); 
		border: 1px solid var(--color-neutral-border); 
		border-left: 5px solid transparent; 
		border-radius: var(--border-radius-base); 
		box-shadow: var(--shadow-light); 
		transition: all .2s ease; 
		padding: 12px 15px; 
		min-height: 100px; 
		display: flex; 
		align-items: center; 
		box-sizing: border-box;
	}
	.card:not(.placeholder) {
		cursor: pointer;
	}
	.card:not(.placeholder):hover { 
		box-shadow: var(--shadow-hover); 
		transform: translateY(-1px); 
	}
	.card.is-dragging { 
		opacity: .4; 
		transform: rotate(5deg); 
		cursor: grabbing; 
	}
	.card.placeholder { 
		background-color: rgba(0, 123, 255, 0.1); 
		border: 2px dashed var(--color-primary); 
		box-shadow: none; 
	}
	.card.abruf-warn { border-left-color: var(--color-warn); }
	.card.abruf-danger { border-left-color: var(--color-no); }
	.card.abruf-ok { border-left-color: var(--color-neutral-border); }
	.card.card-fl-true { background-color: #e6f7ff; border-color: #91d5ff; }
	.remove-card-button { position: absolute; top: 8px; right: 8px; z-index: 10; background: none; border: none; font-size: 1.5rem; color: #aaa; cursor: pointer; padding: 0; width: 28px; height: 28px; line-height: 28px; border-radius: 50%; transition: all .2s ease; }
	.remove-card-button:hover { color: var(--color-no); background-color: #fbebee; }
	.item-grid { display: grid; grid-template-columns: 1.2fr .8fr .8fr 1.1fr 1.1fr 1fr .6fr .6fr .6fr .5fr; align-items: center; gap: 8px; width: 100%; }
	.data-point { display: flex; flex-direction: column; gap: 4px; }
	.data-point.align-left { align-items: flex-start; text-align: left; }
	.data-point.align-center { align-items: center; text-align: center; }
	.data-point.align-right { align-items: flex-end; text-align: right; }
	.label { font-size: .7rem; color: var(--color-text-secondary); font-weight: 500; text-transform: uppercase; letter-spacing: .5px; white-space: nowrap; }
	.value { font-size: 1.1rem; font-weight: 600; color: var(--color-text-primary); line-height: 1.2; }
	.align-left .value { font-size: .9rem; font-weight: 700; color: #0056b3; }
	.date-value { font-size: .9rem !important; font-weight: 600; }
	.kw-badge { font-size: .7rem !important; font-weight: 700; color: var(--color-text-secondary); background-color: #e9ecef; padding: 2px 6px; border-radius: 4px; margin-top: 4px; }
	.progress-bar { width: 100%; height: 6px; background-color: #e9ecef; border-radius: 3px; overflow: hidden; margin-top: 4px; }
	.progress-bar-inner { height: 100%; background-color: var(--color-yes); border-radius: 3px; transition: width .4s ease; }
	.value-fl { font-size: .9rem !important; padding: 2px 8px; border-radius: 12px; font-weight: 700; }
	.value-fl.fl-true { background-color: #1890ff; color: #fff; }
	.value-fl.fl-false { background-color: #d9d9d9; color: #555; }
	.status-badge { font-size: .75rem !important; padding: 4px 10px; border-radius: 12px; font-weight: 700; width: fit-content; margin: 0; }
	.status-badge.status-verplant { background-color: #fff3cd; color: #856404; }
	.status-badge.status-in-arbeit { background-color: #cce5ff; color: #004085; }
	.icon-value-wrapper { height: 1.1rem; display: flex; align-items: center; justify-content: center; }
	.icon { width: 22px; height: 22px; stroke-width: 1.5; fill: none; stroke: currentColor; }
	.icon-yes { stroke: var(--color-yes); stroke-width: 2.5; }
	.icon-no { stroke: var(--color-no); stroke-width: 2.5; }
	.tag { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; color: #fff; }
	.tag-ok { background-color: var(--color-yes); }
	.tag-warn { background-color: var(--color-warn); color: var(--color-text-primary); }
	.tag-danger { background-color: var(--color-no); }
	.tag-on-time { background-color: var(--color-on-time); }
	.mat-ok { color: var(--color-yes); }
	.mat-on-time { color: var(--color-on-time); }
	.mat-warn { color: var(--color-warn); }
	.mat-danger { color: var(--color-no); }
</style>