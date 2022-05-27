import { providers } from 'ethers';

export class MockEthersProvider extends providers.BaseProvider {
    constructor() {
        const mockNetworkId = 123;
        super(mockNetworkId);
    }
}
