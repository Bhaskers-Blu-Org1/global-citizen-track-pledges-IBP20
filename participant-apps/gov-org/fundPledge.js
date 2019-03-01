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
const connection_file = config.connection_file;
const gatewayDiscovery = config.gatewayDiscovery;

const ccpPath = path.resolve(__dirname, '..', connection_file);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

// funding details
const govOrgId = "Gov1";
const pledgeId = "p1"; 
const fundingType = 'WEEKLY';
const approvedFunding = "100000";
const fundsPerInstallment = "1000";

async function fundPledge() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '_idwallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(govOrgId);
        if (!userExists) {
            console.log('An identity for the user' + govOrgId + ' does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: govOrgId, discovery: gatewayDiscovery });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('globalcitizen');

        // Submit the specified transaction.
        console.log('\nSubmit SendPledgeToGovOrg transaction.');
               
        console.log('submit FundPledge: ');
        
        const fundPledgeResponse = await contract.submitTransaction('FundPledge', pledgeId, govOrgId, fundingType, approvedFunding, fundsPerInstallment);
        console.log('fundPledgeResponse: ');
        console.log(JSON.parse(fundPledgeResponse.toString()));

        console.log('\nGet Pledge state ');
        const pledgeResponse = await contract.evaluateTransaction('GetState', pledgeId);
        console.log('pledgeResponse.parse_response: ')
        console.log(JSON.parse(JSON.parse(pledgeResponse.toString())));

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

fundPledge();
