const { throw_if_invalid_context, db, dataFromSnap } = require( '../firebase' )
const { log, require_properties, allow_only_these_properties } = require( '../helpers' )
const { verify_message } = require( '../web3' )
const { get_validator_data_by_eth1 } = require( '../beaconchain/beaconcha_in_api' )
const { epns_payload_from_subscription, send_single_epns_message } = require( '../epns/notifications' )
const Throttle = require( 'promise-parallel-throttle' )

exports.subscribe_to_node = async ( message, context ) => {


	try {

		// Appcheck validation
		throw_if_invalid_context( context )
		log( `Context passed` )

		/* ///////////////////////////////
		// Register the node */

		// validate signature
		log( `Verifying message: `, message )
		const valid = await verify_message( message )
		if( !valid ) throw new Error( `Invalid signature` )
		log( `Message valid` )

		// Get node to follow from message
		log( `Parsing claimed message` )
		const { claimed_message, claimed_signatory } = message
		const { action, timestamp, node_to_follow, next_notification } = JSON.parse( claimed_message )
		log( `Running ${ action } with ${ node_to_follow }` )

		// Validations
		if( action != 'subscribe' ) throw new Error( `Irrelevant message` )
		if( !node_to_follow.match( /0x.{40}/ ) ) throw Error ( `Invalid payload` )
		if( timestamp > Date.now() + 10000 ) throw new Error( `Expired signature` )
		if( typeof next_notification != 'number' ) throw new Error( `Invalid notification time` )

		// Store subscription in firestore
		const subscription_reference = await db.collection( `subscriptions` ).add( {
			subscriber: claimed_signatory,
			node_address: node_to_follow,
			next_notification,
			next_notification_human: new Date( next_notification ).toString(),
			updated: Date.now(),
			updated_human: new Date().toString()
		} )

		// Send one-time welcome message
		const subscription_data = await subscription_reference.get().then( dataFromSnap )
		const epns_payload = await epns_payload_from_subscription( subscription_data )

		await send_single_epns_message( epns_payload )


	} catch( e ) {

		log( `Error in subscribe_to_node: `, e )

		return {
			error: `subscribe_to_node error`,
			message: e.message
		}

	}

}