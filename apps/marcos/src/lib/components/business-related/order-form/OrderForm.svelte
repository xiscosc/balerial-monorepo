<script lang="ts">
	import { dateProxy, superForm } from 'sveltekit-superforms';
	import { Toaster, toast } from 'svelte-sonner';
	import {
		type CalculatedItemPart,
		type ListPrice,
		type PPDimensions,
		type PreCalculatedItemPart,
		PricingType,
		DimensionsType
	} from '@marcsimolduressonsardina/core/type';
	import CartItem from '@/components/business-related/order/CartItem.svelte';
	import PricingSelectorSection from '@/components/business-related/order-form/PricingSelectorSection.svelte';
	import PricingSelectorWithQuantitySection from '@/components/business-related/order-form/PricingSelectorWithQuantitySection.svelte';
	import AutocompleteSection from '@/components/business-related/order-form/AutocompleteSection.svelte';
	import Spacer from '@/components/business-related/order-form/Spacer.svelte';
	import ChipSet from '@/components/business-related/order-form/ChipSet.svelte';
	import Loading from '@/components/generic/Loading.svelte';
	import { onMount, type Snippet } from 'svelte';
	import type { OrderCreationFormData } from '@/server/shared/order/order-creation.utilities';
	import Box from '@/components/generic/Box.svelte';
	import {
		ButtonVariant,
		ButtonTextVariant,
		ButtonSize
	} from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { discountMap } from '@/shared/mappings/order.mapping';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import Switch from '@/components/ui/switch/switch.svelte';
	import * as NativeSelect from '@/components/ui/native-select/index.js';
	import Textarea from '@/components/ui/textarea/textarea.svelte';
	import {
		CalculatedItemUtilities,
		cornersId,
		otherExtraId
	} from '@marcsimolduressonsardina/core/util';
	import OrderPriceDetails from '@/components/business-related/order-detail/OrderPriceDetails.svelte';
	import Banner from '@/components/generic/Banner.svelte';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';
	import { GenericTools } from '@/shared/generic/generic.tools';
	import {
		OrderFormItemsState,
		type OrderItem
	} from '@/components/business-related/order-form/OrderFormItems.state.svelte';
	import { ExternalOrderPriceTrackerState } from '@/components/business-related/order-form/ExternalOrderPriceTracker.state.svelte';
	import { handleFormError } from '@/shared/fronted-analytics/offline-error-queue';

	interface Props {
		data: OrderCreationFormData;
		title: string;
		isNew?: boolean;
		children?: Snippet;
		isExternal?: boolean;
	}

	let { data, title, isNew = true, children = undefined, isExternal = false }: Props = $props();
	const orderFormItemsState = new OrderFormItemsState();
	let profiledPrices = $derived(getGlobalProfiler().measure(data.pricing));

	const { form, errors, enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		timeoutMs: 5000,
		onError: ({ result }) => handleFormError(result, 'OrderForm', toast.error)
	});
	const proxyDate = dateProxy(form, 'deliveryDate', { format: 'date' });

	let loadingInitialParts = $state(true);
	if (isNew) {
		$form.height = ($form.height === 0 ? '' : $form.height) as unknown as number;
		$form.width = ($form.width === 0 ? '' : $form.width) as unknown as number;
		$form.pp = ($form.pp === 0 ? '' : $form.pp) as unknown as number;
		$form.floatingDistance = ($form.floatingDistance === 0
			? ''
			: $form.floatingDistance) as unknown as number;
	}

	let total: number = $state(0.0);
	let totalPerUnit: number = $state(0.0);
	let totalPerUnitWithoutDiscount: number = $state(0.0);
	let totalWithoutDiscount: number = $state(0.0);
	let predefinedObservations: string[] = $state(
		$form.predefinedObservations.length > 0 ? $form.predefinedObservations : []
	);

	// PP vars
	let asymetricPP = $state($form.ppDimensions != null);
	let upPP: number | string = $state($form.ppDimensions == null ? '' : $form.ppDimensions.up);
	let downPP: number | string = $state($form.ppDimensions == null ? '' : $form.ppDimensions.down);
	let leftPP: number | string = $state($form.ppDimensions == null ? '' : $form.ppDimensions.left);
	let rightPP: number | string = $state($form.ppDimensions == null ? '' : $form.ppDimensions.right);
	$form.ppDimensions = $form.ppDimensions != null ? $form.ppDimensions : undefined;

	// Hardcoded PP ids that need to be 0
	const noPPIds = ['SIN_PASPARTU', 'PASPARTÚ_CLIENTE'];

	// Size vars
	let totalHeightBox = $state(0);
	let totalWidthBox = $state(0);

	const noObservationsLabel = 'No hay observaciones';
	const defaultObservations = [
		noObservationsLabel,
		'Sabe que puede ondular',
		'No pegar',
		'Muy delicado',
		'La obra puede ser dañada por su manipulación',
		'El cliente autoriza a publicar su obra en redes'
	];

	const defaultDescriptions = ['Sin obra'];

	// Other elements inputs
	let otherName: string | undefined = $state();
	let otherPrice: number | undefined = $state();
	let otherQuantity: string = $state('1');

	async function handleDimensionsChangeEvent() {
		orderFormItemsState.setOrderDimensions(getOrderDimensions());
		orderFormItemsState.setMarkup($form.markup);
		if (!orderFormItemsState.isEmpty()) {
			toast.info(`Las dimensiones han cambiado, recalculando el precio...`);
			await orderFormItemsState.updateAllOrderItems(showError);
			toast.success(`Precios actualizados`);
		}
	}

	function extractNumber(input: string | number): number {
		if (typeof input === 'number') {
			return input;
		}

		const parsedNumber = Number(input);
		if (isNaN(parsedNumber)) {
			return 0;
		}

		return parsedNumber;
	}

	function isValidNumber(input: string | number): boolean {
		return typeof input === 'number' && !isNaN(input);
	}

	function showError(id: string, errorMessage?: string) {
		if (errorMessage) {
			toast.error(errorMessage);
		} else {
			toast.error(`Error al calcular el precio. Puede ser que el precio ya no exista (${id}).`);
		}
	}

	function getOrderDimensions() {
		const width = $form.width;
		const height = $form.height;

		if (!asymetricPP) {
			return CalculatedItemUtilities.getOrderDimensions(width, height, $form.pp);
		} else {
			return CalculatedItemUtilities.getOrderDimensions(width, height, 0, {
				up: extractNumber(upPP),
				down: extractNumber(downPP),
				left: extractNumber(leftPP),
				right: extractNumber(rightPP)
			});
		}
	}

	function deletePrecalculatedPreview(part: OrderItem) {
		orderFormItemsState.deletePart(part.pre);
	}

	function deleteExtraPart(part: CalculatedItemPart) {
		orderFormItemsState.removeOtherItem(part);
	}

	function updateMarkupOnCorners() {
		const cornersPart = orderFormItemsState.getOtherItems().find((p) => p.priceId === cornersId);
		if (cornersPart) {
			orderFormItemsState.removeOtherItem(cornersPart);
			orderFormItemsState.addOtherItem(
				CalculatedItemUtilities.getCornersPricing($form.markup ?? 0)
			);
		}
	}

	async function addFromPricingSelector(
		pricingType: PricingType,
		value?: string,
		moldId?: string,
		extraInfo?: string
	) {
		if (value == null) {
			return;
		}

		const partToCalculate = {
			id: value,
			quantity: 1,
			type: pricingType,
			moldId,
			extraInfo
		};

		orderFormItemsState.addParts([partToCalculate], showError);
	}

	async function addOtherElementsFromSelector(id: string, quantity: number) {
		const pricing = await data.pricing;
		await addElementWithQuantity(id, quantity, pricing.otherPrices);
	}

	async function addHangerElementsFromSelector(id: string, quantity: number) {
		const pricing = await data.pricing;
		await addElementWithQuantity(id, quantity, pricing.hangerPrices);
	}

	async function addElementWithQuantity(id: string, quantity: number, list: ListPrice[]) {
		const selected = list.find((price) => price.id === id);
		if (selected) {
			const partToCalculate = {
				id: selected.id,
				quantity: quantity,
				type: selected.type
			};

			await orderFormItemsState.addParts([partToCalculate], showError);
		}
	}

	function addOtherElement() {
		if (otherName != null && otherName.length > 0 && otherPrice != null) {
			const part = {
				description: otherName,
				price: otherPrice,
				quantity: parseInt(otherQuantity),
				priceId: otherExtraId,
				discountAllowed: true,
				floating: false
			};
			orderFormItemsState.addOtherItem(part);
		}

		// Reset the inputs
		otherName = undefined;
		otherPrice = undefined;
		otherQuantity = '1';
	}

	function updateTotal(
		parts: OrderItem[],
		eParts: CalculatedItemPart[],
		discount: string,
		quantity: number
	) {
		const discountNumber = !isNaN(parseInt(discount)) ? parseInt(discount) : 0;
		const allParts = [...eParts, ...parts.map((p) => p.post)];
		totalPerUnitWithoutDiscount = CalculatedItemUtilities.calculatePartsCost(allParts, false);
		totalPerUnit = CalculatedItemUtilities.calculatePartsCost(allParts, true, discountNumber);
		totalWithoutDiscount = totalPerUnitWithoutDiscount * quantity;
		total = totalPerUnit * quantity;
	}

	function updatePP(aPP: boolean, up: number, down: number, left: number, right: number) {
		if (aPP) {
			$form.pp = 0;
			$form.ppDimensions = {
				up,
				down,
				left,
				right
			};
		} else {
			$form.ppDimensions = undefined;
			upPP = '';
			downPP = '';
			leftPP = '';
			rightPP = '';
		}
	}

	function updateTotalSizes(
		width: number,
		height: number,
		pp: number,
		ppDimensions?: PPDimensions
	) {
		const { totalWidth, totalHeight } = CalculatedItemUtilities.getTotalDimensions(
			isNaN(width) ? 0 : width,
			isNaN(height) ? 0 : height,
			isNaN(pp) ? 0 : pp,
			ppDimensions
		);

		totalHeightBox = totalHeight;
		totalWidthBox = totalWidth;
	}

	function calculateMissingLabels(
		pp: boolean,
		hanger: boolean,
		transport: boolean,
		back: boolean,
		labour: boolean,
		other: boolean,
		mold: boolean,
		glass: boolean,
		observations: boolean,
		description: boolean,
		discount: boolean,
		exteriorDimensions: boolean,
		ppMeasures: boolean,
		floatingDistance: boolean
	) {
		const parts = [];
		if (!pp) {
			parts.push('Falta PP');
		}

		if (!ppMeasures) {
			parts.push(
				'Faltan medidas del PP. Si no hay PP o es del cliente deben ser 0, si hay PP deben ser mayores a 0.'
			);
		}

		if (!hanger) {
			parts.push('Falta colgadores');
		}

		if (!transport) {
			parts.push('Falta transporte');
		}

		if (!labour) {
			parts.push('Faltan montajes');
		}

		if (!other) {
			parts.push('Faltan suministros');
		}

		if (!back) {
			parts.push('Falta trasera');
		}

		if (!mold) {
			parts.push('Falta moldura / marco');
		}

		if (!glass) {
			parts.push('Falta cristal');
		}

		if (!observations) {
			parts.push('Faltan observaciones');
		}

		if (!description) {
			parts.push('Falta descripción');
		}

		if (!discount) {
			parts.push('Falta descuento');
		}

		if (!exteriorDimensions) {
			parts.push('Faltan medidas exteriores');
		}

		if (!floatingDistance) {
			parts.push('Falta distancia flotante. Si no hay marco flotante, debe ser 0.');
		}

		return parts;
	}

	function calculateAddedPPMeasures(
		parts: OrderItem[],
		asymetricPP: boolean,
		ppIsNumber: boolean,
		ppValue: number
	): boolean {
		if (asymetricPP) {
			return true;
		}

		if (parts.length === 1 && noPPIds.includes(parts[0].pre.id)) {
			return ppIsNumber && !asymetricPP && ppValue === 0;
		}

		if ((parts.length === 1 && !noPPIds.includes(parts[0].pre.id)) || parts.length > 1) {
			return ppIsNumber && !asymetricPP && ppValue > 0;
		}

		return false;
	}

	function calculateAddedFloatingDistance(
		moldParts: OrderItem[],
		floatingDistance: number
	): boolean {
		const floatingMoldsCount = moldParts.filter((p) => p.post.floating).length;
		if (floatingDistance === 0 && floatingMoldsCount === 0) {
			return true;
		}

		if (floatingDistance > 0 && floatingMoldsCount > 0) {
			return true;
		}

		return false;
	}

	function calculateAddedAsymetricPPMeasures(
		parts: OrderItem[],
		asymetricPP: boolean,
		upIsNumber: boolean,
		upValue: number,
		downIsNumber: boolean,
		downValue: number,
		leftIsNumber: boolean,
		leftValue: number,
		rightIsNumber: boolean,
		rightValue: number
	): boolean {
		if (!asymetricPP) {
			return true;
		}

		if (parts.length === 1 && noPPIds.includes(parts[0].pre.id)) {
			// All sides are numbers and value 0
			return (
				upIsNumber &&
				downIsNumber &&
				leftIsNumber &&
				rightIsNumber &&
				upValue === 0 &&
				downValue === 0 &&
				leftValue === 0 &&
				rightValue === 0
			);
		}

		if ((parts.length === 1 && !noPPIds.includes(parts[0].pre.id)) || parts.length > 1) {
			// All sides are numbers and at least one value is not 0
			return (
				upIsNumber &&
				downIsNumber &&
				leftIsNumber &&
				rightIsNumber &&
				(upValue > 0 || downValue > 0 || leftValue > 0 || rightValue > 0)
			);
		}

		return false;
	}

	// Added vars
	let exteriorDimensions = $derived($form.dimenstionsType === DimensionsType.EXTERIOR);
	let addedOther = $derived(orderFormItemsState.typeIsAdded(PricingType.OTHER));
	let addedPP = $derived(orderFormItemsState.typeIsAdded(PricingType.PP));
	let addedHanger = $derived(orderFormItemsState.typeIsAdded(PricingType.HANGER));
	let addedTransport = $derived(orderFormItemsState.typeIsAdded(PricingType.TRANSPORT));
	let addedBack = $derived(orderFormItemsState.typeIsAdded(PricingType.BACK));
	let addedLabour = $derived(
		orderFormItemsState.typeIsAdded([PricingType.FABRIC, PricingType.LABOUR])
	);
	let addedMold = $derived(orderFormItemsState.typeIsAdded(PricingType.MOLD));
	let addedGlass = $derived(orderFormItemsState.typeIsAdded(PricingType.GLASS));
	let addedObservations = $derived(
		$form.observations.length > 0 || $form.predefinedObservations.length > 0
	);
	let addedDescription = $derived(
		$form.description.length > 0 || $form.predefinedDescriptions.length > 0
	);
	let addedDiscount = $derived($form.discount !== '' && !isNaN(parseInt($form.discount)));
	let addedExteriorDimensions = $derived(
		!exteriorDimensions || ($form.exteriorHeight != null && $form.exteriorWidth != null)
	);
	let addedFloatingDistance = $derived(
		calculateAddedFloatingDistance(
			orderFormItemsState.getOrderItemsByType(PricingType.MOLD),
			$form.floatingDistance
		)
	);
	let addedPPMeaseures = $derived(
		calculateAddedPPMeasures(
			orderFormItemsState.getOrderItemsByType(PricingType.PP),
			asymetricPP,
			isValidNumber($form.pp),
			extractNumber($form.pp)
		) &&
			calculateAddedAsymetricPPMeasures(
				orderFormItemsState.getOrderItemsByType(PricingType.PP),
				asymetricPP,
				isValidNumber(upPP),
				extractNumber(upPP),
				isValidNumber(downPP),
				extractNumber(downPP),
				isValidNumber(leftPP),
				extractNumber(leftPP),
				isValidNumber(rightPP),
				extractNumber(rightPP)
			)
	);

	let missingReasons = $derived(
		calculateMissingLabels(
			addedPP,
			addedHanger,
			addedTransport,
			addedBack,
			addedLabour,
			addedOther,
			addedMold,
			addedGlass,
			addedObservations,
			addedDescription,
			addedDiscount,
			addedExteriorDimensions,
			addedPPMeaseures,
			addedFloatingDistance
		)
	);

	let discountActive = $derived($form.discount !== '' && parseInt($form.discount) > 0);
	let isDiscountNotAllowedPresent = $derived(
		orderFormItemsState.hasItemsWithDiscountNotAllowed() && discountActive
	);

	$effect(() => {
		updatePP(
			asymetricPP,
			extractNumber(upPP),
			extractNumber(downPP),
			extractNumber(leftPP),
			extractNumber(rightPP)
		);
	});

	$effect(() => {
		updateTotalSizes(
			extractNumber($form.width),
			extractNumber($form.height),
			extractNumber($form.pp),
			$form.ppDimensions
		);
	});

	$effect(() => {
		updateTotal(
			orderFormItemsState.getOrderItems(),
			orderFormItemsState.getOtherItems(),
			$form.discount,
			$form.quantity
		);
	});

	$effect(() => {
		if (!loadingInitialParts) {
			$form.partsToCalculate = orderFormItemsState.getOrderItems().map((item) => item.pre);
			$form.extraParts = orderFormItemsState.getOtherItems();
		}
	});

	onMount(async () => {
		orderFormItemsState.setOrderDimensions(getOrderDimensions());
		orderFormItemsState.setMarkup($form.markup);
		if ($form.partsToCalculate.length > 0) {
			await orderFormItemsState.setInitialParts(
				$form.partsToCalculate as PreCalculatedItemPart[],
				showError
			);
			toast.success(`Precios actualizados`);
		}

		orderFormItemsState.setInitialOtherItems(
			$form.extraParts.length > 0 ? $form.extraParts : [CalculatedItemUtilities.getCornersPricing()]
		);

		$form.predefinedObservations = predefinedObservations;
		loadingInitialParts = false;
	});

	const externalOrderPriceTrackerState = new ExternalOrderPriceTrackerState(isExternal);

	$effect(() => {
		externalOrderPriceTrackerState.setTotal(total);
	});

	$effect(() => {
		externalOrderPriceTrackerState.setMissingReasonsCount(missingReasons.length);
	});
