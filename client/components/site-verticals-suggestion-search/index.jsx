/** @format */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { debounce, find, get, noop, size } from 'lodash';
import { localize } from 'i18n-calypso';
import { v4 as uuid } from 'uuid';

/**
 * Internal dependencies
 */
import SuggestionSearch from 'components/suggestion-search';
import PopularTopics from 'components/site-verticals-suggestion-search/popular-topics';
import QueryVerticals from 'components/data/query-verticals';
import { getVerticals } from 'state/signup/verticals/selectors';
import { DEFAULT_VERTICAL_KEY } from 'state/signup/verticals/constants';

/**
 * Style dependencies
 */
import './style.scss';

export class SiteVerticalsSuggestionSearch extends Component {
	static propTypes = {
		charsToTriggerSearch: PropTypes.number,
		initialValue: PropTypes.string,
		onChange: PropTypes.func,
		placeholder: PropTypes.string,
		shouldShowPopularTopics: PropTypes.func,
		searchValue: PropTypes.string,
		verticals: PropTypes.array,
		defaultVertical: PropTypes.object,
	};

	static defaultProps = {
		charsToTriggerSearch: 1,
		initialValue: '',
		onChange: noop,
		placeholder: '',
		shouldShowPopularTopics: noop,
		searchValue: '',
		verticals: [],
		defaultVertical: {},
	};

	constructor( props ) {
		super( props );
		this.state = {
			railcar: this.getNewRailcar(),
			searchValue: props.searchValue,
			candidateVerticals: [],
			isSuggestionSelected: false,
		};
		this.updateVerticalDataDebounced = debounce( this.updateVerticalData, 1000 );
	}

	componentDidUpdate( prevProps ) {
		// The suggestion list should only be updated when a user is not navigating the list through keying.
		// Note: it's intentional to use object reference comparison here.
		// Since `verticals` props is connected from a redux state here, if the two references are identical,
		// we can safely say that the two content are identical, thanks to the immutability invariant of redux.
		if ( prevProps.verticals !== this.props.verticals && ! this.state.isSuggestionSelected ) {
			// It's safe here to call setState() because we prevent the indefinite loop by the wrapping condition.
			// See the official doc here: https://reactjs.org/docs/react-component.html#componentdidupdate
			// eslint-disable-next-line react/no-did-update-set-state
			this.setSearchResults( this.props.verticals );
		}
	}

	/***
	 * Sets `state.results` with incoming HTTP results, retaining previous non-user vertical search results
	 * if the incoming HTTP results contain only user-defined results.
	 *
	 * This function could better be performed in the backend eventually.
	 *
	 * @param {Array} results Incoming HTTP results
	 */
	setSearchResults = results => {
		if ( size( results ) ) {
			const { candidateVerticals, searchValue } = this.state;
			// if the only result is a user input (non-vertical),
			// and we have some previous results
			// then concat that with the previous results and remove the last user input
			if (
				! find( results, item => ! item.isUserInputVertical ) &&
				1 < size( candidateVerticals )
			) {
				results = candidateVerticals
					.filter( item => ! item.isUserInputVertical ).concat( results );
			}

			const matches = this.searchForVerticalMatches( searchValue );

			this.setState( { candidateVerticals: results }, () =>
				// if a user has selected a vertical from the suggestion list,
				// set a flag to load sans debounce
				this.state.isSuggestionSelected ?
					this.updateVerticalData(
						matches,
						searchValue
					) :
					this.updateVerticalDataDebounced(
						matches,
						searchValue
					)
			);
		}
	};

	getNewRailcar() {
		return {
			id: `${ uuid().replace( /-/g, '' ) }-site-vertical-suggestion`,
			fetch_algo: '/verticals',
			action: 'site_vertical_selected',
		};
	}

	/***
	 * Searches the API results for a direct match on the user search query.
	 *
	 * @param {String} value Search query array
	 * @returns {Object?} An object from the vertical results array
	 */
	searchForVerticalMatches = ( value = '' ) =>
		find(
			this.props.verticals,
			item => item.verticalName.toLowerCase() === value.toLowerCase().trim() && !! item.preview
		);

	/***
	 * Callback to be passed to consuming component when the search value is updated.
	 * TODO: once the siteVertical state got simplified, this can be removed.
	 *
	 * @param {Object} verticalData An object from the vertical results array
	 * @param {String} value Search query array
	 */
	updateVerticalData = ( verticalData, value = '' ) => {
		this.props.onChange(
			verticalData || {
				isUserInputVertical: true,
				parent: '',
				preview: get( this.props.defaultVertical, 'preview', '' ),
				verticalId: '',
				verticalName: value,
				verticalSlug: value,
			}
		);
	};

	/***
	 * Callback to be passed to consuming component when the search field is updated.
	 *
	 * @param {String} value The new search value
	 */
	onSiteTopicChange = value => {
		// TODO:
		// Where to put the railcar code will be reconsidered.
		if (
			!! value &&
			value !== this.state.searchValue &&
			size( value ) >= this.props.charsToTriggerSearch
		) {
			this.setState( { railcar: this.getNewRailcar() } );
		}

		this.setState( {
			searchValue: value,
			isSuggestionSelected: false,
		}, () => this.updateVerticalDataDebounced( this.searchForVerticalMatches( value ), value ) );
	};

	/***
	 * Callback to be passed to consuming component a search suggestion is selected.
	 *
	 * @param {String} value The new search value
	 */
	onSiteTopicSelect = value => {
		this.setState( {
			searchValue: value,
			isSuggestionSelected: true,
		}, () => this.updateVerticalData( this.searchForVerticalMatches( value ), value ) );
	};

	getSuggestions = () => this.state.candidateVerticals.map( vertical => vertical.verticalName );

	render() {
		const {
			translate,
			placeholder,
			autoFocus,
			isVerticalSearchPending,
		} = this.props;

		return (
			<>
				<QueryVerticals searchTerm={ this.state.searchValue.trim() } debounceTime={ 300 } />
				<QueryVerticals searchTerm={ DEFAULT_VERTICAL_KEY } limit={ 1 } />
				<SuggestionSearch
					id="siteTopic"
					placeholder={ placeholder || translate( 'Enter a keyword or select one from below.' ) }
					onChange={ this.onSiteTopicChange }
					onSelect={ this.onSiteTopicSelect }
					suggestions={ this.getSuggestions() }
					value={ this.state.searchValue }
					autoFocus={ autoFocus } // eslint-disable-line jsx-a11y/no-autofocus
					isSearching={ isVerticalSearchPending }
					railcar={ this.state.railcar }
				/>
				{ this.props.shouldShowPopularTopics( this.state.searchValue ) && (
					<PopularTopics onSelect={ this.onSiteTopicSelect } />
				) }
			</>
		);
	}
}

export default localize(
	connect(
		( state, ownProps ) => {
			const verticals = getVerticals( state, ownProps.searchValue );
			const isVerticalSearchPending = ownProps.searchValue && null == verticals;
			return {
				verticals: verticals || [],
				isVerticalSearchPending,
				defaultVertical: get( getVerticals( state, 'business' ), '0', {} ),
			};
		},
		( dispatch, ownProps ) => ( {
			shouldShowPopularTopics: searchValue => ! searchValue && ownProps.showPopular,
		} )
	)( SiteVerticalsSuggestionSearch )
);
