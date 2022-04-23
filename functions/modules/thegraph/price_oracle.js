const functions = require("firebase-functions")
const { ApolloClient, InMemoryCache, gql } = require( '@apollo/client' )
const { thegraph } = functions.config()
const { log } = require( '../helpers' )
const { db, dataFromSnap } = require("../firebase")

const APIURL = `https://gateway.thegraph.com/api/${ thegraph.api_key }/subgraphs/id/D7azkFFPFT5H8i32ApXLr34UQyBfxDAfKoCEK4M832M6`
const client = new ApolloClient({
  uri: APIURL,
  cache: new InMemoryCache(),
})


exports.get_weth_price_from_thegraph = async function() {

	try {

		const weth_price_query = `
			query {
				pairs( where: { id: "0x06da0fd433c1a5d7a4faa01111c044910a184553" } ) {
					id,
					token1Price
				}
			}
		`

		const { data } = await client.query( { query: gql( weth_price_query ) } )
		if( data ) {

			// Set the newly received value to local cache
			await db.collection( 'cache' ).doc( 'thegraph' ).set( { weth_price: data.token1Price, updated: Date.now(), updated_human: new Date().toString() }, { merge: true } )
			return data.token1Price

		}

		// If the graph had issues, get a cached value
		const { weth_price } = await db.collection( 'cache' ).doc( 'thegraph' ).get().then( dataFromSnap )
		return weth_price

	} catch( e ) {
		log( `Graph error: `, e )
		return
	}

}

