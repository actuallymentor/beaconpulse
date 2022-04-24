const functions = require("firebase-functions")
const { beaconchain } = functions.config()
const fetch = require( 'isomorphic-fetch' )
const { log } = require("../helpers")

async function call_beaconcha_in_endpoint( endpoint, data, verbose=false ) {

	try {

		let api_url = 'https://beaconcha.in/api/v1'
		let headers = {
			apikey: `${ beaconchain.api_key }`
		}

		if( verbose ) log( `Calling ${ api_url }${ endpoint }` )
		const res = await fetch( `${ api_url }${ endpoint }`, { headers } )
		const backup_res = res.clone()

		// Parse the response
		let response_data = undefined

		try {

			// Try to access response as json first
			const { status, data } = await res.json()
			if( status != 'OK' ) throw new Error( `Beaconcha.in error` )
			if( verbose ) log( `Response data: `, data )
			response_data = { data }

		} catch( e ) {

			if( verbose ) log( `Request issue: `, e )

			// If json fails, try as text
			const text = await backup_res.text().catch( e => e.message )
			if( verbose ) log( 'API text response: ', text )
			response_data = {
				error: `Error calling ${ api_url }`,
				message: text
			}

		}

		if( verbose ) log( `Response data: `, response_data )
		return response_data


	} catch( e ) {

		if( verbose ) log( `call_beaconcha_in_endpoint error `, e )
		return { error: 'call_beaconcha_in_endpoint error', message: e.message }

	}

}

const get_validators_by_eth1 = async eth1 => {

	const { data: validators, error, message } = await call_beaconcha_in_endpoint( `/validator/eth1/${ eth1 }`, true )
	if( error ) throw new Error( `Beaconcha.in error: `, message )
	// log( `Validators: `, validators )

	if( !Array.isArray( validators ) ) return [ validators ]
	return validators

}

const get_validator_data_by_index = async index => {

	// Get validator overview from beaconcha.in
	const { data: validator_data, error, message } = await call_beaconcha_in_endpoint( `/validator/${ index }` )
	if( error ) throw new Error( `Beaconcha.in error: `, message )

	// Check if this is a Rocketpool node
	const rocketpool_contract = '0x010000000000000000000000f17ee229676d6d238f1961ffb939681e181383da'
	if( validator_data.withdrawalcredentials == rocketpool_contract ) validator_data.is_rocketpool = true

	// If this is a rocketpool node, get the Rocketpool data
	if( validator_data.is_rocketpool ) {

		const { data: rocketpool_data } = await call_beaconcha_in_endpoint( `/rocketpool/validator/${ index }` )
		validator_data.rocketpool_data = rocketpool_data

	}

	// Add stat and balance history
	const { data: stat_history } = await call_beaconcha_in_endpoint( `/validator/stats/${ index }` )
	const [ last_day, previous_day ] = stat_history
	const balance_change_eth = ( last_day.end_balance - previous_day.end_balance ) / ( 10**9 )
	validator_data.balance_change_eth = balance_change_eth
	validator_data.last_day_performance = last_day

	// Create a TL;DR property
	validator_data.tldr = {
		balance_change_eth,
		missed: Object.keys( last_day ).filter( key => key.includes( 'missed_' ) ).filter( key => last_day[ key ] ),
		online: validator_data.status == 'active_online'
	}

	return validator_data

}


exports.get_node_data_by_eth1 = async eth1 => {

	try {

		const validators = await get_validators_by_eth1( eth1 )
		const validator_data = await Promise.all( validators.map( ( { validatorindex } ) => get_validator_data_by_index( validatorindex ) ) )
		
		const node_data = validator_data.reduce( ( acc, val ) => {

			const { balance_change_eth: prev_balance=0, online: prev_online=true, missed: prev_missed=[] } = acc
			const { balance_change_eth: additional_balance=0, online=true, missed=[] } = val.tldr

			const new_acc = {
				balance_change_eth: prev_balance + additional_balance,
				missed: [ ...new Set( [ ...missed, ...prev_missed ] ) ],
				online: prev_online || online
			}

			log( `New acc: `, new_acc )

			return new_acc

		}, {} )

		return node_data

	} catch( e ) {
		log( `get_validator_data_by_eth1 error `, e )
		return { error: 'get_validator_data_by_eth1 error', message: e.message }
	}

}