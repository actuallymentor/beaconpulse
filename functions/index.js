const functions = require("firebase-functions")

const generousRuntime = {
	timeoutSeconds: 540,
	memory: '4GB'
}

const { subscribe_to_node } = require( './modules/morningbeacon/nodes' )
exports.subscribe_to_node = functions.runWith( generousRuntime ).https.onCall( subscribe_to_node )

const { send_queued_epns_notifications } = require( './modules/epns/notifications' )
exports.epns_notification_cron = functions.runWith( generousRuntime ).pubsub.schedule( '5,35 * * * *' ).onRun( send_queued_epns_notifications )

const { get_weth_price_from_thegraph } = require( './modules/thegraph/price_oracle' )
exports.get_weth_price_from_thegraph = functions.https.onCall( get_weth_price_from_thegraph )