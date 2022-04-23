# Beaconpulse

*This is a Devconnect 2022 project.*

A daily push notification with the ETH winnings of your Ethereum Beaconchain validator.

## Usage

Beaconpulse is deployed live at [https://beaconpulse.web.app/]( https://beaconpulse.web.app/ ).

## dApp stack

The frontend dApp is build using:

- `create react app` + sugar ( styled components etc )
- `ethers` as the web3 interactor
- `firebase` sdk as interactor with the serverless backend

The backend is built using:

- `firebase` cloud functions
- Ethereum Push Notification Service (deployed on `mainnet`)
- `ethers` as the web3 interactor

