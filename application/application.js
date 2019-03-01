
'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { FileSystemWallet, Gateway } = require('fabric-network');


// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), '_idwallet');
const wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

// capture network variables from config.json
const configPath = path.join(process.cwd(), '/config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);
var connection_file = config.connection_file;
var gatewayDiscovery = config.gatewayDiscovery;

const ccpPath = path.resolve(__dirname, connection_file);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);


async function main(){

    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {

        // A gateway defines the peers used to access Fabric networks
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'User1@org1.example.com', discovery: gatewayDiscovery });
 
        console.log('Connected to Fabric gateway.');

        // Get addressability to network
        const network = await gateway.getNetwork('mychannel');

        console.log('Got addressability to network');

        // Get addressability to  contract
        const contract = await network.getContract('globalcitizen');

        console.log('Got addressability to contract');

        console.log('\nSubmit first transaction.');

        
        const createGlobalCitizenResponse = await contract.submitTransaction('CreateGlobalCitizen');
        console.log('createGlobalCitizenResponse: ');
        console.log(JSON.parse(createGlobalCitizenResponse.toString()));
    
        var aidOrgId = "A1";
        var aidOrgName = "Education-Aid";        
        const createAidOrgResponse = await contract.submitTransaction('CreateAidOrg', aidOrgId, aidOrgName);
        console.log('createAidOrgResponse: ');
        console.log(JSON.parse(createAidOrgResponse.toString()));


        var govOrgId = "G1";
        var govOrgName = "RichCountry1 Government";     
        const createGovOrgResponse = await contract.submitTransaction('CreateGovOrg', govOrgId, govOrgName);
        console.log('createGovOrgResponse: ');
        console.log(JSON.parse(createGovOrgResponse.toString()));


        var pledgeId = "p1";
        var name = "School Pledge";
        var description = "Build a new school";
        var fundsRequired = "100000";        
        const createProjectPledgeResponse = await contract.submitTransaction('CreateProjectPledge', pledgeId, name, description, fundsRequired, aidOrgId);
        console.log('createProjectPledgeResponse: ');
        console.log(JSON.parse(createProjectPledgeResponse.toString()));

        
        const sendPledgeToGlobalCitizenResponse = await contract.submitTransaction('SendPledgeToGlobalCitizen', pledgeId, aidOrgId);
        console.log('sendPledgeToGlobalCitizenResponse: ');
        console.log(JSON.parse(sendPledgeToGlobalCitizenResponse.toString()));
        

        console.log('submit SendPledgeToGovOrg: ');
        const sendPledgeToGovOrgResponse = await contract.submitTransaction('SendPledgeToGovOrg', pledgeId, govOrgId);
        console.log('sendPledgeToGovOrgResponse: ');
        console.log(JSON.parse(sendPledgeToGovOrgResponse.toString()));
        

        var fundingType = 'WEEKLY';
        var approvedFunding = "100000";
        var fundsPerInstallment = "1000"
        const fundPledgeResponse = await contract.submitTransaction('FundPledge', pledgeId, govOrgId, fundingType, approvedFunding, fundsPerInstallment);
        console.log('fundPledgeResponse: ');
        console.log(JSON.parse(fundPledgeResponse.toString()));


        const transferFundsResponse = await contract.submitTransaction('TransferFunds', pledgeId, govOrgId);
        console.log('transferFundsResponse: ');
        console.log(JSON.parse(transferFundsResponse.toString()));



        //  show state of pledge, govOrg, aidOrg
        const pledgeStateResponse = await contract.submitTransaction('GetState', pledgeId);
        console.log('pledgeStateResponse: ')
        console.log(JSON.parse(pledgeStateResponse.toString()));

        const aidOrgIdStateResponse = await contract.submitTransaction('GetState', aidOrgId);
        console.log('aidOrgIdStateResponse: ')
        console.log(JSON.parse(aidOrgIdStateResponse.toString()));

        const govOrgIdStateResponse = await contract.submitTransaction('GetState', govOrgId);
        console.log('govOrgIdStateResponse: ')
        console.log(JSON.parse(govOrgIdStateResponse.toString()));

    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
    } finally {
        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        await gateway.disconnect();
    }
}

// invoke the main function, can catch any error that might escape
main().then(()=>{
    console.log('done');
}).catch((e)=>{
    console.log('Final error checking.......');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});