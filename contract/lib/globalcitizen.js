/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const ClientIdentity = require('fabric-shim').ClientIdentity;

// predefined pledge states
const PledgeState = {
    Initial: {code: 1, text: 'INITIALSTATE'},
    GlobalCitizenReview: {code: 2, text: 'GLOBALCITIZENREVIEW'},
    GovOrgReview: {code: 3, text: 'GOVORGREVIEW'},
    ProposalFunded: {code: 4, text: 'PROPOSALFUNDED'}
};

class GlobalCitizen extends Contract {

    async instantiate(ctx) {
        console.info('instantiate');
        let emptyList = [];
        await ctx.stub.putState('aidOrgs', Buffer.from(JSON.stringify(emptyList)));
        await ctx.stub.putState('govOrgs', Buffer.from(JSON.stringify(emptyList)));        
    }

    async CreateGlobalCitizen(ctx) {

        // Use the Client Identity Chaincode Library (CID) to get the invoker info.
        let cid = new ClientIdentity(ctx.stub);

        let globalCitizen = {            
            projectPledges: [],
            type: 'GlobalCitizen',
            creatorId: cid.getID()
        };
        await ctx.stub.putState('GlobalCitizen', Buffer.from(JSON.stringify(globalCitizen)));

        // return aidOrg object
        return JSON.stringify(globalCitizen);

    }

