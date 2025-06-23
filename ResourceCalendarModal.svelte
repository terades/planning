<script>
	import { createEventDispatcher } from 'svelte';
	// KORREKTUR: Wir importieren die Konstante aus unserem monolithischen Store.
	import { alleRessourcen as defaultRessourcen } from './planningStore.js';

	// KORREKTUR: Props werden mit 'export let' deklariert.
	export let isOpen = false;
	export let initialKapazitaeten = [];
	export let alleRessourcen = defaultRessourcen;

	const dispatch = createEventDispatcher();

	// KORREKTUR: Lokaler Zustand wird mit 'let' deklariert.
	let viewDate = new Date('2025-06-23');
	let draftKapazitaeten = [];
	let selectedDate = null;

	// KORREKTUR: Der $effect wird durch ein reaktives Statement ($:) ersetzt,
	// das auf Änderungen der 'isOpen'-Prop reagiert.
	$: if (isOpen) {
		draftKapazitaeten = JSON.parse(JSON.stringify(initialKapazitaeten));
		selectedDate = null;
	}

	// KORREKTUR: $derived.by wird durch ein reaktives Statement ($:) ersetzt.
	// Es wird neu berechnet, wenn sich 'viewDate' ändert.
	$: calendarData = (() => {
		const year = viewDate.getFullYear();
		const month = viewDate.getMonth();
		const firstDayOfMonth = new Date(year, month, 1);
		const lastDayOfMonth = new Date(year, month + 1, 0);
		let days = [];
		let startDayOfWeek = firstDayOfMonth.getDay();
		if (startDayOfWeek === 0) startDayOfWeek = 7;
		const prevMonthLastDay = new Date(year, month, 0);
		for (let i = startDayOfWeek - 2; i >= 0; i--) {
			const day = new Date(prevMonthLastDay);
			day.setDate(day.getDate() - i);
			days.push({ date: day, isCurrentMonth: false });
		}
		for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
			days.push({ date: new Date(year, month, i), isCurrentMonth: true });
		}
		let endDayOfWeek = lastDayOfMonth.getDay();
		if (endDayOfWeek === 0) endDayOfWeek = 7;
		if (endDayOfWeek !== 7) {
			for (let i = 1; i <= 7 - endDayOfWeek; i++) {
				days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
			}
		}
		return days.map(d => ({ ...d, dateString: d.date.toISOString().split('T')[0] }));
	})();

	// KORREKTUR: $derived.by wird durch ein reaktives Statement ($:) ersetzt.
	// Es wird neu berechnet, wenn sich 'selectedDate' oder 'draftKapazitaeten' ändern.
	$: selectedDayCapacities = (() => {
		if (!selectedDate) return null;
		const dayOfWeek = new Date(selectedDate).getUTCDay();
		let capacities = [];
		alleRessourcen.forEach(resource => {
			let exception = draftKapazitaeten.find(k => k.type === 'exception' && k.date === selectedDate && k.resource === resource);
			if (exception) {
				capacities.push({ ...exception, isException: true });
			} else {
				let defaultKapa = draftKapazitaeten.find(k => k.type === 'default' && k.dayOfWeek === dayOfWeek && k.resource === resource);
				capacities.push({ date: selectedDate, resource: resource, capacity: defaultKapa?.capacity ?? 0, status: defaultKapa?.status ?? 'Geschlossen', isException: false, type: 'exception' });
			}
		});
		return capacities;
	})();

	function changeMonth(amount) {
		const newDate = new Date(viewDate);
		newDate.setMonth(viewDate.getMonth() + amount);
		viewDate = newDate;
	}

	function selectDay(dateString) {
		selectedDate = dateString;
	}

	function updateCapacity(resource, newCapacity) {
		let exceptionIndex = draftKapazitaeten.findIndex(k => k.type === 'exception' && k.date === selectedDate && k.resource === resource);
		if (exceptionIndex === -1) {
			const newException = { type: 'exception', date: selectedDate, resource: resource, capacity: newCapacity, status: newCapacity > 0 ? 'Produktiv' : 'Geschlossen' };
			draftKapazitaeten.push(newException);
		} else {
			draftKapazitaeten[exceptionIndex].capacity = newCapacity;
			draftKapazitaeten[exceptionIndex].status = newCapacity > 0 ? 'Produktiv' : 'Geschlossen';
		}
		// Neuzuweisung, um Reaktivität auszulösen (korrekt für klassische Syntax)
		draftKapazitaeten = [...draftKapazitaeten];
	}

	function handleSave() {
		dispatch('update', draftKapazitaeten);
		handleClose();
	}
	
	function handleClose() {
		dispatch('close');
	}
