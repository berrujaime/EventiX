// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEventiXTickets {
    function ownerOf(uint256 tokenId) external view returns (address);
    function ticketToEvent(uint256 tokenId) external view returns (uint256);
    function events(uint256 eventId) external view returns (string memory, uint256, string memory, uint256, uint256, bool, uint256, uint256);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract TicketMarketplace {
    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(uint256 => Listing) public listings;
    IEventiXTickets public nftContract;

    constructor(address nftAddress) {
        nftContract = IEventiXTickets(nftAddress);
    }

    function listTicket(uint256 tokenId, uint256 price) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        uint256 eventId = nftContract.ticketToEvent(tokenId);
        (,,,,, bool resaleAllowed, uint256 resalePriceCap,) = nftContract.events(eventId);
        require(resaleAllowed, "Resale not allowed");
        require(price <= resalePriceCap, "Exceeds resale cap");
        listings[tokenId] = Listing(msg.sender, price);
    }

    function delistTicket(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        delete listings[tokenId];
    }

    function buyTicket(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        nftContract.transferFrom(listing.seller, msg.sender, tokenId);
        payable(listing.seller).transfer(listing.price);
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        delete listings[tokenId];
    }
}
