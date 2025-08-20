// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/GiftManager.sol";
import "../src/BadgeNFT.sol";
import "../src/MockMNT.sol";

contract DeployWithCharities is Script {
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

        // Add charities with actual IPFS metadata hashes
        giftManager.addCharity(
            0xbE3171d0e36a012319a5C76bCcD71250499b1C16, 
            "Mantle Aid", 
            "QmRypt7UoEBbpnzWX7vxrTmY9HF6JZaWujPXSHDkRtiLf5"
        );
        
        giftManager.addCharity(
            0x801ce3C86a4075F094C973D8Dd5e2bD5cde6a873, 
            "Crypto Charity", 
            "QmQKwVEh9KcFT8MquCSNrW4et71DrVDQpKwFEfV9GzUCjh"
        );

        console.log("Deployment complete!");
        console.log("Added 2 charities with IPFS metadata:");
        console.log("- Mantle Aid: QmRypt7UoEBbpnzWX7vxrTmY9HF6JZaWujPXSHDkRtiLf5");
        console.log("- Crypto Charity: QmQKwVEh9KcFT8MquCSNrW4et71DrVDQpKwFEfV9GzUCjh");

        vm.stopBroadcast();
    }
}