</script>

{#if isOpen}
<div class="modal-overlay" on:click={handleClose}>
	<div class="modal-content" on:click|stopPropagation>
		<header class="modal-header">
			<h3>Ressourcen-Kalender</h3>
			<button class="close-button" on:click={handleClose}>&times;</button>
		</header>
		<div class="modal-body">
			<div class="calendar-container">
				<div class="calendar-header">
					<button on:click={() => changeMonth(-1)}>&lt;</button>
					<span>{viewDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</span>
					<button on:click={() => changeMonth(1)}>&gt;</button>
				</div>
				<div class="calendar-grid">
					<div class="weekday">Mo</div><div class="weekday">Di</div><div class="weekday">Mi</div><div class="weekday">Do</div><div class="weekday">Fr</div><div class="weekday">Sa</div><div class="weekday">So</div>
					{#each calendarData as day (day.dateString)}
						<div class="day" class:not-current-month={!day.isCurrentMonth} class:selected={day.dateString === selectedDate} on:click={() => selectDay(day.dateString)}>
							{day.date.getDate()}
						</div>
					{/each}
				</div>
			</div>
			<div class="edit-panel">
				{#if selectedDate}
					<h4>Kapazitäten für {new Date(selectedDate).toLocaleDateString('de-DE', {weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'})}</h4>
					<div class="capacity-list">
						{#each selectedDayCapacities as kapa (kapa.resource)}
							<div class="capacity-item" class:is-exception={kapa.isException}>
								<label for="kapa-{kapa.resource}">{kapa.resource}</label>
								<input type="number" id="kapa-{kapa.resource}" value={kapa.capacity} on:input={(e) => updateCapacity(kapa.resource, parseInt(e.target.value) || 0)} min="0"/>
							</div>
						{/each}
					</div>
				{:else}
					<p class="placeholder">Wählen Sie einen Tag aus, um die Kapazitäten zu bearbeiten.</p>
				{/if}
			</div>
		</div>
		<footer class="modal-footer">
			<button class="btn btn-secondary" on:click={handleClose}>Abbrechen</button>
			<button class="btn btn-primary" on:click={handleSave}>Änderungen speichern & Schließen</button>
		</footer>
	</div>
</div>
{/if}


<style>
/* Stile bleiben unverändert */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background-color: var(--color-surface); padding: 25px; border-radius: var(--border-radius-large); box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: 90%; max-width: 900px; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-neutral-border); padding-bottom: 15px; margin-bottom: 20px; }
.modal-header h3 { margin: 0; font-size: 1.5rem; color: #334; }
.close-button { background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--color-text-secondary); }
.modal-body { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; min-height: 400px; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 0 10px; }
.calendar-header span { font-size: 1.2rem; font-weight: 600; }
.calendar-header button { background-color: #f8f9fa; border: 1px solid var(--color-neutral-border); border-radius: 50%; width: 36px; height: 36px; cursor: pointer; font-size: 1.2rem; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
.weekday { text-align: center; font-weight: 600; color: var(--color-text-secondary); font-size: 0.8rem; padding-bottom: 5px; }
.day { text-align: center; padding: 10px 0; border-radius: var(--border-radius-base); cursor: pointer; transition: background-color 0.2s; }
.day:hover { background-color: #e9ecef; }
.day.not-current-month { color: #adb5bd; }
.day.selected { background-color: var(--color-primary); color: white; font-weight: bold; }
.edit-panel { border-left: 1px solid var(--color-neutral-border); padding-left: 25px; }
.edit-panel h4 { margin-top: 0; font-size: 1.1rem; }
.placeholder { color: var(--color-text-secondary); text-align: center; margin-top: 50px; font-style: italic; }
.capacity-list { display: flex; flex-direction: column; gap: 15px; }
.capacity-item { display: flex; justify-content: space-between; align-items: center; }
.capacity-item.is-exception label { color: var(--color-primary); font-weight: bold; }
.capacity-item label { flex-grow: 1; }
.capacity-item input { width: 80px; padding: 8px; text-align: right; border-radius: 6px; border: 1px solid var(--color-neutral-border); }
.modal-footer { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--color-neutral-border); padding-top: 20px; margin-top: 20px; }
</style>