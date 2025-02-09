const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EventiXTickets", function () {
    let eventiX, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const EventiX = await ethers.getContractFactory("EventiXTickets");
        eventiX = await EventiX.deploy();
    });

    // Function to generate the fixed timestamp for June 1, 2025, at 17:00 UTC
    function getFixedEventDate() {
        return Math.floor(new Date("2025-06-01T17:00:00Z").getTime() / 1000);
    }

    it("Should allow the creation of an event", async function () {
        const eventDate = getFixedEventDate();
        await eventiX.createEvent(
            "Concert",
            eventDate,
            "Madrid",
            100,
            ethers.parseEther("0.1"),
            true,
            ethers.parseEther("0.15")
        );

        const eventDetails = await eventiX.events(1);
        expect(eventDetails.name).to.equal("Concert");
        expect(eventDetails.date).to.equal(eventDate);
    });

    it("Should not allow creating an event in the past", async function () {
      // Simulate a past date (1 day before current timestamp)
      const pastEventDate = Math.floor(Date.now() / 1000) - 86400; // 86400 seconds = 1 day
  
      // Attempt to create an event with a past date
      await expect(
          eventiX.createEvent(
              "Expired Event",
              pastEventDate,
              "Madrid",
              100,
              ethers.parseEther("0.1"),
              true,
              ethers.parseEther("0.15")
          )
      ).to.be.revertedWith("Event date must be in the future");
    });  

    it("Should allow purchasing a ticket and assign a unique NFT", async function () {
        const eventDate = getFixedEventDate();
        await eventiX.createEvent(
            "Concert",
            eventDate,
            "Madrid",
            100,
            ethers.parseEther("0.1"),
            true,
            ethers.parseEther("0.15")
        );

        await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });

        // Verify that addr1 received an NFT
        const ownerOfToken1 = await eventiX.ownerOf(1);
        expect(ownerOfToken1).to.equal(addr1.address);
    });

    it("Should not allow purchasing a ticket for a past event", async function () {
      // Get current blockchain time
      const latestBlock = await ethers.provider.getBlock("latest");
      const now = latestBlock.timestamp;
  
      const pastEventDate = now + 5; // Event will happen in 5 seconds
  
      // Set next block timestamp to ensure `createEvent` works correctly
      await ethers.provider.send("evm_setNextBlockTimestamp", [now + 1]);
      await ethers.provider.send("evm_mine");
  
      // Create an event scheduled 5 seconds in the future
      await eventiX.createEvent(
          "Past Event",
          pastEventDate,
          "Madrid",
          100,
          ethers.parseEther("0.1"),
          true,
          ethers.parseEther("0.15")
      );
  
      // Move blockchain time forward so the event is now in the past
      await ethers.provider.send("evm_setNextBlockTimestamp", [pastEventDate + 1]);
      await ethers.provider.send("evm_mine");
  
      // Attempt to buy a ticket for the past event
      await expect(
          eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Ticket sales closed: Event has started or passed");
    });
  
  

    it("Should not allow purchasing a ticket less than 1 hour before the event", async function () {
        // Simulate an event happening in less than 1 hour
        const nearEventDate = Math.floor(Date.now() / 1000) + 3599; // 3599 seconds = 59 minutes

        await eventiX.createEvent(
            "Last Minute Event",
            nearEventDate,
            "Madrid",
            100,
            ethers.parseEther("0.1"),
            true,
            ethers.parseEther("0.15")
        );

        // Attempt to buy a ticket when there is less than 1 hour to the event
        await expect(
            eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") })
        ).to.be.revertedWith("Less than 1 hour to event");
    });

    it("Should allow the transfer of a ticket between wallets", async function () {
        const eventDate = getFixedEventDate();
        await eventiX.createEvent(
            "Concert",
            eventDate,
            "Madrid",
            100,
            ethers.parseEther("0.1"),
            true,
            ethers.parseEther("0.15")
        );

        await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });

        // Transfer the NFT from addr1 to addr2
        await eventiX.connect(addr1)["safeTransferFrom(address,address,uint256)"](
            addr1.address,
            addr2.address,
            1
        );

        // Verify that addr2 is now the owner of the ticket
        const ownerOfToken1 = await eventiX.ownerOf(1);
        expect(ownerOfToken1).to.equal(addr2.address);
    });

    it("Should allow ticket validation", async function () {
        const eventDate = getFixedEventDate();
        await eventiX.createEvent(
            "Concert",
            eventDate,
            "Madrid",
            100,
            ethers.parseEther("0.1"),
            true,
            ethers.parseEther("0.15")
        );

        await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });

        await eventiX.validateTicket(1);

        const used = await eventiX.usedTickets(1);
        expect(used).to.equal(true);
    });

    it("Should not allow validating an already validated ticket", async function () {
        const eventDate = getFixedEventDate();
        await eventiX.createEvent(
            "Concert",
            eventDate,
            "Madrid",
            100,
            ethers.parseEther("0.1"),
            true,
            ethers.parseEther("0.15")
        );

        await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });

        await eventiX.validateTicket(1);
        await expect(eventiX.validateTicket(1)).to.be.revertedWith("Ticket already used");
    });

    it("Should refund excess funds after buying a ticket", async function () {
      const eventDate = getFixedEventDate();
      await eventiX.createEvent(
          "Concert",
          eventDate,
          "Madrid",
          100,
          ethers.parseEther("0.1"),
          true,
          ethers.parseEther("0.15")
      );
      
      const initialBalance = await ethers.provider.getBalance(addr1.address);

      const tx = await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.2") });
      const receipt = await tx.wait(); // Wait for the transaction to be mined
      // Calculate gas cost
      const gasUsed = receipt.gasUsed;
      const gasPrice = tx.gasPrice;
      const gasCost = gasUsed * gasPrice; // Total cost in wei

      // Verify that addr1 received an NFT
      const ownerOfToken1 = await eventiX.ownerOf(1);
      expect(ownerOfToken1).to.equal(addr1.address);

      // Verify that addr1 received the correct amount of funds
      const balanceAfter = await ethers.provider.getBalance(addr1.address);
      expect(balanceAfter).to.equal(initialBalance - ethers.parseEther("0.1") - gasCost);
    });

    it("Should allow the owner to withdraw funds and not allow non-owners", async function () {
      const eventDate = getFixedEventDate();
      await eventiX.createEvent(
        "Concert",
        eventDate,
        "Madrid",
        100,
        ethers.parseEther("0.1"),
        true,
        ethers.parseEther("0.15")
      );
    
      await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });
    
      eventiXaddress = await eventiX.getAddress();
      
      // Check that the contract received the funds
      const contractBalance = await ethers.provider.getBalance(eventiXaddress);
      expect(contractBalance).to.equal(ethers.parseEther("0.1"));
      
      // Owner withdraws funds
      await expect(() => eventiX.connect(owner).withdrawFunds())
        .to.changeEtherBalance(owner, ethers.parseEther("0.1"));
      
      // Confirm the contract balance is now zero.
      expect(await ethers.provider.getBalance(eventiXaddress)).to.equal(0);
      
      // Verify that non-owners cannot withdraw funds.
      await expect(eventiX.connect(addr1).withdrawFunds())
        .to.be.revertedWithCustomError(eventiX, 'OwnableUnauthorizedAccount');
    });
});
