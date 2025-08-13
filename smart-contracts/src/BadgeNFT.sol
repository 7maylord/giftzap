// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title BadgeNFT - ERC-721 contract for gamified badges on Mantle Network
/// @notice Mints badges for gifting milestones and charity donations
contract BadgeNFT is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public tokenCounter; // Tracks total NFTs minted
    string public baseURI; // Base URI for NFT metadata
    string public charityBadgeURI; // URI for charity badge metadata

    mapping(uint256 => uint256) public tokenMilestone; // Maps tokenId to milestone (e.g., 5 for "5 gifts sent")
    mapping(uint256 => bool) public isCharityBadge; // Tracks charity badges

    event BaseURIUpdated(string newBaseURI);
    event CharityBadgeURIUpdated(string newCharityBadgeURI);

    /// @notice Constructor to initialize NFT contract
    /// @param _baseURI Base URI for standard badge metadata
    /// @param _charityBadgeURI URI for charity badge metadata
    constructor(string memory _baseURI, string memory _charityBadgeURI) ERC721("GiftBadge", "GBADGE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        baseURI = _baseURI;
        charityBadgeURI = _charityBadgeURI;
        tokenCounter = 0;
    }

    /// @notice Mint a badge for a gifting milestone
    /// @param user Address of the badge recipient
    /// @param milestone Milestone achieved (e.g., 5 for 5 gifts sent)
    function mintBadge(address user, uint256 milestone) external onlyRole(MINTER_ROLE) {
        require(user != address(0), "Invalid user address");
        tokenCounter++;
        _mint(user, tokenCounter);
        tokenMilestone[tokenCounter] = milestone;
        isCharityBadge[tokenCounter] = false;
    }

    /// @notice Mint a charity badge for donations
    /// @param user Address of the badge recipient
    function mintCharityBadge(address user) external onlyRole(MINTER_ROLE) {
        require(user != address(0), "Invalid user address");
        tokenCounter++;
        _mint(user, tokenCounter);
        isCharityBadge[tokenCounter] = true;
    }

    /// @notice Update base URI for standard badges
    /// @param _baseURI New base URI
    function setBaseURI(string memory _baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = _baseURI;
        emit BaseURIUpdated(_baseURI);
    }

    /// @notice Update charity badge URI
    /// @param _charityBadgeURI New charity badge URI
    function setCharityBadgeURI(string memory _charityBadgeURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        charityBadgeURI = _charityBadgeURI;
        emit CharityBadgeURIUpdated(_charityBadgeURI);
    }

    /// @notice Get token URI for an NFT
    /// @param tokenId ID of the NFT
    /// @return Token URI string
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        if (isCharityBadge[tokenId]) {
            return string(abi.encodePacked(charityBadgeURI, Strings.toString(tokenId), ".json"));
        }
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId), ".json"));
    }

    /// @notice Check if contract supports an interface
    /// @param interfaceId Interface ID to check
    /// @return True if interface is supported
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
