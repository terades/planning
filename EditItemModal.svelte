<script>
	import { createEventDispatcher } from 'svelte';
	// KORREKTUR: Hilfsfunktionen/Konstanten kommen jetzt aus unserem monolithischen Store
	import { alleRessourcen as defaultRessourcen } from './planningStore.js';

	// KORREKTUR: Props werden mit 'export let' deklariert
	export let item = null;
	export let alleRessourcen = defaultRessourcen;

	const dispatch = createEventDispatcher();

	// KORREKTUR: Lokaler Zustand wird mit 'let' deklariert
	let draftItem = null;

	// KORREKTUR: Der $effect wird durch ein reaktives Statement ($:) ersetzt.
	// Dieser Block wird immer dann ausgeführt, wenn sich die 'item'-Prop ändert.
	$: {
		if (item) {
			// Erstellt eine tiefe Kopie, um das Original-Item im Store nicht direkt zu verändern
			draftItem = JSON.parse(JSON.stringify(item));
		} else {
			draftItem = null;
		}
	}

	function handleSave() {
		dispatch('save', draftItem);
	}

	function handleClose() {
		dispatch('close');
	}

	// Diese Funktionen sind für die klassische Syntax bereits korrekt,
	// da die Neuzuweisung die Reaktivität für das Array auslöst.
	function addPA() {
		const newIndex = draftItem.produktionsauftraege.length;
		draftItem.produktionsauftraege.push({
			id: `PA-${draftItem.id.slice(-3)}-${newIndex}`,
			name: `Neuer PA ${newIndex + 1}`,
			status: 'Geplant',
			fe: 5,
			ressource: alleRessourcen[0]
		});
		draftItem.produktionsauftraege = draftItem.produktionsauftraege;
	}

	function removePA(index) {
		draftItem.produktionsauftraege.splice(index, 1);
		draftItem.produktionsauftraege = draftItem.produktionsauftraege;
	}
</script>

{#if item && draftItem}
<div class="modal-overlay" on:click={handleClose}>
	<div class="modal-content" on:click|stopPropagation>
		<header class="modal-header">
			<h3>Item bearbeiten: {item.id}</h3>
			<button class="close-button" on:click={handleClose}>&times;</button>
		</header>
		<div class="modal-body">
			<form class="edit-form" on:submit|preventDefault={handleSave}>
				<section class="form-section">
					<h4>Allgemeine Informationen</h4>
					<div class="form-grid">
						<div class="form-group">
							<label for="startDate">Startdatum</label>
							<input type="date" id="startDate" bind:value={draftItem.startDate}>
						</div>
						<div class="form-group">
							<label for="abrufDatum">Abrufdatum</label>
							<input type="date" id="abrufDatum" bind:value={draftItem.abrufDatum}>
						</div>
						<div class="form-group">
							<label for="status">Status</label>
							<select id="status" bind:value={draftItem.status}>
								<option value="Neu">Neu</option>
								<option value="Verplant">Verplant</option>
								<option value="In Arbeit">In Arbeit</option>
							</select>
						</div>
						<div class="form-group">
							<label for="fl">FL</label>
							<select id="fl" bind:value={draftItem.fl}>
								<option value="T">T</option>
								<option value="F">F</option>
							</select>
						</div>
					</div>
				</section>

				<section class="form-section">
					<h4>Material</h4>
					<div class="form-grid">
						<div class="form-group">
							<label for="materialEtaDatum">Material ETA</label>
							<input type="date" id="materialEtaDatum" bind:value={draftItem.materialEtaDatum}>
						</div>
						<div class="form-group checkbox-group">
							<input type="checkbox" id="materialManuellVerfuegbar" bind:checked={draftItem.materialManuellVerfuegbar}>
							<label for="materialManuellVerfuegbar">Manuell verfügbar</label>
						</div>
					</div>
				</section>
				
				<section class="form-section">
					<h4>Produktionsaufträge</h4>
					<div class="pa-list">
						{#each draftItem.produktionsauftraege as pa, index (pa.id)}
							<div class="pa-item">
								<input class="pa-name" type="text" bind:value={pa.name} placeholder="PA-Name">
								<input class="pa-fe" type="number" bind:value={pa.fe} min="0">
								<select class="pa-ressource" bind:value={pa.ressource}>
									{#each alleRessourcen as r (r)}
										<option value={r}>{r}</option>
									{/each}
								</select>
								<select class="pa-status" bind:value={pa.status}>
									<option value="Geplant">Geplant</option>
									<option value="In Arbeit">In Arbeit</option>
									<option value="Erledigt">Erledigt</option>
								</select>
								<button type="button" class="btn-remove-pa" on:click={() => removePA(index)}>&times;</button>
							</div>
						{/each}
					</div>
					<button type="button" class="btn btn-secondary" on:click={addPA}>+ PA hinzufügen</button>
				</section>

				<footer class="modal-footer">
					<button type="button" class="btn btn-secondary" on:click={handleClose}>Abbrechen</button>
					<button type="submit" class="btn btn-primary">Änderungen speichern</button>
				</footer>
			</form>
		</div>
	</div>
</div>
{/if}

<style>
	/* Die Stile bleiben unverändert */
	.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
	.modal-content { background-color: var(--color-surface); padding: 25px; border-radius: var(--border-radius-large); box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: 90%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; }
	.modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-neutral-border); padding-bottom: 15px; margin-bottom: 20px; }
	.modal-header h3 { margin: 0; font-size: 1.5rem; color: #334; }
	.close-button { background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--color-text-secondary); }
	.modal-body { overflow-y: auto; padding-right: 15px; }
	.edit-form { display: flex; flex-direction: column; gap: 25px; }
	.form-section h4 { font-size: 1.1rem; color: #495057; margin-bottom: 15px; border-bottom: 1px solid #e9ecef; padding-bottom: 8px; }
	.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
	.form-group { display: flex; flex-direction: column; }
	.form-group label { margin-bottom: 6px; font-weight: 600; font-size: 0.9rem; color: #495057; }
	.form-group input, .form-group select { padding: 10px; border-radius: var(--border-radius-base); border: 1px solid var(--color-neutral-border); font-size: 1rem; background-color: var(--color-surface); color: var(--color-text-primary); }
	.checkbox-group { flex-direction: row; align-items: center; gap: 10px; margin-top: auto;}
	.pa-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
	.pa-item { display: grid; grid-template-columns: 2fr 1fr 2fr 1.5fr auto; gap: 10px; align-items: center; }
	.pa-item input, .pa-item select { padding: 8px; border-radius: 6px; border: 1px solid var(--color-neutral-border); }
	.btn-remove-pa { background: #f8d7da; color: #721c24; border: none; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; cursor: pointer; }
	.modal-footer { display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--color-neutral-border); padding-top: 20px; margin-top: 10px; }
</style>