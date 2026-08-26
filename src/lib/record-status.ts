export const DRAFT_RECORD_COPY = {
	beforeStatus: 'This record has not been promoted to',
	status: 'active',
	afterStatus:
		'by expert review. Its identifier carries no persistence promise yet: the record may be corrected (which mints a different identifier) or retracted without a tombstone. Do not cite it as stable.',
} as const;

export const NO_SUCCESSOR_RECORD_COPY = 'No successor record exists.';
export const SUPERSEDED_BY_COPY = 'Superseded by';

export function getRecordStatusBanner(status: string) {
	return {
		isDraft: status === 'draft',
		isTombstone: status === 'withdrawn' || status === 'blocked',
		title:
			status === 'blocked'
				? 'This record is blocked by a rights, trust, or policy dispute.'
				: status === 'withdrawn'
					? 'This record has been withdrawn.'
					: null,
	};
}
