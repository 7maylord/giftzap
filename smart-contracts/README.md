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

- **MockMNT Token**: `0x23B3C1D91d1cA80fA157A65fF3B9e7BfD3E79C35`
- **BadgeNFT**: `0x5A9354cDF593ca32E057207Ceb4AEa161208814B` (Verified)
- **GiftManager**: `0xcA3f02A32C333e4fc00E3Bd91C648e7deAb5d9eB` (Verified)

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
