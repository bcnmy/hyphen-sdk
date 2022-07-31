import { ethers, providers } from 'ethers';

export class MockEthersProvider extends providers.BaseProvider {
    constructor() {
        const mockNetworkId = 123;
        super(mockNetworkId);
    }
}
export class MockEther extends ethers.Wallet {
    constructor() {
        super(ethers.utils.randomBytes(32));
    }

    Wallet(privateKey: string) {
        return new ethers.Wallet(privateKey);
    }
}