</script>

{#snippet cartItemList(parts: OrderItem[])}
	<div class="flex flex-col gap-2 lg:col-span-2">
		{#each parts as part (part)}
			<CartItem
				part={part.post}
				partToDelete={part}
				deleteExtraPart={deletePrecalculatedPreview}
				showNoDiscountAllowed={discountActive}
			/>
		{/each}
	</div>
{/snippet}

{#snippet cartItemExtraList(parts: CalculatedItemPart[])}
	<div class="flex flex-col gap-2 lg:col-span-2">
		{#each parts as part (part)}
			<CartItem {part} partToDelete={part} {deleteExtraPart} />
		{/each}
	</div>
{/snippet}

<Toaster richColors />

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.FORM}>{title}</SimpleHeading>

	{#if loadingInitialParts}
		<Box>
			<Loading text="Iniciando edición del pedido..." />
		</Box>
	{:else}
		<form use:enhance method="post">
			<div class="flex flex-col gap-2">
				{#if $submitting}
					<Box>
						<Loading text="Guardando" />
					</Box>
				{:else}
					{#if isExternal}
						<Box>
							<div class="flex w-full flex-col gap-2 lg:grid lg:grid-cols-2 lg:items-end">
								<Spacer title="Datos tienda externa" line={false} />
								<div class="flex flex-col gap-2 lg:col-span-2">
									<Label for="height">Margen (%):</Label>
									<Input
										type="number"
										step="1"
										min="0"
										name="height"
										bind:value={$form.markup}
										onchange={() => {
											handleDimensionsChangeEvent();
											updateMarkupOnCorners();
										}}
									/>
								</div>
							</div>
						</Box>
					{/if}
					<Box>
						{#await profiledPrices}
							<Loading text="Cargando precios" />
						{:then pricing}
							<div class="flex w-full flex-col gap-2 lg:grid lg:grid-cols-2 lg:items-end">
								<Spacer title="Datos de la obra" line={false} />

								<div class="flex flex-col gap-2">
									<Label for="height">Alto (cm):</Label>
									<Input
										type="number"
										step="0.01"
										name="height"
										onchange={() => handleDimensionsChangeEvent()}
										bind:value={$form.height}
										success={$form.height > 10}
										error={$errors.height ? true : false}
									/>
								</div>

								<div class="flex flex-col gap-2">
									<Label for="width">Ancho (cm):</Label>
									<Input
										type="number"
										step="0.01"
										name="width"
										onchange={() => handleDimensionsChangeEvent()}
										bind:value={$form.width}
										success={$form.width > 10}
										error={$errors.width ? true : false}
									/>
								</div>

								<PricingSelectorSection
									sectionTitle="PP / Fondo"
									label="Tipo"
									prices={pricing.ppPrices}
									addValue={addFromPricingSelector}
									showExtraInfo={true}
									added={addedPP}
								>
									<div class="flex flex-1 flex-col gap-2">
										<Label for="pp">Medidas PP o Fondo (cm):</Label>
										<Input
											type="number"
											step="0.01"
											name="pp"
											onchange={() => handleDimensionsChangeEvent()}
											bind:value={$form.pp}
											success={addedPPMeaseures}
											disabled={asymetricPP}
											error={$errors.pp ? true : false}
										/>
									</div>

									<div
										class="flex h-10 flex-1 flex-row items-center justify-between gap-2 rounded-md border p-2 shadow-xs"
									>
										<Label for="pp">PP Asimétrico</Label>
										<Switch
											name="ppAsymetric"
											bind:checked={asymetricPP}
											onchange={() => handleDimensionsChangeEvent()}
										/>
									</div>

									{#if asymetricPP}
										<Spacer title="Medidas PP o Fondo (cm)" />

										<div class="flex flex-col gap-2">
											<Label for="upPP">Arriba:</Label>
											<Input
												type="number"
												step="0.01"
												name="upPP"
												onchange={() => handleDimensionsChangeEvent()}
												bind:value={upPP}
												success={addedPPMeaseures}
											/>
										</div>

										<div class="flex flex-col gap-2">
											<Label for="downPP">Abajo:</Label>
											<Input
												type="number"
												step="0.01"
												name="downPP"
												onchange={() => handleDimensionsChangeEvent()}
												bind:value={downPP}
												success={addedPPMeaseures}
											/>
										</div>

										<div class="flex flex-col gap-2">
											<Label for="leftPP">Izquierda:</Label>
											<Input
												type="number"
												step="0.01"
												name="leftPP"
												onchange={() => handleDimensionsChangeEvent()}
												bind:value={leftPP}
												success={addedPPMeaseures}
											/>
										</div>

										<div class="flex flex-col gap-2">
											<Label for="rightPP">Derecha:</Label>
											<Input
												type="number"
												step="0.01"
												name="rightPP"
												onchange={() => handleDimensionsChangeEvent()}
												bind:value={rightPP}
												success={addedPPMeaseures}
											/>
										</div>
									{/if}
								</PricingSelectorSection>

								{@render cartItemList(orderFormItemsState.getOrderItemsByType(PricingType.PP))}

								<Spacer title="Medidas de trabajo" />

								<div class="grid grid-cols-1 lg:col-span-2">
									<div class="rounded-md border-2 border-gray-300 p-4">
										<p class="text-center text-xl text-gray-600">
											Alto: {totalHeightBox}cm | Ancho: {totalWidthBox}cm
										</p>
									</div>
								</div>

								<div class="col-span-2 flex flex-row justify-between text-sm font-medium">
									<label class="flex items-center space-x-2">
										<input
											class="radio"
											type="radio"
											checked
											name="radio-direct"
											bind:group={$form.dimenstionsType}
											value={DimensionsType.NORMAL}
										/>
										<p>Nor.</p>
									</label>
									<label class="flex items-center space-x-2">
										<input
											class="radio"
											type="radio"
											bind:group={$form.dimenstionsType}
											name="radio-direct"
											value={DimensionsType.EXTERIOR}
										/>
										<p>Ext.</p>
									</label>
									<label class="flex items-center space-x-2">
										<input
											class="radio"
											type="radio"
											name="radio-direct"
											bind:group={$form.dimenstionsType}
											value={DimensionsType.ROUNDED}
										/>
										<p>Redo.</p>
									</label>
									<label class="flex items-center space-x-2">
										<input
											class="radio"
											type="radio"
											name="radio-direct"
											bind:group={$form.dimenstionsType}
											value={DimensionsType.WINDOW}
										/>
										<p>Vent.</p>
									</label>
								</div>

								{#if exteriorDimensions}
									<div class="flex flex-col gap-2">
										<Label for="exteriorHeight">Alto Exterior (cm):</Label>
										<Input
											type="number"
											step="0.01"
											name="exteriorHeight"
											bind:value={$form.exteriorHeight}
											success={$form.exteriorHeight != null && $form.exteriorHeight > 0}
										/>
									</div>

									<div class="flex flex-col gap-2">
										<Label for="exteriorWidth">Ancho Exterior (cm):</Label>
										<Input
											type="number"
											step="0.01"
											name="exteriorWidth"
											bind:value={$form.exteriorWidth}
											success={$form.exteriorWidth != null && $form.exteriorWidth > 0}
										/>
									</div>
								{/if}

								<AutocompleteSection
									sectionTitle="Molduras"
									label="Moldura/Marco"
									prices={pricing.moldPrices}
									addValue={addFromPricingSelector}
									pricingType={PricingType.MOLD}
									added={addedMold}
								/>

								{@render cartItemList(orderFormItemsState.getOrderItemsByType(PricingType.MOLD))}

								<div class="flex flex-col gap-2">
									<Label for="floatingDistance">Distancia flotante (cm):</Label>
									<Input
										type="number"
										step="0.01"
										min="0.00"
										name="floatingDistance"
										bind:value={$form.floatingDistance}
										success={addedFloatingDistance}
										onchange={() => handleDimensionsChangeEvent()}
									/>
								</div>

								<PricingSelectorSection
									sectionTitle="Cristal"
									label="Tipo de cristal"
									prices={pricing.glassPrices}
									addValue={addFromPricingSelector}
									added={addedGlass}
								/>

								{@render cartItemList(orderFormItemsState.getOrderItemsByType(PricingType.GLASS))}

								<PricingSelectorSection
									sectionTitle="Trasera"
									label="Tipo de trasera"
									prices={pricing.backPrices}
									addValue={addFromPricingSelector}
									added={addedBack}
								/>

								{@render cartItemList(orderFormItemsState.getOrderItemsByType(PricingType.BACK))}

								<PricingSelectorSection
									sectionTitle="Montajes"
									label="Tipo de montaje"
									prices={pricing.labourPrices}
									extraPrices={orderFormItemsState.getFabricPrices()}
									locationIdForExtraPrices="CINTA_CANTO_LIENZO_BLANCA"
									addValue={addFromPricingSelector}
									added={addedLabour}
								/>

								{@render cartItemList(
									orderFormItemsState.getOrderItemsByType([PricingType.LABOUR, PricingType.FABRIC])
								)}

								<PricingSelectorWithQuantitySection
									added={addedHanger}
									sectionTitle="Colgadores"
									label="Colgador"
									prices={pricing.hangerPrices}
									addItem={addHangerElementsFromSelector}
								/>

								{@render cartItemList(orderFormItemsState.getOrderItemsByType(PricingType.HANGER))}

								<PricingSelectorWithQuantitySection
									added={addedOther}
									sectionTitle="Suministros"
									label="Elemento"
									prices={pricing.otherPrices}
									addItem={addOtherElementsFromSelector}
								/>

								{@render cartItemList(orderFormItemsState.getOrderItemsByType(PricingType.OTHER))}

								<PricingSelectorSection
									sectionTitle="Transporte"
									label="Tipo de transporte"
									prices={pricing.transportPrices}
									addValue={addFromPricingSelector}
									added={addedTransport}
								/>

								{@render cartItemList(
									orderFormItemsState.getOrderItemsByType(PricingType.TRANSPORT)
								)}

								<Spacer title="Elementos extra" />

								{#if isExternal}
									<div class="col-span-2">
										<Banner
											icon={IconType.ALERT}
											text="A los precios de los elementos extra no se les aplica el margen. Introduzca el precio con el margen ya aplicado."
											color="amber"
											title="Aviso"
										></Banner>
									</div>
								{/if}

								<div class="flex flex-col gap-2 lg:col-span-2">
									<Label for="otherElementName">Nombre del elemento:</Label>
									<Input type="text" name="otherElementName" bind:value={otherName} />
								</div>

								<div class="flex flex-col gap-2">
									<Label for="otherElementPrice">Precio del elemento:</Label>
									<Input
										type="number"
										step="0.01"
										min="0"
										name="otherElementPrice"
										bind:value={otherPrice}
									/>
								</div>

								<div class="flex flex-col gap-2">
									<Label for="otherQuantityElements">Cantidad</Label>
									<NativeSelect.Root name="otherQuantityElements" bind:value={otherQuantity}>
										{#each GenericTools.getIterableStringList(10, 1) as i (i)}
											<option value={i}>{i}</option>
										{/each}
									</NativeSelect.Root>
								</div>

								<div class="lg:col-span-2">
									<MarcosButton
										onclick={() => addOtherElement()}
										icon={IconType.PLUS}
										iconSize={IconSize.BIG}
									>
										Añadir a la lista
									</MarcosButton>
								</div>

								{@render cartItemExtraList(orderFormItemsState.getOtherItems())}

								<Spacer title="Descripción de la obra" />

								<div class="flex flex-col gap-2 lg:col-span-2">
									<Label for="description">Descripción:</Label>
									<Textarea
										success={addedDescription}
										name="description"
										bind:value={$form.description}
									></Textarea>
								</div>

								{#if $form.description.length === 0}
									<ChipSet
										values={defaultDescriptions}
										bind:filledValues={$form.predefinedDescriptions}
									/>
								{/if}

								<div class="flex flex-col gap-2 lg:col-span-2">
									<Label for="observations">Observaciones:</Label>
									<Textarea
										success={addedObservations}
										name="observations"
										bind:value={$form.observations}
									></Textarea>
								</div>

								<ChipSet
									values={defaultObservations}
									bind:filledValues={$form.predefinedObservations}
								/>

								<Spacer title="Otros datos" />

								<div class="flex flex-col gap-2 lg:col-span-2">
									<Label for="quantity">Cantidad:</Label>
									<div
										class="flex flex-row justify-between gap-3 rounded-md border p-2 shadow-xs lg:col-span-2"
									>
										<input
											class="text-md w-full px-2"
											type="number"
											step="1"
											min="1"
											bind:value={$form.quantity}
										/>

										<div class="flex flex-row gap-2">
											<MarcosButton
												icon={IconType.PLUS}
												size={ButtonSize.SMALL}
												onclick={() => {
													$form.quantity += 1;
												}}
											></MarcosButton>
											<MarcosButton
												icon={IconType.MINUS}
												textVariant={ButtonTextVariant.GRAY}
												size={ButtonSize.SMALL}
												variant={ButtonVariant.ORDER_GENERIC}
												disabled={$form.quantity <= 1}
												onclick={() => {
													$form.quantity -= 1;
												}}
											></MarcosButton>
										</div>
									</div>
								</div>

								{#if !$form.instantDelivery}
									<div class="flex flex-col gap-2">
										<Label for="deliveryDate">Fecha de entrega (Sólo pedidos):</Label>
										<Input
											name="deliveryDate"
											type="date"
											bind:value={$proxyDate}
											error={$errors.deliveryDate ? true : false}
										/>
									</div>
								{/if}

								<div
									class="flex h-10 flex-1 flex-row items-center justify-between gap-2 rounded-md border p-2 shadow-xs"
									class:lg:col-span-2={$form.instantDelivery}
								>
									<Label for="instantDelivery">Al momento</Label>
									<Switch name="instantDelivery" bind:checked={$form.instantDelivery} />
								</div>

								<div class="flex flex-col gap-2">
									<Label for="discount">Descuento:</Label>
									<NativeSelect.Root
										name="discount"
										bind:value={$form.discount}
										success={addedDiscount}
									>
										<option></option>
										{#each Object.entries(discountMap) as [key, value] (key)}
											<option value={String(value)}>{key}</option>
										{/each}
									</NativeSelect.Root>
								</div>

								<div
									class="flex h-10 flex-1 flex-row items-center justify-between gap-2 rounded-md border p-2 shadow-xs"
								>
									<Label for="hasArrow"><Icon type={IconType.DOWN} /></Label>
									<Switch name="hasArrow" bind:checked={$form.hasArrow} />
								</div>
							</div>
						{/await}
					</Box>

					<Box title="Elementos añadidos" collapsible>
						<div class="flex flex-col gap-2">
							{@render cartItemList(orderFormItemsState.getOrderItems())}
							{@render cartItemExtraList(orderFormItemsState.getOtherItems())}
							{#if isDiscountNotAllowedPresent}
								<span class="text-xs text-gray-500">* Elementos con descuento no permitido</span>
							{/if}
						</div>
					</Box>

					<div class="flex flex-col gap-2 lg:col-span-2">
						<OrderPriceDetails
							quantity={$form.quantity}
							discount={parseInt($form.discount)}
							unitPriceWithoutDiscount={totalPerUnitWithoutDiscount}
							unitPriceWithDiscount={totalPerUnit}
							{totalWithoutDiscount}
							totalWithDiscount={total}
							alertItemsWitouthDiscount={isDiscountNotAllowedPresent}
						></OrderPriceDetails>
						{#if missingReasons.length > 0}
							<Box title="Rellene todos los campos" icon={IconType.LIST}>
								<div class="px-4">
									<ul class="list-disc">
										{#each missingReasons as reason (reason)}
											<li>{reason}</li>
										{/each}
									</ul>
								</div>
							</Box>
						{:else}
							{@render children?.()}
						{/if}
					</div>
				{/if}
			</div>
		</form>
	{/if}
</div>
