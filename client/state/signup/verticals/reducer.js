/** @format */

/**
 * Internal dependencies
 */
import { createReducer } from 'state/utils';
import { SIGNUP_VERTICALS_SET, SIGNUP_VERTICALS_REQUEST } from 'state/action-types';

const verticals = createReducer(
	{},
	{
		[ SIGNUP_VERTICALS_REQUEST ]: state => {
			return {
				...state,
				isFetching: true,
			};
		},

		[ SIGNUP_VERTICALS_SET ]: ( state, action ) => {
			return {
				...state,
				isFetching: false,
				[ action.search.trim().toLowerCase() ]: action.verticals,
			};
		},
	}
);

export default verticals;
