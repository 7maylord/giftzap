// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/GiftManager.sol";
import "../src/BadgeNFT.sol";
import "../src/MockMNT.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockMNT token for testnet
        MockMNT mntToken = new MockMNT();

        console.log("MockMNT token deployed at:", address(mntToken));

        BadgeNFT badgeNFT = new BadgeNFT(
            "https://gold-perfect-rook-553.mypinata.cloud/ipfs/bafybeiehnfkmr25oxtfaxpqp3rgdj3ugqibwxnbqouovkfpstrby7x5lmu/QmBadge/",
            "https://gold-perfect-rook-553.mypinata.cloud/ipfs/bafybeiehnfkmr25oxtfaxpqp3rgdj3ugqibwxnbqouovkfpstrby7x5lmu/QmCharity/"
        );

        console.log("BadgeNFT deployed at:", address(badgeNFT));
        GiftManager giftManager = new GiftManager(address(mntToken), address(badgeNFT));

        console.log("GiftManager deployed at:", address(giftManager));

        badgeNFT.grantRole(keccak256("MINTER_ROLE"), address(giftManager));

        vm.stopBroadcast();
    }
}
