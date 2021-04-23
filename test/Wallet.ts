import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumberish } from "ethers";

import { Wallet__factory } from "../typechain";

const TXTYPE_HASH = "0x3ee892349ae4bbe61dce18f95115b5dc02daf49204cc602458cd4c1f540d56d7";
const NAME_HASH = "0x3e6b336688739eb28fb1cb4076d6b7bd95a261dae357a212de0d58fe51c68128";
const VERSION_HASH = "0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6";
const EIP712DOMAINTYPE_HASH = "0xd87cd6ef79d4e2b95e15ce8abf732db51ec771f1ca2edccf22a46c729ac56472";
const SALT = "0x251543af6a222378665a76fe38dbceae4871a070b7fdaf5c6c30cf758dc33cc0";
const CHAINID = 3;
let DOMAIN_SEPARATOR: String;

describe("Wallet create", () => {
  let Wallet, wallet, owner1, owner2, owner3;

  let createSigs = async (
    signers: any,
    multisigAddr: String,
    nonce: Number,
    destinationAddr: String,
    value: Number,
    data: any,
    executor: any,
    gasLimit: any,
  ) => {
    const domainData =
      EIP712DOMAINTYPE_HASH +
      NAME_HASH.slice(2) +
      VERSION_HASH.slice(2) +
      CHAINID.toString("16").padStart(64, "0") +
      multisigAddr.slice(2).padStart(64, "0") +
      SALT.slice(2);
    DOMAIN_SEPARATOR = ethers.utils.id(domainData);

    let txInput =
      TXTYPE_HASH +
      destinationAddr.slice(2).padStart(64, "0") +
      value.toString("16").padStart(64, "0") +
      ethers.utils.id(data).slice(2) +
      nonce.toString("16").padStart(64, "0") +
      executor.slice(2).padStart(64, "0") +
      gasLimit.toString("16").padStart(64, "0");
    let txInputHash = ethers.utils.id(txInput);

    let input = "0x19" + "01" + DOMAIN_SEPARATOR.slice(2) + txInputHash.slice(2);
    let hash = ethers.utils.id(input);

    let sigV = [];
    let sigR = [];
    let sigS = [];

    for (var i = 0; i < signers.length; i++) {
      //   let sig = lightwallet.signing.signMsgHash(lw, keyFromPw, hash, signers[i]);
      let sig = ethers.utils.splitSignature(await signers[i].signMessage());
      sigV.push(sig.v);
      sigR.push(sig.r);
      sigS.push(sig.s);
    }

    return { sigV: sigV, sigR: sigR, sigS: sigS };
  };

  beforeEach(async () => {
    Wallet = (await ethers.getContractFactory("Wallet")) as Wallet__factory;

    [owner1, owner2, owner3] = await ethers.getSigners();

    wallet = Wallet.deploy(2, [owner1.address, owner2.address, owner3.address].sort(), CHAINID);

    
  });
});
