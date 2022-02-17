import { ethers } from "ethers";
import { ERC20ApproveRequest } from "../types";

const { config } = require('../config');

const getERC20ApproveDataToSign = async (data: ERC20ApproveRequest) => {
    const contract = data.contract;
    const contractInterface = new ethers.utils.Interface(JSON.stringify(data.abi));
    const userAddress = data.userAddress;
    const nonce = await (contract.getNonce ? contract.getNonce(userAddress) : contract.nonces(userAddress));
    const functionSignature = contractInterface.encodeFunctionData("approve", [data.spender, data.amount]);
    const message = {
        nonce : parseInt(nonce, 10),
        from : userAddress,
        functionSignature
    };

    const domainData = {
        name: data.name,
        version: data.version,
        verifyingContract: data.address,
        salt: data.salt
    }
    const dataToSign = JSON.stringify({
        types: {
            EIP712Domain: data.domainType,
            MetaTransaction: data.metaTransactionType
        },
        domain: domainData,
        primaryType: "MetaTransaction",
        message
    });
    return dataToSign;
}

const getMetaTxnCompatibleTokenData = (adddress: string, chainId: number) => {
    let data;
    if(adddress && chainId !== undefined) {
        data = config.metaTxnCompatibleTokenData[chainId][adddress.toLowerCase()];
    }
    return data;
}

const getSignatureParameters = (signature: string) => {
    if (!ethers.utils.isHexString(signature)) {
        throw new Error(
            'Given value "'.concat(signature, '" is not a valid hex string.')
        );
    }
    const r = signature.slice(0, 66);
    const s = "0x".concat(signature.slice(66, 130));
    const vString = "0x".concat(signature.slice(130, 132));
    let v = ethers.BigNumber.from(vString).toNumber();
    if (![27, 28].includes(v)) v += 27;
    return {
        r,
        s,
        v
    };
}

export {
	getERC20ApproveDataToSign,
	getMetaTxnCompatibleTokenData,
	getSignatureParameters
}