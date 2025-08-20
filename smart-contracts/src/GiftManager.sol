// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./BadgeNFT.sol";

contract GiftManager is ReentrancyGuard, Ownable {
    IERC20 public immutable mntToken;
    BadgeNFT public immutable badgeNFT;

    struct Charity {
        address charityAddress;
        string name;
        string metadataURI;
        bool active;
    }

    struct Favorite {
        address recipient;
        bytes32 name;
        uint256 giftCount;
        uint256 totalAmount;
    }

    struct Gift {
        address sender;
        address recipient;
        uint256 amount;
        bytes32 giftTypeHash;
        bytes32 messageHash;
        bool isCharity;
        bool redeemed;
        uint256 timestamp;
    }

    mapping(uint256 => Charity) public charities;
    uint256 public charityCounter;
    mapping(address => mapping(uint256 => Favorite)) public favorites;
    mapping(address => uint256) public favoriteCount;
    mapping(uint256 => Gift) public gifts;
    uint256 public giftCounter;
    mapping(address => uint256) public giftSentCount;
    mapping(address => uint256) public charityDonationCount;
    mapping(address => bool) public isActiveCharity;

    event GiftSent(
        uint256 indexed giftId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        bytes32 giftTypeHash,
        bytes32 messageHash,
        bool isCharity
    );
    event GiftRedeemed(uint256 indexed giftId, address indexed recipient);
    event BadgeEarned(address indexed user, uint256 milestone);
    event CharityBadgeEarned(address indexed user);
    event CharityAdded(uint256 indexed charityId, address charityAddress, string name, string metadataURI);
    event CharityRemoved(uint256 indexed charityId);
    event FavoriteAdded(address indexed user, address recipient, bytes32 name);
    event FavoriteRemoved(address indexed user, address recipient);

    constructor(address _mntToken, address _badgeNFT) Ownable(msg.sender) {
        mntToken = IERC20(_mntToken);
        badgeNFT = BadgeNFT(_badgeNFT);
    }

    function addCharity(address charityAddress, string memory name, string memory metadataURI) external onlyOwner {
        require(charityAddress != address(0), "Invalid charity address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        charityCounter++;
        charities[charityCounter] = Charity(charityAddress, name, metadataURI, true);
        isActiveCharity[charityAddress] = true;
        emit CharityAdded(charityCounter, charityAddress, name, metadataURI);
    }

    function removeCharity(uint256 charityId) external onlyOwner {
        require(charities[charityId].active, "Charity not found");
        charities[charityId].active = false;
        isActiveCharity[charities[charityId].charityAddress] = false;
        emit CharityRemoved(charityId);
    }

    function getCharity(uint256 charityId)
        external
        view
        returns (address charityAddress, string memory name, string memory metadataURI, bool active)
    {
        Charity memory charity = charities[charityId];
        return (charity.charityAddress, charity.name, charity.metadataURI, charity.active);
    }

    function getAllActiveCharities() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= charityCounter; i++) {
            if (charities[i].active) {
                activeCount++;
            }
        }

        uint256[] memory activeCharities = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= charityCounter; i++) {
            if (charities[i].active) {
                activeCharities[index] = i;
                index++;
            }
        }

        return activeCharities;
    }

    function addFavorite(address recipient, bytes32 name) external {
        require(recipient != address(0), "Invalid recipient address");
        favoriteCount[msg.sender]++;
        favorites[msg.sender][favoriteCount[msg.sender]] = Favorite(recipient, name, 0, 0);
        emit FavoriteAdded(msg.sender, recipient, name);
    }

    function removeFavorite(uint256 favoriteId) external {
        require(favoriteId <= favoriteCount[msg.sender], "Invalid favorite ID");
        emit FavoriteRemoved(msg.sender, favorites[msg.sender][favoriteId].recipient);
        delete favorites[msg.sender][favoriteId];
    }

    function getFavorites(address user)
        external
        view
        returns (
            address[] memory recipients,
            bytes32[] memory names,
            uint256[] memory giftCounts,
            uint256[] memory totalAmounts
        )
    {
        uint256 count = favoriteCount[user];
        recipients = new address[](count);
        names = new bytes32[](count);
        giftCounts = new uint256[](count);
        totalAmounts = new uint256[](count);
        for (uint256 i = 1; i <= count; i++) {
            if (favorites[user][i].recipient != address(0)) {
                recipients[i - 1] = favorites[user][i].recipient;
                names[i - 1] = favorites[user][i].name;
                giftCounts[i - 1] = favorites[user][i].giftCount;
                totalAmounts[i - 1] = favorites[user][i].totalAmount;
            }
        }
    }

    function sendGift(address recipient, uint256 amount, bytes32 giftTypeHash, bytes32 messageHash, bool isCharity)
        external
        nonReentrant
    {
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");

        if (isCharity) {
            require(isActiveCharity[recipient], "Not a valid charity");
        }

        require(mntToken.transferFrom(msg.sender, address(this), amount), "MNT transfer failed");

        address sender = msg.sender;

        giftCounter++;
        gifts[giftCounter] =
            Gift(sender, recipient, amount, giftTypeHash, messageHash, isCharity, false, block.timestamp);

        giftSentCount[sender]++;

        // Only update favorites if sender has any
        uint256 senderFavoriteCount = favoriteCount[sender];
        if (senderFavoriteCount > 0) {
            for (uint256 i = 1; i <= senderFavoriteCount; i++) {
                if (favorites[sender][i].recipient == recipient) {
                    favorites[sender][i].giftCount++;
                    favorites[sender][i].totalAmount += amount;
                    break;
                }
            }
        }

        if (isCharity) {
            charityDonationCount[sender]++;
            badgeNFT.mintCharityBadge(sender);
            emit CharityBadgeEarned(sender);
        }

        uint256 currentGiftCount = giftSentCount[sender];
        if (currentGiftCount == 1 || currentGiftCount == 5 || currentGiftCount == 10) {
            badgeNFT.mintBadge(sender, currentGiftCount);
            emit BadgeEarned(sender, currentGiftCount);
        }

        emit GiftSent(giftCounter, sender, recipient, amount, giftTypeHash, messageHash, isCharity);
    }

    function redeemGift(uint256 giftId) external nonReentrant {
        Gift storage gift = gifts[giftId];
        require(gift.recipient == msg.sender, "Only recipient can redeem");
        require(!gift.redeemed, "Gift already redeemed");
        require(gift.amount > 0, "Invalid gift");

        gift.redeemed = true;
        require(mntToken.transfer(msg.sender, gift.amount), "MNT transfer failed");

        emit GiftRedeemed(giftId, msg.sender);
    }

    function getTopGifters() external view returns (address[] memory addresses, uint256[] memory counts) {
        addresses = new address[](3);
        counts = new uint256[](3);

        // Collect unique senders efficiently
        address[] memory uniqueSenders = new address[](giftCounter);
        uint256 uniqueCount = 0;

        for (uint256 i = 1; i <= giftCounter; i++) {
            address sender = gifts[i].sender;
            bool isUnique = true;

            // Check if sender already exists in uniqueSenders
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (uniqueSenders[j] == sender) {
                    isUnique = false;
                    break;
                }
            }

            if (isUnique) {
                uniqueSenders[uniqueCount] = sender;
                uniqueCount++;
            }
        }

        // Find top 3 from unique senders
        for (uint256 i = 0; i < uniqueCount && i < 3; i++) {
            uint256 maxCount = 0;
            address maxSender;
            uint256 maxIndex;

            for (uint256 j = 0; j < uniqueCount; j++) {
                if (giftSentCount[uniqueSenders[j]] > maxCount) {
                    maxCount = giftSentCount[uniqueSenders[j]];
                    maxSender = uniqueSenders[j];
                    maxIndex = j;
                }
            }

            if (maxCount > 0) {
                addresses[i] = maxSender;
                counts[i] = maxCount;
                // Remove from consideration by setting count to 0
                uniqueSenders[maxIndex] = address(0);
            }
        }
    }

    function getCharities()
        external
        view
        returns (
            uint256[] memory ids,
            address[] memory addresses,
            string[] memory names,
            string[] memory metadataURIs
        )
    {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= charityCounter; i++) {
            if (charities[i].active) activeCount++;
        }
        ids = new uint256[](activeCount);
        addresses = new address[](activeCount);
        names = new string[](activeCount);
        metadataURIs = new string[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= charityCounter; i++) {
            if (charities[i].active) {
                ids[index] = i;
                addresses[index] = charities[i].charityAddress;
                names[index] = charities[i].name;
                metadataURIs[index] = charities[i].metadataURI;
                index++;
            }
        }
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
