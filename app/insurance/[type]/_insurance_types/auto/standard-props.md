| Field | Required | Type | Description |
|---|---|---|---|
| **GENERAL** | | | |
| `partnerReferenceNumber` | Yes | String[20] | Partner's unique identifier for the transaction |
| `assuredName1` | Yes | String[105] | Name of the insured |
| `assuredName2` | No | String[60] | Name of the insured (secondary) |
| `inceptionDate` | Yes | Date | Start date of the policy in yyyy-MM-dd format |
| `returnUrl` | Yes | String | URL to be redirected to after successful transaction if payment link was used |
| `cancelledReturnUrl` | Yes | String | URL to be redirected to if user cancelled the payment link |
| `failedReturnUrl` | Yes | String | URL to be redirected to if the payment link transaction failed |
| **CLIENT** | | | |
| `client` | Yes | Object | Client details |
| `client.clientType` | Yes | String[1] | See Client Types |
| `client.firstName` | Yes/No | String[35] | The given name of the client. Required if clientType is I |
| `client.middleName` | Yes/No | String[35] | The middle name of the client. Required if clientType is I |
| `client.lastName` | Yes/No | String[35] | The surname of the client. Required if clientType is I |
| `client.fullname` | Yes/No | String[105] | The full name of the client. Required if clientType is C |
| `client.contactType` | Yes | String[6] | See Contact Types |
| `client.contactNumber` | Yes | String[50] | The contact number of the client. If mobile number, should start with "09" |
| `client.addressType` | Yes | String[5] | See Address Types |
| `client.address1` | Yes | String[100] | Address line 1 |
| `client.address2` | Yes | String[100] | Address line 2 |
| `client.province` | Yes | String[50] | See Provinces |
| `client.postalCode` | Yes | String[4] | See Postal Codes |
| `client.birthday` | Yes/No | Date | Birth date of the client in yyyy-MM-dd format. Required if clientType is I |
| `client.emailAddress` | Yes | String[50] | Email address of the client |
| `client.gender` | Yes/No | String[5] | See Genders. Required if clientType is I |
| `client.maritalStatus` | Yes/No | String[1] | See List of Marital Status. Required if clientType is I |
| `client.tin` | Yes/No | String[15] | TIN Number. Required if clientType is C |
| `client.idType` | Yes/No | String[2] | ID Type. Required if clientType is I. See ID Types |
| `client.idNumber` | Yes/No | String[15] | ID Number. Required if clientType is I |
| **RISKS** | | | |
| `risks` | Yes | Object[] | Risk details |
| `risks[].riskCode` | Yes | String | See Risk Codes |
| `risks[].riskType` | Yes | String | See Risk Types |
| `risks[].packageCode` | Yes | String | The package code used to compute the premium. Provided by SICI |
| `risks[].assignee1` | Yes | String[105] | Name of the person assigned to the vehicle or full name of the client |
| `risks[].assignee2` | No | String[60] | Name of the person assigned to the vehicle or full name of the client (secondary) |
| `risks[].plateNumber` | Yes | String[15] | Plate Number or Conduction Sticker of the Vehicle |
| `risks[].modelId` | Yes | String | fmvCode/modelId from the FMV API |
| `risks[].engineNumber` | Yes | String[30] | The Engine Number of the vehicle |
| `risks[].chassisNumber` | Yes | String[30] | The Chassis Number of the vehicle |
| `risks[].mvFileNumber` | Yes | String[30] | The MV File Number of the vehicle |
| `risks[].ctplCoverage` | Yes/No | BigDecimal | CTPL Sum Insured |
| `risks[].ctplPremium` | Yes/No | BigDecimal | CTPL Premium amount |
| `risks[].coverType` | Yes | String[5] | The coverages of the policy. See Cover Types |
| **MORTGAGEE** | | | |
| `mortgagee` | No | Object | Mortgagee details |
| `mortgagee.code` | No | String[100] | The mortgagee code. Please see Bank List API |
| `mortgagee.address1` | Yes/No | String[35] | Address of the bank. Required if code is not null |
| `mortgagee.address2` | No | String[35] | Address line 2 |
| `mortgagee.address3` | No | String[35] | Address line 3 |
| **PREMIUM DETAILS** | | | |
| `premiumDetails` | Yes | Object | Premium Details |
| `premiumDetails.basicPremium` | Yes | BigDecimal | The calculated basic premium |
| `premiumDetails.evat` | Yes | BigDecimal | The calculated EVAT |
| `premiumDetails.dst` | Yes | BigDecimal | The calculated DST |
| `premiumDetails.lgt` | Yes | BigDecimal | The calculated LGT |
| `premiumDetails.vf` | Yes/No | BigDecimal | The verification fee (required if with CTPL) |
| `premiumDetails.otherCode1` | No | BigDecimal | Other Charges 1. See Other Charges |
| `premiumDetails.otherCode1Amount` | No | BigDecimal | Other Charges 1 amount |
| `premiumDetails.otherCode2` | No | BigDecimal | Other Charges 2. See Other Charges |
| `premiumDetails.otherCode2Amount` | No | BigDecimal | Other Charges 2 amount |
| `premiumDetails.otherCode3` | No | BigDecimal | Other Charges 3. See Other Charges |
| `premiumDetails.otherCode3Amount` | No | BigDecimal | Other Charges 3 amount |
| **ACCESSORIES** | | | |
| `accessories` | No | Object[] | Accessories |
| `accessories[].accessory` | No | String[50] | Name of the accessory |
| `accessories[].amount` | No | BigDecimal | The declared amount of the accessory |
