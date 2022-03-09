export const tokenAbi = [
  {
    inputs: [],
    name: "router",
    outputs: [
      {
        internalType: "contract IDEXRouter",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function",
    constant: true
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function",
    constant: true
  },
]
export const routerAbi = [
  {
    inputs:[
      {
        internalType:"uint256",
        name:"amountIn",
        type:"uint256"
      },
      {
        internalType:"address[]",
        name:"path",
        type:"address[]"
      }
    ],
    name:"getAmountsOut",
    outputs:[
    {
      internalType:"uint256[]",
      name:"amounts",
      type:"uint256[]"
    }
    ], 
    stateMutability:"view",
    type:"function"
  },
  {
    inputs:[], 
    name:"WETH",
    outputs:[
      {
        internalType:"address",
        name:"",
        type:"address"
      }
    ],
    stateMutability:"view",
    type:"function"
  }
]
