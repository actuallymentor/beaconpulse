const functions = require("firebase-functions")
const { beaconchain } = functions.config()
const fetch = require( 'isomorphic-fetch' )
const { log, wait } = require("../helpers")
const Throttle = require( 'promise-parallel-throttle' )
const Retry = require('promise-retry')

async function call_beaconcha_in_endpoint( endpoint, data, throw_on_issue=true, verbose=false ) {

	try {

		let api_url = 'https://beaconcha.in/api/v1'
		let headers = {
			apikey: `${ beaconchain.api_key }`
		}

		if( verbose ) log( `🌐 Calling ${ api_url }${ endpoint }` )

		// Do request
		const res = await Promise.race( [
			fetch( `${ api_url }${ endpoint }`, { headers } ),
			wait( 5000, false, false )
		] )

		if( verbose ) log( `🌐 Response received for ${ api_url }${ endpoint }` )
		if( !res ) throw new Error( `Timeout on: ${ api_url }${ endpoint }` )

		// Clone request for use in case of failure
		const backup_res = res.clone()

		// Parse the response
		let response_data = undefined

		try {

			// Try to access response as json first
			if( verbose ) log( `🌐 Reading response JSON` )

			// For some reason the Beaconcha.in API sometimes does not resolve as JSON
			const { status, message, data } = await Promise.race( [
				res.json(),
				wait( 1000, { status: 'json timeout' } )
			] )
			if( verbose ) log( `API Status: ${ status }` )
			if( status != 'OK' || message ) throw new Error( `Beaconcha.in error ${ status || message }` )
			if( verbose ) log( `JSON data: `, data )
			response_data = { data }

		} catch( e ) {

			if( verbose ) log( `🌐🚨 Request issue: `, e )

			// If json fails, try as text
			const text = await backup_res.text().catch( e => e.message )
			if( verbose ) log( 'API ERROR, text response: ', text )
			response_data = JSON.parse( text )

		}

		// If the response has error/message props, make it error
		if( response_data.error || response_data.message ) throw new Error( response_data.error || response_data.message )

		return response_data


	} catch( e ) {

		if( verbose ) log( `call_beaconcha_in_endpoint error `, e )
		if( throw_on_issue ) throw new Error( `🚨 Beaconcha.in API failed with ${ e.message }` )
		return { error: 'call_beaconcha_in_endpoint error', message: e.message }

	}

}

const get_validators_by_eth1 = async eth1 => {

	log( `Get validators for `, eth1 )
	const { data: validators } = await call_beaconcha_in_endpoint( `/validator/eth1/${ eth1 }`, true )

	log( `Got validators for `, eth1 )
	if( !Array.isArray( validators ) ) return [ validators ]
	return validators

}

const get_validator_data_by_index = async ( index, cooldown_in_ms=500 ) => {

	try {

		log( `Get validator data for `, index )

		// Get validator overview from beaconcha.in
		const { data: validator_data } = await call_beaconcha_in_endpoint( `/validator/${ index }` )
		log( `Beaconcha.in data for ${ index } received` )
		if( !validator_data ) throw new Error( `Data for validator ${ index } returned undefined` )

		// Check if this is a Rocketpool node
		log( `Checking ${ index } for Rocketpool status` )
		const rocketpool_contract = '0x010000000000000000000000f17ee229676d6d238f1961ffb939681e181383da'
		if( validator_data.withdrawalcredentials == rocketpool_contract ) {
			log( `Validator ${ index } is Rocketpool` )
			validator_data.is_rocketpool = true
		}

		// If this is a rocketpool node, get the Rocketpool data
		if( validator_data.is_rocketpool ) {

			log( `Get rocketpool data for `, index )
			const { data: rocketpool_data } = await call_beaconcha_in_endpoint( `/rocketpool/validator/${ index }` )
			validator_data.rocketpool_data = rocketpool_data

		}

		// Add stat and balance history
		log( `Calling for validator ${ index } stats` )
		const { data: stat_history } = await call_beaconcha_in_endpoint( `/validator/stats/${ index }` )
		if( !stat_history.length ) throw new Error( `History for ${ index } unexpected: `, stat_history )
		log( `Stat history for ${ index } has ${ stat_history.length } entries` )
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

		log( `Validator ${ index } data complete` )

		// Cooldown to be nice to the beaconcha.in API
		await wait( cooldown_in_ms )

		return validator_data

	} catch( e ) {
		log( `get_validator_data_by_index error: `, e )
		throw e
	}

}


exports.get_node_data_by_eth1 = async eth1 => {

	try {

		const validators = await get_validators_by_eth1( eth1 )
		if( !validators.length ) throw new Error( `This ETH1 address has no validators associated with it` )

		// Throttled API calls
		log( `⏳ Get data for ${ validators.length } validators` )
		const validator_data = await Throttle.all( validators.map( ( { validatorindex } ) => () => {

			return Retry( ( retry, number ) => {

				log( `Retryable get_validator_data_by_index for ${ validatorindex }` )
				return get_validator_data_by_index( validatorindex ).catch( async e => {

					if( number <= 5 ) {
						const timeout = 10000 * number
						log( `⚠️ Retry ${ number } for validator ${ validatorindex } data...` )
						await wait( timeout )
						log( `♻️ ${ timeout/1000 }s timeout done, continuing` )
						return retry()
					}
					log( `get_validator_data_by_index error: `, e )
					throw e

				} )

			} )

		} ), { maxInProgress: 1 } )

		log( `✅ Got validator data for ${ validator_data.length } validators` )

		
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