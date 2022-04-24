const functions = require("firebase-functions")
const { ApolloClient, InMemoryCache, gql } = require( '@apollo/client' )
const { thegraph } = functions.config()
const { log } = require( '../helpers' )
const { db, dataFromSnap } = require("../firebase")

const APIURL = `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3`
const client = new ApolloClient({
	uri: APIURL,
	cache: new InMemoryCache(),
})

const timeout_with_data = ms => new Promise( resolve => {

	setTimeout( f => resolve( { data: undefined } ), ms )

} )

exports.get_weth_price_from_thegraph = async function() {

	try {

		const weth_price_query = `
			query {
				pool( id: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8" ) {
					tick
					token0Price,
				}
			}
		`

		const { data } = await Promise.race( [
			timeout_with_data( 3000 ),
			client.query( { query: gql( weth_price_query ) } ).catch( e => ( { data: undefined } ) )
		] )

		const graph_weth_price = data?.pool.token0Price

		if( graph_weth_price ) {

			log( `Graph WETH price: `, graph_weth_price )

			// Set the newly received value to local cache
			await db.collection( 'cache' ).doc( 'thegraph' ).set( { weth_price: graph_weth_price, updated: Date.now(), updated_human: new Date().toString() }, { merge: true } )
			return graph_weth_price

		}

		// If the graph had issues, get a cached value
		const { weth_price } = await db.collection( 'cache' ).doc( 'thegraph' ).get().then( dataFromSnap )
		return weth_price

	} catch( e ) {
		log( `Graph error: `, e )
		return
	}

}

