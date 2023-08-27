// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PhatRollupAnchor.sol";

contract GameChoice is PhatRollupAnchor, Ownable {
    event ResponseReceived(uint256 value);
    event ErrorReceived(uint256 errno);

    event NewCollectRequest(uint reqId, string profileId);
    uint constant TYPE_RESPONSE = 0;
    uint constant TYPE_ERROR = 2;

    mapping(uint => string) requests;
    mapping(uint => address) public requestsByUsers;
    uint nextRequest = 1;

    constructor(address phatAttestor) {
        _grantRole(PhatRollupAnchor.ATTESTOR_ROLE, phatAttestor);
    }
    
    function setAttestor(address phatAttestor) public {
        _grantRole(PhatRollupAnchor.ATTESTOR_ROLE, phatAttestor);
    }

    // receives profileid data and user submitted score from frontend
    function compare(string calldata profileId) public {
        bytes memory bytesProfileId = bytes(profileId);
        // perform check if profile id is valid
        require(bytesProfileId.length > 2, "Lens Profile ID invalid");
        require(bytesProfileId[0] == "0" && bytesProfileId[1] == "x", "Lens Profile ID invalid");
        address sender = msg.sender;
        // keep track of number of ID
        uint id = nextRequest;
        requests[id] = profileId;
        requestsByUsers[id] = sender;
        _pushMessage(abi.encode(id, profileId));
        emit NewCollectRequest(id, profileId);
        nextRequest += 1;
    }

    // For test
    function malformedRequest(bytes calldata malformedData) public {
        uint id = nextRequest;
        requests[id] = "malformed_req";
        _pushMessage(malformedData);
        nextRequest += 1;
    }

    function _onMessageReceived(bytes calldata action) internal override {
        require(action.length == 32 * 3, "cannot parse action");
        (uint respType, uint id, uint256 data) = abi.decode(
            action,
            (uint, uint, uint256)
        );
        // check if the type_Response is in the lens api oracle ?
        if (respType == TYPE_RESPONSE) {
            emit ResponseReceived(data);
            delete requests[id];
            delete requestsByUsers[id];
        } else if (respType == TYPE_ERROR) {
            emit ErrorReceived(data);
            delete requests[id];
        }
    }
}
