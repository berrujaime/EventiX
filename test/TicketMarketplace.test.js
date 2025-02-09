const { expect } = require("chai");
const { getAddress } = require("ethers");
const { ethers } = require("hardhat");

describe("TicketMarketplace", function () {
  let eventiX, marketplace, owner, addr1, addr2;
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const EventiX = await ethers.getContractFactory("EventiXTickets");
    eventiX = await EventiX.deploy();
    await eventiX.waitForDeployment();

    const TicketMarketplace = await ethers.getContractFactory("TicketMarketplace");
    marketplace = await TicketMarketplace.deploy(eventiX.getAddress());
    await marketplace.waitForDeployment();

    const eventDate = Math.floor(new Date("2025-06-01T17:00:00Z").getTime() / 1000);
    await eventiX.createEvent(
      "Concert",
      eventDate,
      "Madrid",
      100,
      ethers.parseEther("0.1"),
      true,
      ethers.parseEther("0.15")
    );
  });

  it("Should list a ticket successfully", async function () {
    await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });
    await marketplace.connect(addr1).listTicket(1, ethers.parseEther("0.1"));
    const listing = await marketplace.listings(1);
    expect(listing.seller).to.equal(addr1.address);
    expect(listing.price.toString()).to.equal(ethers.parseEther("0.1").toString());
  });

  it("Should not allow listing if caller is not the owner", async function () {
    await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });
    await expect(marketplace.connect(addr2).listTicket(1, ethers.parseEther("0.1")))
      .to.be.revertedWith("Not owner");
  });

  it("Should not allow listing if resale is not allowed", async function () {
    const eventDate = Math.floor(new Date("2025-06-01T17:00:00Z").getTime() / 1000);
    await eventiX.createEvent(
      "No Resale Event",
      eventDate,
      "Madrid",
      100,
      ethers.parseEther("0.1"),
      false,
      0
    );
    await eventiX.connect(addr1).buyTicket(2, 1, { value: ethers.parseEther("0.1") });
    await expect(
      marketplace.connect(addr1).listTicket(1, ethers.parseEther("0.1"))
    ).to.be.revertedWith("Resale not allowed");
  });

  it("Should not allow listing if price exceeds resale cap", async function () {
    await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });
    await expect(
      marketplace.connect(addr1).listTicket(1, ethers.parseEther("0.16"))
    ).to.be.revertedWith("Exceeds resale cap");
  });

  it("Should allow delisting a ticket", async function () {
    await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });
    await marketplace.connect(addr1).listTicket(1, ethers.parseEther("0.1"));
    await marketplace.connect(addr1).delistTicket(1);
    const listing = await marketplace.listings(1);
    expect(listing.price).to.equal(0);
    expect(listing.seller).to.equal(zeroAddress);
  });

  it("Should not allow delisting by non-seller", async function () {
    await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });
    await marketplace.connect(addr1).listTicket(1, ethers.parseEther("0.1"));
    await expect(marketplace.connect(addr2).delistTicket(1))
      .to.be.revertedWith("Not seller");
  });

  it("Should allow buying a listed ticket", async function () {
    await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });
    await marketplace.connect(addr1).listTicket(1, ethers.parseEther("0.1"));
    await eventiX.connect(addr1).approve(marketplace.getAddress(), 1);
    expect(await eventiX.ownerOf(1)).to.equal(addr1.address);
    await marketplace.connect(addr2).buyTicket(1, { value: ethers.parseEther("0.2") });
    expect(await eventiX.ownerOf(1)).to.equal(addr2.address);
    const listingAfter = await marketplace.listings(1);
    expect(listingAfter[0]).to.equal(zeroAddress);
    expect(listingAfter[1]).to.equal(0);
  });

  it("Should not allow buying a ticket that is not listed", async function () {
    await expect(
      marketplace.connect(addr2).buyTicket(1, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("Not listed");
  });

  it("Should not allow buying with insufficient payment", async function () {
    await eventiX.connect(addr1).buyTicket(1, 1, { value: ethers.parseEther("0.1") });
    await marketplace.connect(addr1).listTicket(1, ethers.parseEther("0.1"));
    await expect(
      marketplace.connect(addr2).buyTicket(1, { value: ethers.parseEther("0.05") })
    ).to.be.revertedWith("Insufficient payment");
  });
});
