// ///////////////////////////////
// Development helpers
// ///////////////////////////////
export const dev = process.env.NODE_ENV === 'development' || ( typeof location !== 'undefined' && ( location.href.includes( 'debug=true' ) || location.href.includes( 'localhost' ) ) )

export const log = ( ...messages ) => {
	if( dev ) console.log( ...messages )
}

// Listener management
export function setListenerAndReturnUnlistener( parent, event, callback ) {

	log( `${ event } listener requested on `, parent )

	if( !parent ) return

	// Set listener
	parent.on( event, callback )
	log( `Created ${ event } listener on `, parent )

	// Return unsubscriber
	return () => {
		log( `Unregistering ${ event } on `, parent, ' with ', callback )
		parent.removeListener( event, callback )
	}

}

// ///////////////////////////////
// Date helpers
// ///////////////////////////////
export const dateOnXDaysFromNow = days => {

	const daysInMs = days * 24 * 60 * 60 * 1000
	return new Date( Date.now() + daysInMs ).toISOString().slice(0, 10)

}

export const monthNameToNumber = monthName => {
	const months = [ 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december' ]
	const monthNumber = months.findIndex( month => month.includes( monthName.toLowerCase() ) ) + 1
	return `${monthNumber}`.length == 1 ? `0${monthNumber}` : monthNumber
}

// ///////////////////////////////
// Visual
// ///////////////////////////////

export const wait = ( time, error=false ) => new Promise( ( res, rej ) => setTimeout( error ? rej : res, time ) )

