# Simple MultiSig Wallet

This is a Simple Ethereum multisig contract using solidity 0.8 and hardat. 

The main idea behind the contract is to pass in a threshold of detached signatures into the execute function and the contract will check the signatures and send off the transaction.

> Note: signatures, owners should always be passed in increasing order so that contract can detect duplicate entries

### EIP-712 and EIP-191
This contract follows [EIP-712](https://eips.ethereum.org/EIPS/eip-712) and [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standards

### Pre Requisites

Before running any command, make sure to install dependencies:

```sh
$ npm i
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ npm run compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ npm run typechain
```

### Lint Solidity

Lint the Solidity code:

```sh
$ npm run lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ npm run lint:ts
```

### Test

Run the Chai tests:

```sh
$ npm run test
```

### Coverage

Generate the code coverage report:

```sh
$ npm run coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true npm run test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ npm run clean
```

## Syntax Highlighting

If you use VSCode, you can enjoy syntax highlighting for your Solidity code via the
[vscode-solidity](https://github.com/juanfranblanco/vscode-solidity) extension. The recommended approach to set the
compiler version is to add the following fields to your VSCode user settings:

```json
{
  "solidity.compileUsingRemoteVersion": "v0.8.3+commit.8d00100c",
  "solidity.defaultCompiler": "remote"
}
```

Where of course `v0.8.3+commit.8d00100c` can be replaced with any other version.
