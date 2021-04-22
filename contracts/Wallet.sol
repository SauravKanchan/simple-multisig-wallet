// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// @title Simple MultiSig Wallet
// @author Saurav Kanchan
contract Wallet {
    // EIP712 Precomputed hashes:
    // keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)")
    bytes32 private constant EIP712DOMAINTYPE_HASH = 0xd87cd6ef79d4e2b95e15ce8abf732db51ec771f1ca2edccf22a46c729ac56472;

    // keccak256("Simple MultiSig Wallet")
    bytes32 private constant NAME_HASH = 0x3e6b336688739eb28fb1cb4076d6b7bd95a261dae357a212de0d58fe51c68128;

    // keccak256("1")
    bytes32 private constant VERSION_HASH = 0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6;

    // keccak256("MultiSigTransaction(address destination,uint256 value,bytes data,uint256 nonce,address executor,uint256 gasLimit)")
    bytes32 private constant TXTYPE_HASH = 0x3ee892349ae4bbe61dce18f95115b5dc02daf49204cc602458cd4c1f540d56d7;

    uint256 public nonce; // (only) mutable state
    uint256 public threshold; // immutable state
    mapping(address => bool) public isOwner; // immutable state
    address[] public ownersArr; // immutable state

    bytes32 private DOMAIN_SEPARATOR; // hash for EIP712, computed from contract address

    // Note that owners_ must be strictly increasing, in order to prevent duplicates
    constructor(
        uint256 threshold_,
        address[] owners_,
        uint256 chainId
    ) public {
        require(owners_.length <= 10, "Maximum 10 owners can be added");
        require(threshold_ <= owners_.length, "Threshold must be less than or equal to number of owners");
        require(threshold_ > 0, "Minimum 1 threshold is required");

        address lastAdd = address(0);
        for (uint256 i = 0; i < owners_.length; i++) {
            require(owners_[i] > lastAdd);
            isOwner[owners_[i]] = true;
            lastAdd = owners_[i];
        }
        ownersArr = owners_;
        threshold = threshold_;

        DOMAIN_SEPARATOR = keccak256(abi.encode(EIP712DOMAINTYPE_HASH, NAME_HASH, VERSION_HASH, chainId, this, SALT));
    }
}
