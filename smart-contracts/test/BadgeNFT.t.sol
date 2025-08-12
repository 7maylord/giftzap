// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";

import "../src/BadgeNFT.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BadgeNFTTest is Test {
    BadgeNFT badgeNFT;
    address owner = address(this);
    address minter = address(0x1);
    address user = address(0x2);

    string baseURI = "https://your-pinata-gateway.mypinata.cloud/ipfs/QmBadge/";
    string charityBadgeURI = "https://your-pinata-gateway.mypinata.cloud/ipfs/QmCharity/";

    function setUp() public {
        badgeNFT = new BadgeNFT(baseURI, charityBadgeURI);
        badgeNFT.grantRole(keccak256("MINTER_ROLE"), minter);
    }

    function testMintBadge() public {
        vm.prank(minter);
        badgeNFT.mintBadge(user, 1);
        assertEq(badgeNFT.ownerOf(1), user);
        assertEq(badgeNFT.tokenMilestone(1), 1);
        assertFalse(badgeNFT.isCharityBadge(1));
        assertEq(badgeNFT.tokenURI(1), string(abi.encodePacked(baseURI, "1.json")));
    }

    function testMintCharityBadge() public {
        vm.prank(minter);
        badgeNFT.mintCharityBadge(user);
        assertEq(badgeNFT.ownerOf(1), user);
        assertTrue(badgeNFT.isCharityBadge(1));
        assertEq(badgeNFT.tokenURI(1), string(abi.encodePacked(charityBadgeURI, "1.json")));
    }

    function test_RevertWhen_MintBadgeNonMinter() public {
        vm.prank(user);
        vm.expectRevert();
        badgeNFT.mintBadge(user, 1); // Should fail: user lacks MINTER_ROLE
    }

    function test_RevertWhen_MintCharityBadgeNonMinter() public {
        vm.prank(user);
        vm.expectRevert();
        badgeNFT.mintCharityBadge(user); // Should fail: user lacks MINTER_ROLE
    }

    function testSetBaseURI() public {
        string memory newBaseURI = "https://new-pinata-gateway.mypinata.cloud/ipfs/QmNewBadge/";
        badgeNFT.setBaseURI(newBaseURI);
        vm.prank(minter);
        badgeNFT.mintBadge(user, 1);
        assertEq(badgeNFT.tokenURI(1), string(abi.encodePacked(newBaseURI, "1.json")));
    }

    function testSetCharityBadgeURI() public {
        string memory newCharityBadgeURI = "https://new-pinata-gateway.mypinata.cloud/ipfs/QmNewCharity/";
        badgeNFT.setCharityBadgeURI(newCharityBadgeURI);
        vm.prank(minter);
        badgeNFT.mintCharityBadge(user);
        assertEq(badgeNFT.tokenURI(1), string(abi.encodePacked(newCharityBadgeURI, "1.json")));
    }

    function test_RevertWhen_SetBaseURINonAdmin() public {
        vm.prank(user);
        vm.expectRevert();
        badgeNFT.setBaseURI("https://invalid.com/"); // Should fail: user lacks DEFAULT_ADMIN_ROLE
    }

    function test_RevertWhen_InvalidTokenURI() public {
        vm.expectRevert("Token does not exist");
        badgeNFT.tokenURI(999); // Non-existent token
    }

    function testSupportsInterface() public view {
        assertTrue(badgeNFT.supportsInterface(type(IERC721).interfaceId));
        assertTrue(badgeNFT.supportsInterface(type(IAccessControl).interfaceId));
    }

    function testTokenCounterIncrement() public {
        vm.prank(minter);
        badgeNFT.mintBadge(user, 1);
        assertEq(badgeNFT.tokenCounter(), 1);
        vm.prank(minter);
        badgeNFT.mintCharityBadge(user);
        assertEq(badgeNFT.tokenCounter(), 2);
    }
}