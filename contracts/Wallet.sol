// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
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

    // Disambiguating salt for the EIP 712 protocol
    bytes32 private SALT = 0xdbfa5a2ed8eaf81bdaec2b889699814aa810a7653c8402c0a286fa1bfa105f5b;

    uint256 public nonce; // (only) mutable state
    uint256 public threshold; // immutable state
    mapping(address => bool) public isOwner; // immutable state
    address[] public ownersArr; // immutable state

    bytes32 private DOMAIN_SEPARATOR; // hash for EIP712, computed from contract address

    // Note that owners_ must be strictly increasing, in order to prevent duplicates
    constructor(
        uint256 threshold_,
        address[] memory owners_,
        uint256 chainId
    ) {
        require(owners_.length <= 10, "Maximum 10 owners can be added");
        require(threshold_ <= owners_.length, "Threshold must be less than or equal to number of owners");
        require(threshold_ > 0, "Minimum 1 threshold is required");

        address lastAdd = address(0);
        for (uint256 i = 0; i < owners_.length; i++) {
            require(owners_[i] > lastAdd, "In order to prevent duplciates pass owners in ascending order");
            isOwner[owners_[i]] = true;
            lastAdd = owners_[i];
        }
        ownersArr = owners_;
        threshold = threshold_;

        DOMAIN_SEPARATOR = keccak256(abi.encode(EIP712DOMAINTYPE_HASH, NAME_HASH, VERSION_HASH, chainId, this, SALT));
    }

    event SafeReceived(address indexed sender, uint256 value);

    /// @dev Fallback function accepts Ether transactions.
    receive() external payable {
        emit SafeReceived(msg.sender, msg.value);
    }

    // Note that address recovered from signatures must be strictly increasing, in order to prevent duplicates
    function execute(
        uint8[] memory sigV,
        bytes32[] memory sigR,
        bytes32[] memory sigS,
        address destination,
        uint256 value,
        bytes memory data,
        address executor,
        uint256 gasLimit
    ) public {
        require(sigR.length >= threshold, "Below threshold");
        require(sigR.length == sigS.length && sigR.length == sigV.length, "Length of array of R, S and V should match");
        require(executor == msg.sender, "Persona calling the fuction should be passed as executor");

        // EIP712 scheme: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        bytes32 txInputHash =
            keccak256(abi.encode(TXTYPE_HASH, destination, value, keccak256(data), nonce, executor, gasLimit));

        bytes32 totalHash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, txInputHash));
        // console.log("input");
        // console.logBytes(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, txInputHash));
        // console.log("domain seperator");
        // console.logBytes32(DOMAIN_SEPARATOR);
        console.log("totalHash");
        console.logBytes32(totalHash);

        address lastAdd = address(0); // cannot have address(0) as an owner
        for (uint256 i = 0; i < threshold; i++) {
            address recovered = ecrecover(totalHash, sigV[i], sigR[i], sigS[i]);
            console.log(recovered);
            require(
                recovered > lastAdd && isOwner[recovered],
                "In order to prevent duplciates pass owners in ascending order"
            );
            lastAdd = recovered;
        }

        // If we make it here all signatures are accounted for.
        // The address.call() syntax is no longer recommended, see:
        // https://github.com/ethereum/solidity/issues/2884
        nonce = nonce + 1;
        bool success = false;
        assembly {
            success := call(gasLimit, destination, value, add(data, 0x20), mload(data), 0, 0)
        }
        require(success, "Transaction Failed");
    }

    function testUint(
        uint8[] memory sigV,
        bytes32[] memory sigR,
        bytes32[] memory sigS,
        address destination,
        uint256 value,
        bytes memory data,
        address executor,
        uint256 gasLimit
    ) public pure returns (uint256) {
        return value;
    }
}
