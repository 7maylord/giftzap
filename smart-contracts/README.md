## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Deploy.s.sol --rpc-url mantle_sepolia --broadcast --verify
```

## Deployed Contracts (Mantle Sepolia Testnet)

- **MockMNT Token**: `0xE2056b401Fa9FE83ec3e0384aff076Be8eA5e283`
- **BadgeNFT**: `0xfdBe17eA174CD945CBD6bfC13A9E4Eb14392dfDd`
- **GiftManager**: `0x5239E69677F1C112F42FDFCd7989d9982101224F`


Network: Mantle Sepolia (Chain ID: 5003)
Explorer: https://explorer.sepolia.mantle.xyz/

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
