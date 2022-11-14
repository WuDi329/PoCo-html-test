// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract ServiceRegistry is Initializable {
    enum Role {
        MESSENGER
    }

    struct Record {
        string endpoint;
        Role role;
    }

    mapping(address => Record) records;

    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet users;

    event NewService(
        Role indexed role,
        address indexed provider,
        string endpoint
    );
    event ServiceUpdate(
        Role indexed role,
        address indexed provider,
        string endpoint
    );

    function initialize() public initializer {
        __UserRegistry_init_unchained();
    }

    function __UserRegistry_init() internal onlyInitializing {
        __UserRegistry_init_unchained();
    }

    function __UserRegistry_init_unchained() internal onlyInitializing {}

    function setRecord(Record memory record) public {
        records[msg.sender] = record;

        if (!users.contains(msg.sender)) {
            emit NewService(record.role, msg.sender, record.endpoint);
        } else {
            emit ServiceUpdate(record.role, msg.sender, record.endpoint);
        }
    }

    function getRecord(address user) public view returns (Record memory) {
        return records[user];
    }

    // **Very Expensive, Just for development usage**
    function getUsers() public view returns (address[] memory) {
        return users.values();
    }
}
