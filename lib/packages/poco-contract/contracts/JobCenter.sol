// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract JobCenter is OwnableUpgradeable {
    using EnumerableSet for EnumerableSet.UintSet;

    struct Job {
        address owner;
        address messenger;
        address submitter;
        bytes32 secret;
    }

    mapping(uint256 => Job) jobs;
    EnumerableSet.UintSet activeJobs;

    uint256 nextJobId;

    event NewJob(uint256 indexed jobId, address owner, address messenger);
    event SubmitJob(uint256 indexed jobId, address claimer);

    function initialize() public initializer {
        __JobCenter_init_unchained();
    }

    function __JobCenter_init() internal onlyInitializing {
        __JobCenter_init_unchained();
    }

    function __JobCenter_init_unchained() internal onlyInitializing {
        __Ownable_init_unchained();

        nextJobId = 1;
    }

    function postJob(address messager, bytes32 secret)
        public
        returns (uint256 jobId)
    {
        jobId = nextJobId++;

        jobs[jobId] = Job(msg.sender, messager, address(0), secret);
        activeJobs.add(jobId);

        emit NewJob(jobId, msg.sender, messager);
    }

    function submitJob(uint256 jobId, bytes memory key) public {
        require(activeJobs.contains(jobId), "job must be active");
        require(jobs[jobId].submitter == address(0), "job must be avaliable");
        require(
            jobs[jobId].secret == keccak256(key),
            "key must match the sercret"
        );

        activeJobs.remove(jobId);
        jobs[jobId].submitter = msg.sender;

        emit SubmitJob(jobId, msg.sender);
    }

    function activeJobCount() public view returns (uint256) {
        return activeJobs.length();
    }

    function jobCount() public view returns (uint256) {
        return nextJobId - 1;
    }

    // **Very Expensive, Just for development usage**
    function getJobs() public view returns (uint256[] memory) {
        return activeJobs.values();
    }
}
