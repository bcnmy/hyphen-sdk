export default [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'asset',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'transferredAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'target',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'depositHash',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fromChainId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'lpFee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'transferFee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'gasFee',
        type: 'uint256',
      },
    ],
    name: 'AssetSent',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'asset',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'transferredAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'target',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fromChainId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'lpFee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'transferFee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'gasFee',
        type: 'uint256',
      },
    ],
    name: 'AssetSentFromCCMP',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'toChainId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'reward',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'tag',
        type: 'string',
      },
    ],
    name: 'Deposit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'reward',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'tag',
        type: 'string',
      },
    ],
    name: 'DepositAndCall',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'toChainId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'reward',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'tag',
        type: 'string',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'tokenAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'percentage',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'enum SwapOperation',
            name: 'operation',
            type: 'uint8',
          },
          {
            internalType: 'bytes',
            name: 'path',
            type: 'bytes',
          },
        ],
        indexed: false,
        internalType: 'struct SwapRequest[]',
        name: 'swapRequests',
        type: 'tuple[]',
      },
    ],
    name: 'DepositAndSwap',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousPauser',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newPauser',
        type: 'address',
      },
    ],
    name: 'PauserChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_tf',
        type: 'address',
      },
    ],
    name: 'TrustedForwarderChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Unpaused',
    type: 'event',
  },
  {
    inputs: [],
    name: 'baseGas',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ccmpExecutor',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ccmpGateway',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'chainIdToLiquidityPoolAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newPauser',
        type: 'address',
      },
    ],
    name: 'changePauser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address payable',
        name: 'receiver',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'depositHash',
        type: 'bytes',
      },
    ],
    name: 'checkHashStatus',
    outputs: [
      {
        internalType: 'bytes32',
        name: 'hashSendTransaction',
        type: 'bytes32',
      },
      {
        internalType: 'bool',
        name: 'status',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'toChainId',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'tokenAddress',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'receiver',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'tag',
            type: 'string',
          },
          {
            components: [
              {
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                internalType: 'bytes',
                name: '_calldata',
                type: 'bytes',
              },
            ],
            internalType: 'struct ICCMPGateway.CCMPMessagePayload[]',
            name: 'payloads',
            type: 'tuple[]',
          },
          {
            components: [
              {
                internalType: 'address',
                name: 'feeTokenAddress',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'feeAmount',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: 'relayer',
                type: 'address',
              },
            ],
            internalType: 'struct ICCMPGateway.GasFeePaymentArgs',
            name: 'gasFeePaymentArgs',
            type: 'tuple',
          },
          {
            internalType: 'string',
            name: 'adaptorName',
            type: 'string',
          },
          {
            internalType: 'bytes',
            name: 'routerArgs',
            type: 'bytes',
          },
          {
            internalType: 'bytes[]',
            name: 'hyphenArgs',
            type: 'bytes[]',
          },
        ],
        internalType: 'struct DepositAndCallArgs',
        name: 'args',
        type: 'tuple',
      },
    ],
    name: 'depositAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'toChainId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'tag',
        type: 'string',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'tokenAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'percentage',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'enum SwapOperation',
            name: 'operation',
            type: 'uint8',
          },
          {
            internalType: 'bytes',
            name: 'path',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapRequest[]',
        name: 'swapRequest',
        type: 'tuple[]',
      },
    ],
    name: 'depositAndSwapErc20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'toChainId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'tag',
        type: 'string',
      },
    ],
    name: 'depositErc20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'toChainId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'tag',
        type: 'string',
      },
    ],
    name: 'depositNative',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'toChainId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'tag',
        type: 'string',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'tokenAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'percentage',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'enum SwapOperation',
            name: 'operation',
            type: 'uint8',
          },
          {
            internalType: 'bytes',
            name: 'path',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapRequest[]',
        name: 'swapRequest',
        type: 'tuple[]',
      },
    ],
    name: 'depositNativeAndSwap',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'gasFeeAccumulated',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'gasFeeAccumulatedByToken',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
    ],
    name: 'getCurrentLiquidity',
    outputs: [
      {
        internalType: 'uint256',
        name: 'currentLiquidity',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
    ],
    name: 'getRewardAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: 'rewardAmount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'getTransferFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'incentivePool',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_executorManagerAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_pauser',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_trustedForwarder',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_tokenManager',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_liquidityProviders',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'pauser',
        type: 'address',
      },
    ],
    name: 'isPauser',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'forwarder',
        type: 'address',
      },
    ],
    name: 'isTrustedForwarder',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'liquidityProviders',
    outputs: [
      {
        internalType: 'contract ILiquidityProviders',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'processedHash',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renouncePauser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'tokenSymbol',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'sourceChainAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'sourceChainDecimals',
            type: 'uint256',
          },
          {
            internalType: 'address payable',
            name: 'receiver',
            type: 'address',
          },
          {
            internalType: 'bytes[]',
            name: 'hyphenArgs',
            type: 'bytes[]',
          },
        ],
        internalType: 'struct SendFundsToUserFromCCMPArgs',
        name: 'args',
        type: 'tuple',
      },
    ],
    name: 'sendFundsToUserFromCCMP',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address payable',
        name: 'receiver',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'depositHash',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'nativeTokenPriceInTransferredToken',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'fromChainId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'tokenGasBaseFee',
        type: 'uint256',
      },
    ],
    name: 'sendFundsToUserV2',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_newCCMPExecutor',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_newCCMPGateway',
        type: 'address',
      },
    ],
    name: 'setCCMPContracts',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_executorManagerAddress',
        type: 'address',
      },
    ],
    name: 'setExecutorManager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256[]',
        name: 'chainId',
        type: 'uint256[]',
      },
      {
        internalType: 'address[]',
        name: 'liquidityPoolAddress',
        type: 'address[]',
      },
    ],
    name: 'setLiquidityPoolAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'address',
        name: '_swapAdaptor',
        type: 'address',
      },
    ],
    name: 'setSwapAdaptor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    name: 'swapAdaptorMap',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address payable',
        name: 'receiver',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'depositHash',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'nativeTokenPriceInTransferredToken',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'tokenGasBaseFee',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'fromChainId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'swapGasOverhead',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'tokenAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'percentage',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'enum SwapOperation',
            name: 'operation',
            type: 'uint8',
          },
          {
            internalType: 'bytes',
            name: 'path',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapRequest[]',
        name: 'swapRequests',
        type: 'tuple[]',
      },
      {
        internalType: 'string',
        name: 'swapAdaptor',
        type: 'string',
      },
    ],
    name: 'swapAndSendFundsToUser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'tokenManager',
    outputs: [
      {
        internalType: 'contract ITokenManager',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_tokenAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_tokenAmount',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
    ],
    name: 'withdrawErc20GasFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawNativeGasFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
];
