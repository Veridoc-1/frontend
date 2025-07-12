// Contract ABI and address for DocumentRegistry
export const DOCUMENT_REGISTRY_ABI =[
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "docId",
				"type": "bytes32"
			}
		],
		"name": "Document_Already_Exists",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "Not_Authorized",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "docId",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "publisher",
				"type": "address"
			}
		],
		"name": "DocumentPublished",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "docId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "revoker",
				"type": "address"
			}
		],
		"name": "DocumentRevoked",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "docType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "jurisdiction",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			}
		],
		"name": "publishDocument",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "docId",
				"type": "bytes32"
			}
		],
		"name": "revokeDocument",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "documents",
		"outputs": [
			{
				"internalType": "address",
				"name": "publisher",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "docType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "jurisdiction",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isRevoked",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "docId",
				"type": "bytes32"
			}
		],
		"name": "getDocument",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "publisher",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "docType",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "jurisdiction",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "ipfsHash",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isRevoked",
						"type": "bool"
					}
				],
				"internalType": "struct DocumentRegistry.Document",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "publisher",
				"type": "address"
			}
		],
		"name": "verifyDocument",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

export const DOCUMENT_REGISTRY_ADDRESS = "0xf9225ef9648d273db99a71A2F11255329C31832a";
