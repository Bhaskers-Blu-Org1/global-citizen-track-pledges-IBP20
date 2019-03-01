# global-citizen-track-pledges


### Run the particpants app

* Install Dependencies

```bash
cd participant-apps/
npm install
```

* Enroll Admin

```bash
node enrollAdmin.js
```

* Register and add <b>Global Citizen</b> on the network

```bash
node registerGlobalCitizen.js 
```

```bash
node addGlobalCitizen.js
```

* Register and add <b>aid organization</b> on the network

```bash
cd ../aid-org/
node registerAidOrg.js
```

```bash
node addAidOrg.js
```

* Register and add <b>government organization</b> on the network

```bash
cd ../gov-org/
node registerGovOrg.js
```

```bash
node addGovOrg.js
```

* Create pledge as the <b>aid organization</b>

```bash
cd ../aid-org/
node createProjectPledge.js
```

* Send pledge to <b>global citizen</b> for review, form the <b>aid organization</b>

```bash
node sendPledgeToGlobalCitizen.js 
```

* After <b>global citizen</b> reviews the pledge, they can send the pledge to the <b>government organization</b> for review

```bash
cd ../global-citizen/
node sendPledgeToGovOrg.js
```

* The <b>government organization</b> after reviewing the pledge, can decide to fund it.

```bash
cd ../gov-org/
node fundPledge.js
```

* The <b>government organization</b> fundings can be tracked as they transfer funds for the pledge

```bash
node fundPledge.js
```


### Run the entire application as one user

You can run the application as one user identiy adding all participants and running transaction.

* Install Dependencies

```bash
cd participant-apps/
npm install
```

* Run the app

```bash
node application.js
```


