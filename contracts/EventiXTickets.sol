// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract EventiXTickets is ERC721URIStorage, Ownable {
    struct Event {
        string name;
        uint256 date;
        string location;
        uint256 maxTickets;
        uint256 price;
        bool resaleAllowed;
        uint256 resalePriceCap;
        uint256 ticketsSold;
    }

    uint256 private eventIdCounter = 1;
    mapping(uint256 => Event) public events;

    uint256 private ticketIdCounter = 1;
    // Relation ticket with event
    mapping(uint256 => uint256) public ticketToEvent;
    // Indicates if a ticket has been used
    mapping(uint256 => bool) public usedTickets;

    event EventCreated(uint256 eventId, string name, uint256 date, string location);
    event TicketBought(uint256 ticketId, uint256 eventId, address buyer);
    event TicketValidated(uint256 ticketId, address owner);


    constructor() ERC721("EventiXTickets", "EVTIX") Ownable (msg.sender) {}

    function createEvent(
        string memory _name,
        uint256 _date,
        string memory _location,
        uint256 _maxTickets,
        uint256 _price,
        bool _resaleAllowed,
        uint256 _resalePriceCap
    ) public onlyOwner {
        require(_date > block.timestamp, "Event date must be in the future");
        
        uint256 eventId = eventIdCounter;
        events[eventId] = Event({
            name: _name,
            date: _date,
            location: _location,
            maxTickets: _maxTickets,
            price: _price,
            resaleAllowed: _resaleAllowed,
            resalePriceCap: _resalePriceCap,
            ticketsSold: 0
        });
        eventIdCounter++;
        emit EventCreated(eventId, _name, _date, _location);
    }

    function buyTicket(uint256 eventId, uint256 quantity) public payable {
        uint256 totalCost = events[eventId].price * quantity;
        require(events[eventId].maxTickets > 0, "Event doesn't exist");
        require(
            events[eventId].ticketsSold + quantity <= events[eventId].maxTickets,
            "No tickets available"
        );
        require(bytes(events[eventId].name).length > 0, "Event doesn't exist");
        require(msg.value >= totalCost, "Insufficient funds");
        require(block.timestamp < events[eventId].date, "Ticket sales closed: Event has started or passed");
        require(block.timestamp < events[eventId].date - 1 hours, "Less than 1 hour to event");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 newTicketId = ticketIdCounter;
            _safeMint(msg.sender, newTicketId);
            _setTokenURI(newTicketId, string(abi.encodePacked("https://eventix.xyz/metadata/", Strings.toString(eventId), "/", Strings.toString(newTicketId), ".json")));
            ticketToEvent[newTicketId] = eventId;
            ticketIdCounter++;
            emit TicketBought(newTicketId, eventId, msg.sender);
        }
        events[eventId].ticketsSold += quantity;

        // Refund any excess funds
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    // Validate the ticket without burning it; simply mark it as used.
    // It uses the tokenId to identify the ticket.
    function validateTicket(uint256 ticketId) public onlyOwner {
        require(!usedTickets[ticketId], "Ticket already used");

        // This will revert if the ticket does not exist
        ownerOf(ticketId);
        usedTickets[ticketId] = true;
        emit TicketValidated(ticketId, ownerOf(ticketId));
    }

    function withdrawFunds() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
