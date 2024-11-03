/**
 * Main function to parse the /pools command to extract sorting and filtering criteria.
 * Applies default values for certain fields if they are not provided.
 * @param {string} command - The /pools command string.
 * @returns {object} - An object containing the sort fields and filter criteria.
 * @throws {Error} - If the command is invalid.
 */
export function parseCommand(command) {
	const parts = command.trim().split(" ");

	const sortFields = [];
	const filterCriteria = {
		bin_step: { operator: "=", value: 100 },
		// protocol_fee_percentage: { operator: "=", value: 0 },
		liquidity: { operator: ">", value: 0 }
	};

	if (parts.length === 1 && parts[0] === "") {
		sortFields.push({ field: "liquidity", order: "desc" });
		return { sortFields, filterCriteria };
	}

	let currentSection = null;
	let sortOptionPresent = false;
	let filterOptionPresent = false;

	for (const part of parts) {
		if (part === "-s") {
			currentSection = "sort";
			sortOptionPresent = true;
		} else if (part === "-f") {
			currentSection = "filter";
			filterOptionPresent = true;
		} else if (currentSection === "sort") {
			parseSortField(part, sortFields);
		} else if (currentSection === "filter" && filterOptionPresent) {
			parseFilterCriterion(part, filterCriteria);
		} else {
			throw new Error(
				`Unexpected command part: ${part}. Use -f for filters and -s for sorting.`
			);
		}
	}

	if (!sortOptionPresent) {
		sortFields.push({ field: "liquidity", order: "desc" });
	}

	return { sortFields, filterCriteria };
}

/**
 * Parses a sort field and adds it to the sortFields array.
 * @param {string} part - The part of the command related to sorting.
 * @param {Array} sortFields - Array to store sort field objects.
 * @throws {Error} - If the sort field is invalid.
 */
function parseSortField(part, sortFields) {
	const allowedSorts = ["fees", "liquidity", "volume", "apr"];
	if (!allowedSorts.includes(part)) {
		throw new Error(
			`Invalid sort field: ${part}. Allowed sort fields are: ${allowedSorts.join(
				", "
			)}`
		);
	}
	sortFields.push({ field: part, order: "desc" });
}

/**
 * Parses a filter criterion and adds it to the filterCriteria object.
 * @param {string} part - The part of the command related to filtering.
 * @param {object} filterCriteria - Object to store filter criteria.
 * @throws {Error} - If the filter field or format is invalid.
 */
function parseFilterCriterion(part, filterCriteria) {
	const allowedFilters = [
		"bin_step",
		"base_fee",
		"max_fee",
		"protocol",
		"liquidity",
		"fees",
		"volume",
		"apr"
	];
	const match = part.match(/^(\w+)([><=]=?|==?)(.+)$/);
	if (!match) {
		throw new Error(
			`Invalid filter format: ${part}. Ensure filters follow "field operator value" format.`
		);
	}
	const [_, field, operator, value] = match;

	if (!allowedFilters.includes(field)) {
		throw new Error(
			`Invalid filter field: ${field}. Allowed filter fields are: ${allowedFilters.join(
				", "
			)}`
		);
	}

	const parsedValue = isNaN(+value) ? value : parseFloat(value);
	filterCriteria[field] = { operator, value: parsedValue };
}
