const { db, dataFromSnap } = require( '../firebase' )
const { log, dev } = require("../helpers")
const { get_node_data_by_eth1 } = require( '../beaconchain/beaconcha_in_api' )
const { get_weth_price_from_thegraph } = require( '../thegraph/price_oracle' )

// EPNS data
const functions = require("firebase-functions")
const { epns } = functions.config()
const EpnsSDK = require( '@epnsproject/backend-sdk' ).default
const enpsSdk = new EpnsSDK( `0x${epns.private_key}`, {
	channelAddress: '0x7DBF6820D32cFBd5D656bf9BFf0deF229B37cF0E'
} )

const epns_payload_from_subscription = async ( { node_address, subscriber, node_data_cache={}, weth_price } ) => {

	let tldr = undefined

	if( !weth_price ) {

		const new_weth_price = await get_weth_price_from_thegraph()
		log( `WETH price: `, new_weth_price )
		weth_price = new_weth_price

	}


	
	// If there is a cache hit, use it
	if( node_data_cache[ node_address ] ) {
		log( `Validator cache hit` )
		tldr = node_data_cache[ node_address ]
	}

	// If not, get the new data and set it to cache
	if( !node_data_cache[ node_address ] ) {
		const node_data = await get_node_data_by_eth1( node_address )
		node_data_cache[ node_address ] = node_data
		tldr = node_data
		log( `No cache hit, data from remote: `, node_data )
	}

	// Round the weth price to round number
	weth_price = Math.round( weth_price * 100 ) / 100

	// Generate dollar price
	const dollars_gained = Math.round( ( weth_price * Number( tldr.balance_change_eth ) ) * 100) / 100

	// Format EPNS noti according to https://docs.epns.io/developer-zone/developer-guides/sending-notifications/server-workflow/backend-sdk-quick-set-up
	return {
		recipientAddress: subscriber,
		push_notification_title: `Beaconpulse - validator ${ tldr.online ? 'up' : 'DOWN' }`,
		push_notification_body: `Balance up by ${ tldr.balance_change_eth }ETH ($${dollars_gained}). ${ tldr.missed.length } issues.`,
		notification_title: `Beaconpulse - ${ tldr.missed.length } issues`,
		notification_body: `Balance change: ${ tldr.balance_change_eth }ETH ($${dollars_gained}). Issues: ${ tldr.missed.length == 0 ? 'none' : tldr.missed.join( `, ` ) }.`,
		notificatinon_type: 3,
		cta: `https://beaconcha.in/validators/eth1deposits?q={ node_address }`,
		image: 'https://beaconpulse.web.app/logo512.png'
	}

}

async function get_epns_payloads( ) {

	try {

		if( dev ) log( `IN DEV MODE: grabbing all notis for tomorrow` )

		/* ///////////////////////////////
		// Get notifications that need to be sent */
		const day_in_ms = 1000 * 60 * 60 * 24
		const now = Date.now()
		const tomorrow = Date.now() + day_in_ms
		const subscriptions = await db.collection( 'subscriptions' )
							.where( 'next_notification', '<', dev ? tomorrow : now )
							.get()
							.then( dataFromSnap )


		if( subscriptions.length == 0 ) return

		/* ///////////////////////////////
		// Get thegraph price data */
		const weth_price = await get_weth_price_from_thegraph()
		log( `WETH price: `, weth_price )

		/* ///////////////////////////////
		// Formulate EPNS payloads */
		const node_data_cache = {}
		const epns_payloads = await Promise.all( subscriptions.map( ( { node_address, subscriber } ) => epns_payload_from_subscription( node_address, subscriber, node_data_cache, weth_price ) ) )

		/* ///////////////////////////////
		// Move notification markers to tomorrow */
		if( dev ) log( `DEV ENVIRONMENT: not moving notification markers to tomorrow` )
		if( !dev ) await Promise.all( subscriptions.map( ( { uid, next_notification } ) => {

			const new_next_notification = next_notification + day_in_ms
			return db.collection( 'subscriptions' ).doc( uid ).set( {
				next_notification: new_next_notification,
				next_notification_human: new Date( new_next_notification ).toString(),
				updated: Date.now(),
				updated_human: new Date().toString()
			}, { merge: true } )

		} ) )

		return epns_payloads

	} catch( e ) {

		log( `epns_payloads_by_subscriber error: `, e )

		return {
			error: 'epns_payloads_by_subscriber',
			message: e.message
		}

	}

}

async function send_single_epns_message( payload ) {

	log( `Sending EPNS message: `, payload )
	const response = await enpsSdk.sendNotification(
		payload.recipientAddress,
		payload.push_notification_title,
		payload.push_notification_body,
		payload.notification_title,
		payload.notification_body,
		payload.notificatinon_type,
		payload.cta,
		payload.image
	)
	log( `EPNS response: `, response )


}

exports.epns_payload_from_subscription = epns_payload_from_subscription
exports.send_queued_epns_notifications = async function() {

	try {

		// Get message payloads we should send
		const message_payloads = await get_epns_payloads()

		// Send notifications to EPNS
		await Promise.all( message_payloads.map( send_single_epns_message ) )

	} catch( e ) {

		console.error( `send_epns_notifications error: `, e )

	}

}

exports.send_single_epns_message = send_single_epns_message