    // create a aid object on the blockchain state
    async CreateAidOrg(ctx, id, name) {

        // Use the Client Identity Chaincode Library (CID) to get the invoker info.
        let cid = new ClientIdentity(ctx.stub);

        let aidOrg = {            
            id: id,
            name: name,
            projectPledges: [],
            type: 'aidOrg',
            creatorId: cid.getID(),
        };
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(aidOrg)));

        // add id to 'aidOrgs' key
        let aidOrgsData = await ctx.stub.getState('aidOrgs');
        if (aidOrgsData) {
            let aidOrgs = JSON.parse(aidOrgsData.toString());
            aidOrgs.push(id);
            await ctx.stub.putState('aidOrgs', Buffer.from(JSON.stringify(aidOrgs)));
        } else {
            throw new Error('aidOrgs not found');
        }

        // return aidOrg object
        return JSON.stringify(aidOrg);
    }


    // create a gov object on the blockchain state
    async CreateGovOrg(ctx, id, name) {

        // Use the Client Identity Chaincode Library (CID) to get the invoker info.
        let cid = new ClientIdentity(ctx.stub);

        let govOrg = {
            id: id,
            name: name,
            projectPledges: [],
            fundedPledges: [],
            type: 'govOrg',
            creatorId: cid.getID()
        };
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(govOrg)));

        // add id to 'govOrgs' key
        let govOrgsData = await ctx.stub.getState('govOrgs');
        if (govOrgsData) {
            let govOrgs = JSON.parse(govOrgsData.toString());
            govOrgs.push(id);
            await ctx.stub.putState('govOrgs', Buffer.from(JSON.stringify(govOrgs)));
        } else {
            throw new Error('govOrgs not found');
        }

        // return gov object
        return JSON.stringify(govOrg);
    }

    async CreateProjectPledge(ctx, pledgeId, name, description, fundsRequired, aidOrgId) {
        
        // verify aidOrgId and retreive aidOrg, ensure aidOrgId is the caller
        let aidOrgAsBytes = await ctx.stub.getState(aidOrgId); 
        if (!aidOrgAsBytes || aidOrgAsBytes.length === 0) {
            throw new Error(`${aidOrgId} does not exist`);
        }
        let aidOrg = JSON.parse(aidOrgAsBytes.toString());
        let cid = new ClientIdentity(ctx.stub);
        if (aidOrg.creatorId != cid.getID()) {
            throw new Error('only aidOrg creator can call this');
        }
        if (aidOrg.type !== 'aidOrg') {
            throw new Error('aidOrg not identified');
        }
        
        // project pledge object
        let projectPledge = {
            pledgeId: pledgeId,
            name: name,
            description: description,
            fundsRequired: Number(fundsRequired),
            status: JSON.stringify(PledgeState.Initial),
            aidOrgId: aidOrgId,
            funds: [],
            type: 'pledge'
        };

        // store pledge identified by pledgeId
        await ctx.stub.putState(pledgeId, Buffer.from(JSON.stringify(projectPledge)));

        // add projectPledge to aidOrg
        aidOrg.projectPledges.push(pledgeId);
        await ctx.stub.putState(aidOrgId, Buffer.from(JSON.stringify(aidOrg)));

        // return projectPledge object
        return JSON.stringify(projectPledge);
    }

    async SendPledgeToGlobalCitizen(ctx, pledgeId, aidOrgId) {
        
        // verify aidOrgId and retreive aidOrg, ensure aidOrgId is the caller
        let aidOrgAsBytes = await ctx.stub.getState(aidOrgId); 
        if (!aidOrgAsBytes || aidOrgAsBytes.length === 0) {
            throw new Error(`${aidOrgId} does not exist`);
        }
        let aidOrg = JSON.parse(aidOrgAsBytes.toString());
        let cid = new ClientIdentity(ctx.stub);
        if (aidOrg.creatorId != cid.getID()) {
            throw new Error('only aidOrg creator can call this');
        }
        if (aidOrg.type !== 'aidOrg') {
            throw new Error('aidOrg not identified');
        }
        
        // verify pledgeId and retreive pledge        
        let pledgeAsBytes = await ctx.stub.getState(pledgeId); 
        if (!pledgeAsBytes || pledgeAsBytes.length === 0) {
            throw new Error(`${pledgeId} does not exist`);
        }
        let pledge = JSON.parse(pledgeAsBytes.toString());
        if (pledge.type !== 'pledge') {
            throw new Error('pledge not identified');
        }
        if (pledge.status !== JSON.stringify(PledgeState.Initial) ) {
            throw new Error('pledge not in initial state');
        }
        if (!(aidOrg.projectPledges.includes(pledgeId))) {
            throw new Error('pledge not found under aidOrgId');
        }

        // retrieve Global Citizen
        let globalCitizenAsBytes = await ctx.stub.getState('GlobalCitizen');
        if (!globalCitizenAsBytes || globalCitizenAsBytes.length === 0) {
            throw new Error(`GlobalCitizen does not exist`);
        }
        let globalCitizen = JSON.parse(globalCitizenAsBytes.toString());
        if (globalCitizen.type !== 'GlobalCitizen') {
            throw new Error('GlobalCitizen not identified');
        }

        // update pledge
        pledge.status = JSON.stringify(PledgeState.GlobalCitizenReview);
        await ctx.stub.putState(pledgeId, Buffer.from(JSON.stringify(pledge)));

        // add pledge to Global Citizen  
        globalCitizen.projectPledges.push(pledgeId);
        await ctx.stub.putState('GlobalCitizen', Buffer.from(JSON.stringify(globalCitizen)));

        return JSON.stringify(pledge);


    }


    async SendPledgeToGovOrg(ctx, pledgeId, govOrgId) {
        
        // verify GlobalCitizen and ensure GlobalCitizen is the caller
        let globalCitizenAsBytes = await ctx.stub.getState('GlobalCitizen');
        if (!globalCitizenAsBytes || globalCitizenAsBytes.length === 0) {
            throw new Error(`GlobalCitizen does not exist`);
        }
        let globalCitizen = JSON.parse(globalCitizenAsBytes.toString());
        let cid = new ClientIdentity(ctx.stub);
        if (globalCitizen.creatorId != cid.getID()) {
            throw new Error('only GlobalCitizen creator can call this');
        }
        if (globalCitizen.type !== 'GlobalCitizen') {
            throw new Error('GlobalCitizen not identified');
        }
        
        // verify pledgeId and retreive pledge
        let pledgeAsBytes = await ctx.stub.getState(pledgeId); 
        if (!pledgeAsBytes || pledgeAsBytes.length === 0) {
            throw new Error(`${pledgeId} does not exist`);
        }
        let pledge = JSON.parse(pledgeAsBytes.toString());
        if (pledge.type !== 'pledge') {
            throw new Error('pledge not identified');
        }
        if (pledge.status !== JSON.stringify(PledgeState.GlobalCitizenReview) ) {
            throw new Error('pledge previously not under global citizen review');
        }
        if (!(globalCitizen.projectPledges.includes(pledgeId))) {
            throw new Error('pledge not found under globalCitizen');
        }

        // verify govOrgId and retreive the government organization
        let govOrgAsBytes = await ctx.stub.getState(govOrgId); 
        if (!govOrgAsBytes || govOrgAsBytes.length === 0) {
            throw new Error(`${govOrgId} does not exist`);
        }
        let govOrg = JSON.parse(govOrgAsBytes.toString());
        if (govOrg.type !== 'govOrg') {
            throw new Error('govOrg not identified');
        }

        // update pledge        
        pledge.status = JSON.stringify(PledgeState.GovOrgReview);
        await ctx.stub.putState(pledgeId, Buffer.from(JSON.stringify(pledge)));

        // add order to the governemnt organization
        govOrg.projectPledges.push(pledgeId);
        await ctx.stub.putState(govOrgId, Buffer.from(JSON.stringify(govOrg)));

        return JSON.stringify(pledge);


    }


    async FundPledge(ctx, pledgeId, govOrgId, fundingType, approvedFunding, fundsPerInstallment) {

        // verify govOrgId and retreive the government organization, ensure govOrgId is the caller
        let govOrgAsBytes = await ctx.stub.getState(govOrgId); 
        if (!govOrgAsBytes || govOrgAsBytes.length === 0) {
            throw new Error(`${govOrgId} does not exist`);
        }
        let govOrg = JSON.parse(govOrgAsBytes.toString());
        let cid = new ClientIdentity(ctx.stub);
        if (govOrg.creatorId != cid.getID()) {
            throw new Error('only govOrg creator can call this');
        }
        if (govOrg.type !== 'govOrg') {
            throw new Error('govOrg not identified');
        }

        // verify pledgeId and retreive pledge
        let pledgeAsBytes = await ctx.stub.getState(pledgeId); 
        if (!pledgeAsBytes || pledgeAsBytes.length === 0) {
            throw new Error(`${pledgeId} does not exist`);
        }
        let pledge = JSON.parse(pledgeAsBytes.toString());
        if (pledge.type !== 'pledge') {
            throw new Error('pledge not identified');
        }
        if (pledge.status !== JSON.stringify(PledgeState.GovOrgReview) ) {
            throw new Error('pledge previously not under government review');
        }
        if (!(govOrg.projectPledges.includes(pledgeId))) {
            throw new Error('pledge not found under govOrg');
        }
        

        let daysToAdd = 0;
        switch(fundingType) {
        case 'WEEKLY':
            daysToAdd = 7;
            break;
        case 'MONTHLY':
            daysToAdd = 30;
            break;
        case 'SEMIANNUALY':
            daysToAdd = 180;
            break;
        case 'ANNUALY':
            daysToAdd = 365;
            break;
        default:
            throw new Error('fundingType not valid');
        }

        // project pledge object
        let funding = {
            fundingType: fundingType,
            nextFundingDueInDays: daysToAdd,
            approvedFunding: Number(approvedFunding),
            totalFundsReceived: 0,
            fundsPerInstallment: Number(fundsPerInstallment),
            govOrgId: govOrgId,
        };

        pledge.status = JSON.stringify(PledgeState.ProposalFunded);
        pledge.funds.push(funding);
        await ctx.stub.putState(pledgeId, Buffer.from(JSON.stringify(pledge)));

        // add order to the governemnt organization
        govOrg.fundedPledges.push(pledgeId);
        await ctx.stub.putState(govOrgId, Buffer.from(JSON.stringify(govOrg)));

        return JSON.stringify(pledge);

    }


    async TransferFunds(ctx, pledgeId, govOrgId) {

        // verify govOrgId and retreive the government organization, ensure govOrgId is the caller
        let govOrgAsBytes = await ctx.stub.getState(govOrgId); 
        if (!govOrgAsBytes || govOrgAsBytes.length === 0) {
            throw new Error(`${govOrgId} does not exist`);
        }
        let govOrg = JSON.parse(govOrgAsBytes.toString());
        let cid = new ClientIdentity(ctx.stub);
        if (govOrg.creatorId != cid.getID()) {
            throw new Error('only govOrg creator can call this');
        }
        if (govOrg.type !== 'govOrg') {
            throw new Error('govOrg not identified');
        }

        // verify pledgeId and retreive pledge
        let pledgeAsBytes = await ctx.stub.getState(pledgeId); 
        if (!pledgeAsBytes || pledgeAsBytes.length === 0) {
            throw new Error(`${pledgeId} does not exist`);
        }
        let pledge = JSON.parse(pledgeAsBytes.toString());
        if (pledge.type !== 'pledge') {
            throw new Error('pledge not identified');
        }
        if (pledge.status !== JSON.stringify(PledgeState.ProposalFunded) ) {
            throw new Error('pledge previously not under government review');
        }
        if (!(govOrg.fundedPledges.includes(pledgeId))) {
            throw new Error('pledge not found under govOrg');
        }

        
        let fundingFound = false;
        for(let i = 0; i < pledge.funds.length; i++) {
            if (pledge.funds[i].govOrgId == govOrgId ) {
                fundingFound = true;
                pledge.funds[i].totalFundsReceived += pledge.funds[i].fundsPerInstallment;
            }
        }

        if (fundingFound == false) {
            throw new Error('funding not found for gov.org');
        }

        await ctx.stub.putState(pledgeId, Buffer.from(JSON.stringify(pledge)));
        return JSON.stringify(pledge);

    }


    // get the state from key
    async GetState(ctx, key) {

        let data = await ctx.stub.getState(key);
        let jsonData = JSON.parse(data.toString());
        return JSON.stringify(jsonData);
    
    }

}

module.exports = GlobalCitizen;
