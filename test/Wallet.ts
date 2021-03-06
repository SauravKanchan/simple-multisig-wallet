import { expect } from "chai";
import { ethers } from "hardhat";

import { Wallet__factory } from "../typechain";

const TXTYPE_HASH = "0x3ee892349ae4bbe61dce18f95115b5dc02daf49204cc602458cd4c1f540d56d7";
const NAME_HASH = "0x3e6b336688739eb28fb1cb4076d6b7bd95a261dae357a212de0d58fe51c68128";
const VERSION_HASH = "0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6";
const EIP712DOMAINTYPE_HASH = "0xd87cd6ef79d4e2b95e15ce8abf732db51ec771f1ca2edccf22a46c729ac56472";
const SALT = "0xdbfa5a2ed8eaf81bdaec2b889699814aa810a7653c8402c0a286fa1bfa105f5b";
const CHAINID = 3;
let DOMAIN_SEPARATOR: string;

describe("Wallet create", () => {
  let Wallet: Wallet__factory, wallet: any, owner1: any, owner2: any, owner3: any, owners: any[];

  const createSigs = async (
    signers: any[],
    multisigAddr: string,
    nonce: number,
    destinationAddr: string,
    value: any,
    data: any,
    executor: any,
    gasLimit: any,
  ) => {
    const domainData =
      EIP712DOMAINTYPE_HASH +
      NAME_HASH.slice(2) +
      VERSION_HASH.slice(2) +
      CHAINID.toString(16).padStart(64, "0") +
      multisigAddr.slice(2).padStart(64, "0").toLowerCase() +
      SALT.slice(2);
    DOMAIN_SEPARATOR = ethers.utils.keccak256(domainData);

    const txInput =
      TXTYPE_HASH +
      destinationAddr.slice(2).padStart(64, "0") +
      value.toHexString().slice(2).padStart(64, "0") +
      ethers.utils.id(data).slice(2).padStart(64, "0") +
      nonce.toString(16).padStart(64, "0") +
      executor.slice(2).padStart(64, "0") +
      gasLimit.toString(16).padStart(64, "0");
    const txInputHash = ethers.utils.keccak256(txInput.toLowerCase());

    const input = ethers.utils.arrayify(DOMAIN_SEPARATOR + txInputHash.slice(2));

    const sigV: number[] = [];
    const sigR: string[] = [];
    const sigS: string[] = [];

    for (let i = 0; i < signers.length; i++) {
      const flat = await signers[i].signMessage(input);
      const sig = ethers.utils.splitSignature(flat);
      sigV.push(sig.v);
      sigR.push(sig.r);
      sigS.push(sig.s);
    }

    return { sigV: sigV, sigR: sigR, sigS: sigS };
  };

  beforeEach(async () => {
    Wallet = (await ethers.getContractFactory("Wallet")) as Wallet__factory;

    [owner1, owner2, owner3] = await ethers.getSigners();
    owners = [owner1.address, owner2.address, owner3.address].sort();

    wallet = await Wallet.deploy(2, [owner1.address, owner2.address, owner3.address].sort(), CHAINID);
    const amount = "1.0";
    const tx = await owner2.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther(amount),
    });
    await tx.wait();
  });

  describe("Owners", () => {
    it("should match orignal owners", async () => {
      for (let i = 0; i < owners.length; i++) {
        expect(await wallet.ownersArr(i)).to.equal(owners[i]);
      }
    });
  });

  describe("Wallet balances", () => {
    it("should recieve ethers", async () => {
      const inital_balance = parseFloat(ethers.utils.formatEther(await wallet.provider.getBalance(wallet.address)));
      const amount = 1;
      const tx = await owner2.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther(amount.toString()),
      });
      await tx.wait();
      const final_balance = parseFloat(ethers.utils.formatEther(await wallet.provider.getBalance(wallet.address)));
      expect(final_balance - inital_balance).equal(amount);
    });
  });

  describe("Transactions", () => {
    it("should transfer funds to outside account", async () => {
      const signers = [owner1, owner2].sort((a: any, b: any): number => {
        if (a.address > b.address) return 1;
        if (a.address < b.address) return -1;
        return 1;
      });
      const toAddress = owner3.address;

      const value = ethers.utils.parseUnits("1.0", 18);
      let gas = parseInt(await wallet.provider.getGasPrice());
      const data = ethers.utils.toUtf8Bytes("");
      const inital_balance = parseFloat(ethers.utils.formatEther(await wallet.provider.getBalance(wallet.address)));

      const sig = await createSigs(
        signers,
        wallet.address,
        parseInt(await wallet.nonce()),
        toAddress,
        value,
        data,
        owner1.address,
        gas,
      );
      const tx = await wallet.execute(sig.sigV, sig.sigR, sig.sigS, toAddress, value, data, owner1.address, gas);
      await tx.wait();

      const final_balance = parseFloat(ethers.utils.formatEther(await wallet.provider.getBalance(wallet.address)));
      expect(inital_balance - final_balance).equal(parseFloat(ethers.utils.formatEther(value)));
    });
  });
});
