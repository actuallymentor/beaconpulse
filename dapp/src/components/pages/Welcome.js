import { H1, H2, Text } from '../atoms/Text'
import Section from '../atoms/Section'
import Hero from '../organisms/Hero'
import Container from '../atoms/Container'
import Button from '../atoms/Button'
import { useNavigate } from 'react-router-dom'
import { getAddress, useAddress } from '../../modules/web3'
import { log } from '../../modules/helpers'
import { useState } from 'react'
import Loading from '../molecules/Loading'
import Tile from '../atoms/Tile'

export default ( { ...props } ) => {

	const navigate = useNavigate()
	const address = useAddress()
	const [ manualAddress, setManualAddress ] = useState(  )
	const [ loading, setLoading ] = useState(  )

	// Handle user login interaction
	async function connect_wallet( e ) {

		e.preventDefault()

		try {

			setLoading( 'Connecting to Metamask' )
			const address = await getAddress()
			setManualAddress( address )
			log( 'Received: ', address )

		} catch( e ) {
			alert( `Metamask error: ${ e.message || JSON.stringify( e ) }. Please reload the page.` )
		} finally {
			setLoading( false )
		}

	}

	if( loading ) return <Loading message={ loading } />

	return <Container justify='flex-start' { ...props }>
	
			<Hero align='flex-start'>
				
				<H1>Beacon Pulse</H1>
				<H2>A daily push notification with the ETH winnings of your Ethereum Beaconchain validator.</H2>
				<Text>Delivered through the Ethereum Push Notification Service (EPNS).</Text>
				{ ( address || manualAddress ) && <Button onClick={ f => navigate( '/subscribe' ) }>Register for notifications</Button> }
				{ ( !address && !manualAddress ) && <Button onClick={ connect_wallet }>Connect wallet</Button> }

			</Hero>

			<Section align='flex-start'>
				
				<H2>How it works</H2>

				<Section justify='space-around' direction='row'>

					<Tile>
						<H2>📱</H2>
						<Text>Notifications are sent to your wallet using the <b>Ethereum Push Notification Service</b>. <a target='_blank' href='https://epns.io/'>Read about EPNS</a>.</Text>
					</Tile>

					<Tile>
						<H2>🔔</H2>
						<Text>The daily Push notification shows the amount of ETH your Beacon node generated over the last 24h.</Text>
					</Tile>

					<Tile>
						<H2>👻</H2>
						<Text>The notification tells you if you missed any attestations, proposals, or sync committee duties.</Text>
					</Tile>
					
					<Tile>
						<H2>💸</H2>
						<Text>Signup is off-chain and entirely free. You sign a gassless message that ensures you are the owner of the receiving address.</Text>
					</Tile>


				</Section>

			</Section>

	</Container>
}