

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import "../src/GiftManager.sol";
import "../src/BadgeNFT.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockMNT is ERC20 {
    constructor() ERC20("Mantle Token", "MNT") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract GiftManagerTest is Test {
    GiftManager giftManager;
    BadgeNFT badgeNFT;
    MockMNT mntToken;
    address owner = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);
    address charity = address(0x3);

    function setUp() public {
        mntToken = new MockMNT();
        badgeNFT = new BadgeNFT("https://ipfs.io/ipfs/QmBadge/", "https://ipfs.io/ipfs/QmCharity/");
        giftManager = new GiftManager(address(mntToken), address(badgeNFT));
        badgeNFT.grantRole(keccak256("MINTER_ROLE"), address(giftManager));
        
        // Give users some MNT tokens
        mntToken.transfer(user1, 100 ether);
        mntToken.transfer(user2, 100 ether);
        
        // Set up approvals
        vm.prank(user1);
        mntToken.approve(address(giftManager), type(uint256).max);
        vm.prank(user2);
        mntToken.approve(address(giftManager), type(uint256).max);
    }

    function testSendGift() public {
        vm.prank(user1);
        giftManager.sendGift(user2, 1 ether, keccak256("coffee"), keccak256("Enjoy!"), false);
        (address sender, address recipient, uint256 amount,,,,,) = giftManager.gifts(1);
        assertEq(sender, user1);
        assertEq(recipient, user2);
        assertEq(amount, 1 ether);
    }

    function testRedeemGift() public {
        vm.prank(user1);
        giftManager.sendGift(user2, 1 ether, keccak256("coffee"), keccak256("Enjoy!"), false);
        vm.prank(user2);
        giftManager.redeemGift(1);
        (, , , , , , bool redeemed,) = giftManager.gifts(1);
        assertTrue(redeemed);
    }

    function testAddCharity() public {
        giftManager.addCharity(charity, keccak256("Mantle Aid"), keccak256("desc"));
        (address addr,,) = giftManager.charities(1);
        assertEq(addr, charity);
        assertTrue(giftManager.isActiveCharity(charity));
    }

    function testGetTopGifters() public {
        address user3 = address(0x4);
        mntToken.transfer(user3, 100 ether);
        vm.prank(user3);
        mntToken.approve(address(giftManager), type(uint256).max);

        // user1 sends 3 gifts
        vm.startPrank(user1);
        giftManager.sendGift(user2, 1 ether, keccak256("coffee"), keccak256("Enjoy!"), false);
        giftManager.sendGift(user3, 1 ether, keccak256("tea"), keccak256("Relax!"), false);
        giftManager.sendGift(user2, 1 ether, keccak256("lunch"), keccak256("Bon appetit!"), false);
        vm.stopPrank();

        // user2 sends 1 gift
        vm.prank(user2);
        giftManager.sendGift(user3, 1 ether, keccak256("snack"), keccak256("Enjoy!"), false);

        // user3 sends 2 gifts
        vm.startPrank(user3);
        giftManager.sendGift(user1, 1 ether, keccak256("dessert"), keccak256("Sweet!"), false);
        giftManager.sendGift(user2, 1 ether, keccak256("drink"), keccak256("Cheers!"), false);
        vm.stopPrank();

        (address[] memory addresses, uint256[] memory counts) = giftManager.getTopGifters();
        
        // Should be ordered: user1 (3), user3 (2), user2 (1)
        assertEq(addresses[0], user1);
        assertEq(counts[0], 3);
        assertEq(addresses[1], user3);
        assertEq(counts[1], 2);
        assertEq(addresses[2], user2);
        assertEq(counts[2], 1);
    }

    function testGetTopGiftersEmpty() public {
        (address[] memory addresses, uint256[] memory counts) = giftManager.getTopGifters();
        assertEq(addresses[0], address(0));
        assertEq(counts[0], 0);
    }

    function testCharityGifts() public {
        // Add charity first
        giftManager.addCharity(charity, keccak256("Mantle Aid"), keccak256("desc"));
        
        // Send gift to charity
        vm.prank(user1);
        giftManager.sendGift(charity, 1 ether, keccak256("donation"), keccak256("For a good cause"), true);
        
        (,,,,, bool isCharity,,) = giftManager.gifts(1);
        assertTrue(isCharity);
        assertEq(giftManager.charityDonationCount(user1), 1);
        
        // Check that charity badge was minted
        assertEq(badgeNFT.ownerOf(1), user1);
        assertTrue(badgeNFT.isCharityBadge(1));
    }

    function test_RevertWhen_SendGiftToInvalidCharity() public {
        vm.prank(user1);
        vm.expectRevert("Not a valid charity");
        giftManager.sendGift(charity, 1 ether, keccak256("donation"), keccak256("For a good cause"), true);
    }

    function testRemoveCharity() public {
        giftManager.addCharity(charity, keccak256("Mantle Aid"), keccak256("desc"));
        assertTrue(giftManager.isActiveCharity(charity));
        
        giftManager.removeCharity(1);
        assertFalse(giftManager.isActiveCharity(charity));
    }

    function testFavorites() public {
        // Add favorite
        vm.prank(user1);
        giftManager.addFavorite(user2, keccak256("Alice"));
        
        assertEq(giftManager.favoriteCount(user1), 1);
        (address recipient, bytes32 name,,) = giftManager.favorites(user1, 1);
        assertEq(recipient, user2);
        assertEq(name, keccak256("Alice"));
        
        // Send gift to favorite
        vm.prank(user1);
        giftManager.sendGift(user2, 2 ether, keccak256("coffee"), keccak256("Enjoy!"), false);
        
        // Check favorite stats updated
        (,, uint256 giftCount, uint256 totalAmount) = giftManager.favorites(user1, 1);
        assertEq(giftCount, 1);
        assertEq(totalAmount, 2 ether);
        
        // Remove favorite
        vm.prank(user1);
        giftManager.removeFavorite(1);
        (address removedRecipient,,,) = giftManager.favorites(user1, 1);
        assertEq(removedRecipient, address(0));
    }

    function testGetFavorites() public {
        vm.startPrank(user1);
        giftManager.addFavorite(user2, keccak256("Alice"));
        giftManager.addFavorite(charity, keccak256("Charity"));
        vm.stopPrank();
        
        (address[] memory recipients, bytes32[] memory names, uint256[] memory giftCounts, uint256[] memory totalAmounts) = giftManager.getFavorites(user1);
        
        assertEq(recipients.length, 2);
        assertEq(recipients[0], user2);
        assertEq(names[0], keccak256("Alice"));
        assertEq(recipients[1], charity);
        assertEq(names[1], keccak256("Charity"));
    }

    function testMilestoneBadges() public {
        vm.startPrank(user1);
        
        // Send 1st gift - should get badge
        giftManager.sendGift(user2, 1 ether, keccak256("coffee"), keccak256("Enjoy!"), false);
        assertEq(badgeNFT.ownerOf(1), user1);
        assertEq(badgeNFT.tokenMilestone(1), 1);
        
        // Send 4 more gifts to reach 5 total
        for(uint i = 0; i < 4; i++) {
            giftManager.sendGift(user2, 1 ether, keccak256("gift"), keccak256("msg"), false);
        }
        
        // Should get 5-gift milestone badge
        assertEq(badgeNFT.ownerOf(2), user1);
        assertEq(badgeNFT.tokenMilestone(2), 5);
        
        vm.stopPrank();
    }

    function test_RevertWhen_RedeemAlreadyRedeemedGift() public {
        vm.prank(user1);
        giftManager.sendGift(user2, 1 ether, keccak256("coffee"), keccak256("Enjoy!"), false);
        
        vm.prank(user2);
        giftManager.redeemGift(1);
        
        vm.prank(user2);
        vm.expectRevert("Gift already redeemed");
        giftManager.redeemGift(1);
    }

    function test_RevertWhen_RedeemGiftNotRecipient() public {
        vm.prank(user1);
        giftManager.sendGift(user2, 1 ether, keccak256("coffee"), keccak256("Enjoy!"), false);
        
        vm.prank(user1);
        vm.expectRevert("Only recipient can redeem");
        giftManager.redeemGift(1);
    }

    function test_RevertWhen_InvalidRecipientAddress() public {
        vm.prank(user1);
        vm.expectRevert("Invalid recipient address");
        giftManager.sendGift(address(0), 1 ether, keccak256("coffee"), keccak256("Enjoy!"), false);
    }

    function test_RevertWhen_ZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Amount must be greater than 0");
        giftManager.sendGift(user2, 0, keccak256("coffee"), keccak256("Enjoy!"), false);
    }

    function testGetCharities() public {
        // Add multiple charities
        giftManager.addCharity(charity, keccak256("Mantle Aid"), keccak256("desc1"));
        giftManager.addCharity(user2, keccak256("Crypto Charity"), keccak256("desc2"));
        giftManager.addCharity(user1, keccak256("Tech Fund"), keccak256("desc3"));
        
        // Remove one charity
        giftManager.removeCharity(2);
        
        (uint256[] memory ids, address[] memory addresses, bytes32[] memory names, bytes32[] memory descriptions) = giftManager.getCharities();
        
        // Should return 2 active charities (1 and 3, since 2 was removed)
        assertEq(ids.length, 2);
        assertEq(addresses[0], charity);
        assertEq(names[0], keccak256("Mantle Aid"));
        assertEq(addresses[1], user1);
        assertEq(names[1], keccak256("Tech Fund"));
    }

    function testRecoverTokens() public {
        // Send some tokens to the contract
        mntToken.transfer(address(giftManager), 10 ether);
        
        uint256 ownerBalanceBefore = mntToken.balanceOf(owner);
        
        // Recover tokens as owner
        giftManager.recoverTokens(address(mntToken), 5 ether);
        
        assertEq(mntToken.balanceOf(owner), ownerBalanceBefore + 5 ether);
        assertEq(mntToken.balanceOf(address(giftManager)), 5 ether);
    }

    function test_RevertWhen_AddFavoriteInvalidAddress() public {
        vm.prank(user1);
        vm.expectRevert("Invalid recipient address");
        giftManager.addFavorite(address(0), keccak256("Invalid"));
    }

    function test_RevertWhen_RemoveFavoriteInvalidId() public {
        vm.prank(user1);
        vm.expectRevert("Invalid favorite ID");
        giftManager.removeFavorite(999);
    }

    function test_RevertWhen_RemoveCharityNotFound() public {
        vm.expectRevert("Charity not found");
        giftManager.removeCharity(999);
    }

    function test_RevertWhen_AddCharityInvalidAddress() public {
        vm.expectRevert("Invalid charity address");
        giftManager.addCharity(address(0), keccak256("Invalid"), keccak256("desc"));
    }

    function testTenGiftMilestone() public {
        vm.startPrank(user1);
        
        // Send 10 gifts to trigger 10-gift milestone
        for(uint i = 0; i < 10; i++) {
            giftManager.sendGift(user2, 1 ether, keccak256("gift"), keccak256("msg"), false);
        }
        
        // Should have 3 badges: 1st gift, 5th gift, 10th gift
        assertEq(badgeNFT.ownerOf(1), user1); // 1st gift badge
        assertEq(badgeNFT.tokenMilestone(1), 1);
        
        assertEq(badgeNFT.ownerOf(2), user1); // 5th gift badge  
        assertEq(badgeNFT.tokenMilestone(2), 5);
        
        assertEq(badgeNFT.ownerOf(3), user1); // 10th gift badge
        assertEq(badgeNFT.tokenMilestone(3), 10);
        
        vm.stopPrank();
    }
}
