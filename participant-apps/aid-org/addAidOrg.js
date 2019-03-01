/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// capture network variables from config.json
const configPath = path.join(process.cwd(), '..', '/config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);
var connection_file = config.connection_file;
var gatewayDiscovery = config.gatewayDiscovery;

const ccpPath = path.resolve(__dirname, '..', connection_file);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

// aid organization id and name
const aidOrgId = "Aid1";
const aidOrgName = "Education-Aid";  

async function addAidOrg() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '_idwallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(aidOrgId);
        if (!userExists) {
            console.log('An identity for the user' + aidOrgId + ' does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: aidOrgId, discovery: gatewayDiscovery });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('globalcitizen');

        // Submit the specified transaction.
        console.log('\nSubmit CreateAidOrg transaction.');
                     
        const createAidOrgResponse = await contract.submitTransaction('CreateAidOrg', aidOrgId, aidOrgName);
        console.log('createAidOrgResponse: ');
        console.log(JSON.parse(createAidOrgResponse.toString()));

        console.log('\nGet Aid1 state ');
        const aidOrgResponse = await contract.evaluateTransaction('GetState', aidOrgId);
        console.log('aidOrgResponse.parse_response: ')
        console.log(JSON.parse(JSON.parse(aidOrgResponse.toString())));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

addAidOrg();
