<script>
	// KORREKTUR: Props werden mit 'export let' deklariert.
	export let item;

	// KORREKTUR: Import der Stores und Funktionen
	import { 
		selectedCard, 
		draggingElement, 
		handleDragStart,
		getAbrufInfo, 
		getMaterialStatus, 
		berechneGesamtFe, 
		berechneFertigeFe, 
		getCalendarWeek 
	} from './planningStore.js';

	// KORREKTUR: Abgeleitete Werte werden mit $: deklariert
	$: abrufInfo = getAbrufInfo(item.abrufDatum);
	$: materialInfo = getMaterialStatus(item);
	$: gesamtFe = berechneGesamtFe(item);
	$: fertigeFe = berechneFertigeFe(item);
</script>

<div
	class="backlog-item {abrufInfo.styleClass}"
	class:is-dragging={$draggingElement?.item.id === item.id}
	draggable="true"
	on:dragstart={(e) => handleDragStart(e, 'backlog', item)}
	on:click={() => selectedCard.set({ ...item, source: 'backlog' })}
>
	<div class="item-grid">
		<div class="data-point align-left">
			<span class="label">ID</span>
			<span class="value">{item.id}</span>
		</div>
		<div class="data-point align-center" title={materialInfo.text}>
			<span class="label">Material</span>
			<div class="icon-value-wrapper {materialInfo.iconColorClass}">
				</div>
			<span class="tag {materialInfo.tagClass}">{materialInfo.shortText}</span>
		</div>
		</div>
</div>

<style>
	.backlog-item { background-color: var(--color-surface); border: 1px solid var(--color-neutral-border); border-left: 5px solid transparent; border-radius: var(--border-radius-base); box-shadow: var(--shadow-light); transition: all .2s ease; cursor: pointer; padding: 12px 15px; }
	.backlog-item:hover { box-shadow: var(--shadow-hover); transform: translateY(-1px); }
	.backlog-item.is-dragging { opacity: .4; transform: rotate(-5deg); cursor: grabbing; }
	.backlog-item.abruf-warn { border-left-color: var(--color-warn); }
	.backlog-item.abruf-danger { border-left-color: var(--color-no); }
	.backlog-item.abruf-ok { border-left-color: var(--color-neutral-border); }
	
	.item-grid { display: grid; grid-template-columns: 1.2fr .8fr .8fr 1.1fr 1.1fr 1fr .5fr; align-items: center; gap: 8px; width: 100%; }
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
	.status-badge.status-neu { background-color: #e9ecef; color: var(--color-text-secondary); }
	.icon-value-wrapper { height: 1.1rem; display: flex; align-items: center; justify-content: center; }
	.icon { width: 22px; height: 22px; stroke-width: 1.5; fill: none; stroke: currentColor; }
	.tag { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; color: #fff; }
	.tag-ok { background-color: var(--color-yes); }
	.tag-warn { background-color: var(--color-warn); color: var(--color-text-primary); }
	.tag-danger { background-color: var(--color-no); }
	.tag-on-time { background-color: var(--color-on-time); }
	.mat-ok { color: var(--color-yes); }
	.mat-on-time { color: var(--color-on-time); }
	.mat-warn { color: var(--color-warn); }
	.mat-danger { color: var(--color-no); }
</style>S