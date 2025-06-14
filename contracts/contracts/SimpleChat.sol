pragma solidity ^0.8.8;

error SimpleChatError(string message);

contract SimpleChat {
    struct UserAccount {
        bytes encryptedPrivateKey;
        bool pubKeyY;
        bytes32 pubKey;
    }

    event MessageTransmitted(
        address indexed sender,
        address indexed recipient,
        string encryptedData,
        uint256 timestamp
    );
    event UserJoined(address user);
    event ChatLinkCreated(address indexed user1, address indexed user2);

    mapping(address => UserAccount) public userAccounts;
    mapping(address => mapping(address => bytes)) public chatLinks;

    function isActiveChat(address user, address partner) public view returns (bool) {
       return !(chatLinks[user][partner].length == 0 && chatLinks[partner][user].length == 0);
    }

    function isUserExist(address u) public view returns (bool) {
        return !(userAccounts[u].encryptedPrivateKey.length == 0);
    }

    function joinChat(
        bytes calldata encryptedKey,
        bytes32 pubKey,
        bool pubKeyY
    ) external {
        if (isUserExist(msg.sender)) {
            revert SimpleChatError("User already joined");
        }

        userAccounts[msg.sender] = UserAccount({
            encryptedPrivateKey: encryptedKey,
            pubKey: pubKey,
            pubKeyY: pubKeyY
        });

        emit UserJoined(msg.sender);
    }

    function createChatLink(
        address partner,
        bytes calldata userKey,
        bytes calldata partnerKey
    ) external {
        if (!isUserExist(partner)) {
            revert SimpleChatError("Partner not registered");
        }
        if (msg.sender == partner) {
            revert SimpleChatError("Cannot create chat with self");
        }
        if (chatLinks[msg.sender][partner].length > 0) {
            revert SimpleChatError("Chat link already exists");
        }

        chatLinks[msg.sender][partner] = userKey;
        chatLinks[partner][msg.sender] =  partnerKey;

        emit ChatLinkCreated(msg.sender, partner);
    }

    function sendChatMessage(
        address recipient,
        string calldata encryptedData,
        uint256 time
    ) external {
        if(!isActiveChat(msg.sender, recipient)){
            revert SimpleChatError("No active chat with this partner");
        }
        emit MessageTransmitted(msg.sender, recipient, encryptedData, time);
    }

    receive() external payable {}
}