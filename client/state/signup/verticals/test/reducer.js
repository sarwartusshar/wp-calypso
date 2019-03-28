/** @format */

/**
 * Internal dependencies
 */
import reducer from '../reducer';
import { SIGNUP_VERTICALS_SET, SIGNUP_VERTICALS_REQUEST } from 'state/action-types';

describe( 'state/signup/verticals/reducer', () => {
	test( 'should default to an empty object.', () => {
		expect( reducer( undefined, {} ) ).toEqual( {} );
	} );

	test( 'should set isFetching to true on a request.', () => {
		const search = 'Foo';
		const limit = 1;

		expect(
			reducer( undefined, {
				type: SIGNUP_VERTICALS_REQUEST,
				search,
				limit,
			} )
		).toEqual( {
			isFetching: true,
		} );
	} );

	test( 'should associate a trimmed and lowercase search string to the verticals array.', () => {
		const search = 'Foo';
		const verticals = [ { id: 0, verticalName: 'Coffee' }, { id: 1, verticalName: 'Tea' } ];

		expect(
			reducer( undefined, {
				type: SIGNUP_VERTICALS_SET,
				search,
				verticals,
			} )
		).toEqual( {
			foo: verticals,
			isFetching: false,
		} );
	} );
} );
